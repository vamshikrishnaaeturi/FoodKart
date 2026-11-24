from django.db import models
from django.contrib.auth.models import User


# =====================================================
# USER PROFILE
# =====================================================

class Profile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    name = models.CharField(max_length=100)

    email = models.EmailField()

    phone = models.CharField(
        max_length=15,
        blank=True
    )

    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        null=True,
        blank=True
    )

    def save(self, *args, **kwargs):

        old_picture = None

        # Get the existing profile picture
        if self.pk:
            try:
                old_profile = Profile.objects.get(pk=self.pk)
                old_picture = old_profile.profile_picture
            except Profile.DoesNotExist:
                pass

        # Save the profile first
        super().save(*args, **kwargs)

        # Delete the old picture if it was replaced or removed
        if old_picture and old_picture.name:
            if old_picture.name != self.profile_picture.name:
                old_picture.delete(save=False)

    def __str__(self):
        return self.name or self.user.username


# =====================================================
# SAVED ADDRESSES
# =====================================================

class SavedAddress(models.Model):

    ADDRESS_TYPES = [
        ("Home", "Home"),
        ("Work", "Work"),
        ("Other", "Other"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="saved_addresses"
    )

    address_type = models.CharField(
        max_length=20,
        choices=ADDRESS_TYPES,
        default="Home"
    )

    address = models.TextField()

    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True
    )

    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True
    )

    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.address_type} - {self.user.username}"


# =====================================================
# EMAIL OTP
# =====================================================

class EmailOTP(models.Model):

    PURPOSE_CHOICES = [
        ("signup", "Signup"),
        ("login", "Login"),
        ("password_reset", "Password Reset"),
    ]

    email = models.EmailField(db_index=True)

    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES
    )

    otp_hash = models.CharField(max_length=128)

    attempts = models.PositiveIntegerField(default=0)

    pending_data = models.JSONField(
        default=dict,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    last_sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} - {self.purpose}"