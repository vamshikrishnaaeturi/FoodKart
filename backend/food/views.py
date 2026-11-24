
import json
import uuid

from decimal import Decimal, InvalidOperation

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.db import transaction

from accounts.models import SavedAddress
from .models import Order


# ==================== HOME PAGE ====================

@ensure_csrf_cookie
def home(request):

    context = {}

    if request.user.is_authenticated:

        context["profile"] = getattr(
            request.user,
            "profile",
            None
        )

        context["orders"] = request.user.orders.all()

        saved_addresses = SavedAddress.objects.filter(
            user=request.user
        )

        context["saved_addresses"] = saved_addresses

        context["default_address"] = saved_addresses.filter(
            is_default=True
        ).first()

    return render(request, "home.html", context)




# ==================== PLACE ORDER ====================

@login_required
@require_POST
def place_order(request):

    try:

        # Read JSON data from frontend
        data = json.loads(request.body)

        if not isinstance(data, dict):
            return JsonResponse({
                "success": False,
                "message": "Invalid order data."
            }, status=400)

        items = data.get("items", [])
        total = data.get("total")

        delivery_address = data.get("delivery_address", "")

        latitude = data.get("latitude")
        longitude = data.get("longitude")

        # Validate food items
        if (
            not isinstance(items, list)
            or not items
            or not all(isinstance(item, dict) for item in items)
        ):
            return JsonResponse({
                "success": False,
                "message": "Please add valid food items."
            }, status=400)

        # Validate delivery address
        if (
            not isinstance(delivery_address, str)
            or not delivery_address.strip()
        ):
            return JsonResponse({
                "success": False,
                "message": "Delivery address is required."
            }, status=400)

        delivery_address = delivery_address.strip()

        # Validate total amount
        try:
            total_amount = Decimal(str(total))

        except (InvalidOperation, TypeError, ValueError):
            return JsonResponse({
                "success": False,
                "message": "Invalid order amount."
            }, status=400)

        if (
            not total_amount.is_finite()
            or total_amount <= 0
            or total_amount > Decimal("99999999.99")
            or total_amount.as_tuple().exponent < -2
        ):
            return JsonResponse({
                "success": False,
                "message": "Invalid order amount."
            }, status=400)

        # Validate coordinates
        try:
            latitude = Decimal(str(latitude))
            longitude = Decimal(str(longitude))

        except (InvalidOperation, TypeError, ValueError):
            return JsonResponse({
                "success": False,
                "message": "Invalid delivery location."
            }, status=400)

        if (
            not latitude.is_finite()
            or not longitude.is_finite()
            or not Decimal("-90") <= latitude <= Decimal("90")
            or not Decimal("-180") <= longitude <= Decimal("180")
        ):
            return JsonResponse({
                "success": False,
                "message": "Invalid delivery coordinates."
            }, status=400)

        # Generate unique order ID
        order_id = "FK" + uuid.uuid4().hex[:10].upper()

        # Save order in database
        with transaction.atomic():

            order = Order.objects.create(
                user=request.user,
                order_id=order_id,
                items=items,
                total_amount=total_amount,
                delivery_address=delivery_address,
                latitude=latitude,
                longitude=longitude
            )

        return JsonResponse({
            "success": True,
            "message": "Order placed successfully!",
            "order_id": order.order_id
        })

    except (ValueError, TypeError, UnicodeDecodeError):

        return JsonResponse({
            "success": False,
            "message": "Invalid order data."
        }, status=400)


# ==================== CANCEL ORDER ====================

@login_required
@require_POST
def cancel_order(request, order_id):

    order = get_object_or_404(
        Order,
        order_id=order_id,
        user=request.user
    )

    if order.status not in ["Placed", "Confirmed"]:

        return JsonResponse({
            "success": False,
            "message": "This order can no longer be cancelled."
        }, status=400)

    order.status = "Cancelled"

    order.save(
        update_fields=["status"]
    )

    return JsonResponse({
        "success": True,
        "message": "Order cancelled successfully!"
    })

