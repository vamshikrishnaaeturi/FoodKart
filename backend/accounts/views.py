import logging
import json
import secrets
import hashlib
import re
import os
import urllib.request
import urllib.error

from datetime import timedelta
from decimal import Decimal, InvalidOperation

from PIL import Image

from django.conf import settings
from django.shortcuts import redirect, render, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django.db import transaction
from django.core.files.storage import default_storage

from .models import EmailOTP, Profile, SavedAddress


logger = logging.getLogger(__name__)


# =====================================================
# VERIFY EMAIL OTP
# =====================================================

def check_email_otp(email, purpose, entered_otp):

    otp_record = EmailOTP.objects.filter(
        email=email,
        purpose=purpose
    ).first()

    if not otp_record:
        return False, "OTP not found. Please request a new OTP.", None

    # Check expiry
    if timezone.now() > otp_record.expires_at:

        otp_record.delete()

        return False, "OTP expired. Please request a new OTP.", None

    # Check maximum attempts
    if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:

        otp_record.delete()

        return False, "Maximum OTP attempts reached. Request a new OTP.", None

    # Verify OTP
    if hash_otp(entered_otp) != otp_record.otp_hash:

        otp_record.attempts += 1

        otp_record.save(
            update_fields=["attempts"]
        )

        remaining_attempts = (
            settings.OTP_MAX_ATTEMPTS - otp_record.attempts
        )

        if remaining_attempts <= 0:

            otp_record.delete()

            return False, "Maximum OTP attempts reached. Request a new OTP.", None

        return (
            False,
            f"Incorrect OTP. {remaining_attempts} attempts remaining.",
            None
        )

    # OTP verified successfully
    return True, "OTP verified successfully.", otp_record


# =====================================================
# LOGOUT
# =====================================================

@login_required
@require_POST
def logout_view(request):

    logout(request)

    messages.success(
        request,
        "Logged out successfully!"
    )

    return redirect("home")


# =====================================================
# UPDATE PROFILE AND PROFILE IMAGE
# =====================================================

@login_required
@require_POST
def update_profile_view(request):

    user = request.user

    profile, created = Profile.objects.get_or_create(
        user=user,
        defaults={
            "name": user.first_name or user.username,
            "email": user.email,
            "phone": ""
        }
    )

    name = request.POST.get("name", "").strip()
    email = request.POST.get("email", "").strip().lower()
    phone = request.POST.get("phone", "").strip()

    new_picture = request.FILES.get("profile_picture")

    # Validate required fields
    if not all([name, email, phone]):

        messages.error(
            request,
            "Please fill all required fields."
        )

        return redirect("home")

    # Validate email
    try:

        validate_email(email)

    except ValidationError:

        messages.error(
            request,
            "Please enter a valid email address."
        )

        return redirect("home")

    # Check duplicate email
    if User.objects.filter(
        email__iexact=email
    ).exclude(pk=user.pk).exists():

        messages.error(
            request,
            "Email already in use."
        )

        return redirect("home")

    # Validate uploaded image
    if new_picture:

        allowed_formats = ["JPEG", "PNG", "WEBP"]

        if new_picture.size > 5 * 1024 * 1024:

            messages.error(
                request,
                "Profile picture must be smaller than 5 MB."
            )

            return redirect("home")

        try:

            new_picture.seek(0)

            image = Image.open(new_picture)

            if image.format not in allowed_formats:

                raise ValidationError(
                    "Invalid image format."
                )

            image.verify()

            new_picture.seek(0)

        except (
            ValidationError,
            OSError,
            ValueError
        ):

            messages.error(
                request,
                "Please upload a valid JPG, PNG or WEBP image."
            )

            return redirect("home")

    old_picture = (
        profile.profile_picture.name
        if profile.profile_picture
        else None
    )

    saved_picture_name = None

    try:

        # Upload the new image to Django media storage
        if new_picture:

            profile.profile_picture.save(
                new_picture.name,
                new_picture,
                save=False
            )

            saved_picture_name = profile.profile_picture.name

        with transaction.atomic():

            # Update Django user
            user.first_name = name
            user.email = email

            user.save(
                update_fields=[
                    "first_name",
                    "email"
                ]
            )

            # Update profile
            profile.name = name
            profile.email = email
            profile.phone = phone

            profile.save()

        # Delete old image after successful database save
        if (
            new_picture
            and old_picture
            and old_picture != saved_picture_name
        ):

            transaction.on_commit(
                lambda: default_storage.delete(old_picture)
            )

        messages.success(
            request,
            "Profile and profile picture updated successfully!"
        )

    except Exception:

        logger.exception(
            "Profile update failed."
        )

        if saved_picture_name:

            try:
                default_storage.delete(saved_picture_name)

            except Exception:

                logger.exception(
                    "Unable to clean up failed profile image upload."
                )

        messages.error(
            request,
            "Unable to update profile. Please try again."
        )

    return redirect("home")


# =====================================================
# SAVED ADDRESSES
# =====================================================

@login_required
@require_POST
def save_address_view(request):

    try:

        if request.content_type == "application/json":

            data = json.loads(request.body)

        else:

            data = request.POST

        address = data.get(
            "address", ""
        ).strip()

        address_type = data.get(
            "address_type", "Home"
        ).strip()

        latitude = data.get("latitude")
        longitude = data.get("longitude")

        if not address:

            return JsonResponse({
                "success": False,
                "message": "Please enter a delivery address."
            }, status=400)

        if address_type not in [
            "Home",
            "Work",
            "Other"
        ]:

            return JsonResponse({
                "success": False,
                "message": "Invalid address type."
            }, status=400)

        if bool(latitude) != bool(longitude):

            return JsonResponse({
                "success": False,
                "message": "Both coordinates are required."
            }, status=400)

        if latitude and longitude:

            latitude = Decimal(str(latitude))
            longitude = Decimal(str(longitude))

            if not (
                -90 <= latitude <= 90
                and -180 <= longitude <= 180
            ):

                return JsonResponse({
                    "success": False,
                    "message": "Invalid location coordinates."
                }, status=400)

        with transaction.atomic():

            is_first_address = not SavedAddress.objects.filter(
                user=request.user
            ).exists()

            is_default = (
                data.get("is_default") is True
                or data.get("is_default") == "true"
                or is_first_address
            )

            if is_default:

                SavedAddress.objects.filter(
                    user=request.user
                ).update(is_default=False)

            saved_address = SavedAddress.objects.create(
                user=request.user,
                address_type=address_type,
                address=address,
                latitude=latitude,
                longitude=longitude,
                is_default=is_default
            )

        return JsonResponse({
            "success": True,
            "message": "Address saved successfully!",
            "address": {
                "id": saved_address.id,
                "address_type": saved_address.address_type,
                "address": saved_address.address,
                "latitude": (
                    str(saved_address.latitude)
                    if saved_address.latitude is not None
                    else None
                ),
                "longitude": (
                    str(saved_address.longitude)
                    if saved_address.longitude is not None
                    else None
                ),
                "is_default": saved_address.is_default
            }
        })

    except (
        json.JSONDecodeError,
        InvalidOperation,
        TypeError,
        ValueError
    ):

        return JsonResponse({
            "success": False,
            "message": "Invalid address information."
        }, status=400)


# =====================================================
# DELETE SAVED ADDRESS
# =====================================================

@login_required
@require_POST
def delete_address_view(request, address_id):

    saved_address = get_object_or_404(
        SavedAddress,
        id=address_id,
        user=request.user
    )

    was_default = saved_address.is_default

    saved_address.delete()

    if was_default:

        next_address = SavedAddress.objects.filter(
            user=request.user
        ).first()

        if next_address:

            next_address.is_default = True

            next_address.save(
                update_fields=["is_default"]
            )

    return JsonResponse({
        "success": True,
        "message": "Address deleted successfully!"
    })


# =====================================================
# SET DEFAULT ADDRESS
# =====================================================

@login_required
@require_POST
def set_default_address_view(request, address_id):

    saved_address = get_object_or_404(
        SavedAddress,
        id=address_id,
        user=request.user
    )

    with transaction.atomic():

        SavedAddress.objects.filter(
            user=request.user
        ).update(is_default=False)

        saved_address.is_default = True

        saved_address.save(
            update_fields=["is_default"]
        )

    return JsonResponse({
        "success": True,
        "message": "Default address updated!"
    })


# =====================================================
# DELETE ACCOUNT
# =====================================================

@login_required
@require_POST
def delete_account_view(request):

    user = request.user

    user.delete()

    logout(request)

    messages.success(
        request,
        "Your account has been deleted."
    )

    return redirect("home")