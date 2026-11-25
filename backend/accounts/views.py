import logging
import json
import secrets
import hashlib
import re
from django.core.mail import EmailMultiAlternatives

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
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.core.files.storage import default_storage
from django.utils import timezone
from django.views.decorators.http import require_POST
from django.db import transaction

from .models import Profile, SavedAddress, EmailOTP


logger = logging.getLogger(__name__)


# =====================================================
# EMAIL OTP HELPERS
# =====================================================

def generate_otp():
    return f"{secrets.randbelow(1000000):06d}"


def hash_otp(otp):
    return hashlib.sha256(otp.encode()).hexdigest()


def send_email_otp(email, purpose, pending_data=None):
    
    now = timezone.now()

    # Check Gmail configuration
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        logger.error("Gmail email configuration is missing.")
        return False, "Email service is not configured. Please try again later."

    existing_otp = EmailOTP.objects.filter(
        email=email,
        purpose=purpose
    ).first()

    if existing_otp:

        elapsed = (
            now - existing_otp.last_sent_at
        ).total_seconds()

        if elapsed < settings.OTP_RESEND_WAIT_SECONDS:
            return False, "Please wait before requesting another OTP."

        if pending_data is None:
            pending_data = existing_otp.pending_data

        existing_otp.delete()

    otp = generate_otp()

    otp_record = EmailOTP.objects.create(
        email=email,
        purpose=purpose,
        otp_hash=hash_otp(otp),
        pending_data=pending_data or {},
        expires_at=now + timedelta(
            seconds=settings.OTP_EXPIRY_SECONDS
        )
    )

    try:

        subject = "FoodKart Email Verification OTP"

        text_message = (
            f"Your FoodKart OTP is {otp}.\n\n"
            "This OTP is valid for 5 minutes.\n"
            "Do not share it with anyone."
        )

        html_message = f"""
        <div style="font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: auto;
                    padding: 24px;">
            <h2>FoodKart Email Verification</h2>
            <p>Your FoodKart verification OTP is:</p>

            <h1 style="letter-spacing: 5px; color: #ff6b2b;">
                {otp}
            </h1>

            <p>This OTP is valid for 5 minutes.</p>
            <p>Do not share this OTP with anyone.</p>
        </div>
        """

        email_message = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email]
        )

        email_message.attach_alternative(
            html_message,
            "text/html"
        )

        email_message.send(fail_silently=False)

        logger.info("OTP email successfully sent to %s", email)

        return True, "OTP sent successfully."

    except Exception as error:

        logger.exception("Gmail OTP email sending failed: %s", error)

        otp_record.delete()

        return False, "Unable to send OTP. Please try again."

def check_email_otp(email, purpose, entered_otp):

    otp_record = EmailOTP.objects.filter(
        email=email,
        purpose=purpose
    ).first()

    if not otp_record:
        return False, "OTP not found. Please request a new OTP.", None

    if timezone.now() >= otp_record.expires_at:

        otp_record.delete()

        return False, "OTP expired. Please request a new OTP.", None

    if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:

        otp_record.delete()

        return False, "Maximum OTP attempts exceeded. Request a new OTP.", None

    if not secrets.compare_digest(
        hash_otp(entered_otp),
        otp_record.otp_hash
    ):

        otp_record.attempts += 1
        otp_record.save(update_fields=["attempts"])

        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:

            otp_record.delete()

            return False, "Maximum OTP attempts exceeded. Request a new OTP.", None

        remaining = settings.OTP_MAX_ATTEMPTS - otp_record.attempts

        return False, f"Incorrect OTP. {remaining} attempts remaining.", None

    return True, "OTP verified successfully.", otp_record


# =====================================================
# LOGIN, SIGNUP AND PASSWORD RESET
# =====================================================

def login_view(request):

    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":

        action = request.POST.get("action", "")

        # SIGN IN
        if action == "signin":

            email = request.POST.get(
                "email", ""
            ).strip().lower()

            password = request.POST.get(
                "password", ""
            )

            user = User.objects.filter(
                email__iexact=email
            ).first()

            authenticated_user = None

            if user:

                authenticated_user = authenticate(
                    request,
                    username=user.username,
                    password=password
                )

            if authenticated_user:

                login(request, authenticated_user)

                messages.success(
                    request,
                    "Login successful!"
                )

                return redirect("home")

            messages.error(
                request,
                "Invalid email or password."
            )

        # SEND SIGNUP OTP
        elif action == "send_otp":

            name = request.POST.get("name", "").strip()
            email = request.POST.get("email", "").strip().lower()
            phone = request.POST.get("phone", "").strip()
            password = request.POST.get("password", "")

            if not all([name, email, phone, password]):

                messages.error(
                    request,
                    "Please fill all required fields."
                )

            elif not re.fullmatch(r"[6-9][0-9]{9}", phone):

                messages.error(
                    request,
                    "Please enter a valid 10-digit phone number."
                )

            elif User.objects.filter(email__iexact=email).exists():

                messages.error(
                    request,
                    "Email already registered. Please sign in."
                )

            else:

                try:

                    validate_email(email)

                    temporary_user = User(
                        username=email,
                        email=email,
                        first_name=name
                    )

                    password_hash = make_password(password)

                    validate_password(
                        password,
                        temporary_user
                    )

                    pending_data = {
                        "name": name,
                        "email": email,
                        "phone": phone,
                        "password_hash": password_hash
                    }

                    success, message = send_email_otp(
                        email,
                        "signup",
                        pending_data
                    )

                    if success:

                        request.session["pending_signup"] = {
                            "email": email
                        }

                        messages.success(
                            request,
                            "OTP sent to your email. Please verify it."
                        )

                    else:

                        existing_otp = EmailOTP.objects.filter(
                            email=email,
                            purpose="signup"
                        ).first()

                        if existing_otp:

                            request.session["pending_signup"] = {
                                "email": email
                            }

                            messages.error(request, message)

                        else:

                            request.session.pop(
                                "pending_signup",
                                None
                            )

                            messages.error(request, message)

                except ValidationError as error:

                    for error_message in error.messages:
                        messages.error(request, error_message)

                except Exception:

                    logger.exception("Signup OTP request failed.")

                    messages.error(
                        request,
                        "Unable to start signup. Please try again."
                    )

        # VERIFY SIGNUP OTP
        elif action == "verify_otp":

            pending_signup = request.session.get(
                "pending_signup"
            )

            if not pending_signup:

                messages.error(
                    request,
                    "Signup session expired. Please start again."
                )

            else:

                email = pending_signup.get("email", "").lower()

                entered_otp = request.POST.get(
                    "email_otp", ""
                ).strip()

                if not re.fullmatch(r"[0-9]{6}", entered_otp):

                    messages.error(
                        request,
                        "Please enter a valid 6-digit OTP."
                    )

                else:

                    success, message, otp_record = check_email_otp(
                        email,
                        "signup",
                        entered_otp
                    )

                    if not success:

                        messages.error(request, message)

                    else:

                        pending_data = otp_record.pending_data

                        try:

                            with transaction.atomic():

                                if User.objects.filter(
                                    email__iexact=email
                                ).exists():

                                    otp_record.delete()

                                    request.session.pop(
                                        "pending_signup",
                                        None
                                    )

                                    messages.error(
                                        request,
                                        "This email is already registered."
                                    )

                                else:

                                    new_user = User(
                                        username=email,
                                        email=email,
                                        first_name=pending_data["name"]
                                    )

                                    new_user.password = pending_data["password_hash"]
                                    new_user.save()

                                    profile, created = Profile.objects.get_or_create(
                                        user=new_user,
                                        defaults={
                                            "name": pending_data["name"],
                                            "email": email,
                                            "phone": pending_data["phone"]
                                        }
                                    )

                                    if not created:

                                        profile.name = pending_data["name"]
                                        profile.email = email
                                        profile.phone = pending_data["phone"]

                                        profile.save()

                                    otp_record.delete()

                                    request.session.pop(
                                        "pending_signup",
                                        None
                                    )

                                    login(
                                        request,
                                        new_user,
                                        backend="django.contrib.auth.backends.ModelBackend"
                                    )

                                    messages.success(
                                        request,
                                        "Email verified! Your FoodKart account has been created."
                                    )

                                    return redirect("home")

                        except Exception:

                            logger.exception(
                                "Account creation after OTP verification failed."
                            )

                            messages.error(
                                request,
                                "Unable to create your account. Please try again."
                            )

        # RESEND SIGNUP OTP
        elif action == "resend_otp":

            pending_signup = request.session.get(
                "pending_signup"
            )

            if not pending_signup:

                messages.error(
                    request,
                    "Signup session expired. Please start again."
                )

            else:

                email = pending_signup.get("email", "").lower()

                existing_otp = EmailOTP.objects.filter(
                    email=email,
                    purpose="signup"
                ).first()

                if not existing_otp:

                    messages.error(
                        request,
                        "Signup OTP expired. Please start signup again."
                    )

                    request.session.pop(
                        "pending_signup",
                        None
                    )

                else:

                    success, message = send_email_otp(
                        email,
                        "signup",
                        existing_otp.pending_data
                    )

                    if success:

                        messages.success(
                            request,
                            "A new signup OTP has been sent to your email."
                        )

                    else:

                        messages.error(request, message)

        # FORGOT PASSWORD
        elif action == "forgot_password":

            email = request.POST.get(
                "email", ""
            ).strip().lower()

            try:

                validate_email(email)

                user = User.objects.filter(
                    email__iexact=email
                ).first()

                if not user:

                    messages.error(
                        request,
                        "No account found with that email address."
                    )

                else:

                    success, message = send_email_otp(
                        email,
                        "password_reset",
                        {}
                    )

                    if success:

                        request.session["pending_password_reset"] = {
                            "email": email,
                            "verified": False
                        }

                        messages.success(
                            request,
                            "Password reset OTP sent. Check your email."
                        )

                    else:

                        messages.error(request, message)

            except ValidationError:

                messages.error(
                    request,
                    "Please enter a valid email address."
                )

        # VERIFY PASSWORD RESET OTP
        elif action == "verify_reset_otp":

            pending_reset = request.session.get(
                "pending_password_reset"
            )

            if not pending_reset:

                messages.error(
                    request,
                    "Password reset session expired. Please try again."
                )

            else:

                email = pending_reset.get("email", "").lower()

                entered_otp = request.POST.get(
                    "reset_otp", ""
                ).strip()

                if not re.fullmatch(r"[0-9]{6}", entered_otp):

                    messages.error(
                        request,
                        "Please enter a valid 6-digit OTP."
                    )

                else:

                    success, message, otp_record = check_email_otp(
                        email,
                        "password_reset",
                        entered_otp
                    )

                    if success:

                        otp_record.delete()

                        request.session["pending_password_reset"] = {
                            "email": email,
                            "verified": True
                        }

                        messages.success(
                            request,
                            "OTP verified. You can now create a new password."
                        )

                    else:

                        messages.error(request, message)

        # RESET PASSWORD
        elif action == "reset_password":

            pending_reset = request.session.get(
                "pending_password_reset"
            )

            if not pending_reset or not pending_reset.get("verified"):

                messages.error(
                    request,
                    "Please verify your reset OTP first."
                )

            else:

                email = pending_reset.get("email", "").lower()

                new_password = request.POST.get(
                    "new_password", ""
                )

                confirm_password = request.POST.get(
                    "confirm_password", ""
                )

                if not new_password or not confirm_password:

                    messages.error(
                        request,
                        "Please enter both password fields."
                    )

                elif new_password != confirm_password:

                    messages.error(
                        request,
                        "Passwords do not match."
                    )

                else:

                    user = User.objects.filter(
                        email__iexact=email
                    ).first()

                    if not user:

                        messages.error(
                            request,
                            "Account not found."
                        )

                        request.session.pop(
                            "pending_password_reset",
                            None
                        )

                    else:

                        try:

                            validate_password(
                                new_password,
                                user
                            )

                            user.set_password(new_password)

                            user.save(
                                update_fields=["password"]
                            )

                            request.session.pop(
                                "pending_password_reset",
                                None
                            )

                            messages.success(
                                request,
                                "Password reset successful. Please sign in."
                            )

                        except ValidationError as error:

                            for error_message in error.messages:
                                messages.error(request, error_message)

        else:

            messages.error(
                request,
                "Invalid request."
            )

    return render(
        request,
        "login.html",
        {
            "pending_signup": request.session.get("pending_signup"),
            "pending_password_reset": request.session.get(
                "pending_password_reset"
            ),
        }
    )


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