
from django.urls import path
from . import views

urlpatterns = [
    # Login and Signup
    path('login/', views.login_view, name='login'),
    path('signup/', views.login_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),

    # Profile
    path('profile/', views.update_profile_view, name='profile'),
    path('delete-account/', views.delete_account_view, name='delete_account'),

    # Saved Addresses
    path('save-address/', views.save_address_view, name='save_address'),
    path(
        'delete-address/<int:address_id>/',
        views.delete_address_view,
        name='delete_address'
    ),
    path(
        'set-default-address/<int:address_id>/',
        views.set_default_address_view,
        name='set_default_address'
    ),
]
