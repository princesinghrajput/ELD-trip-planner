from django.urls import path
from .views import health_check, plan_trip_view, suggest_view

urlpatterns = [
    path("health/", health_check, name="health_check"),
    path("plan-trip/", plan_trip_view, name="plan_trip"),
    path("suggest/", suggest_view, name="suggest"),
]
