
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('place-order/', views.place_order, name='place_order'),
    path(
        'cancel-order/<str:order_id>/',
        views.cancel_order,
        name='cancel_order'
    ),
]
