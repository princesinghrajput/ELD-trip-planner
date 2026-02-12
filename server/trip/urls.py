from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health_check, name="health-check"),
    path("plan-trip/", views.plan_trip_view, name="plan-trip"),
]
