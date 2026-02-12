"""
Root URL configuration for ELD Trip Planner API.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("trip.urls")),
]
