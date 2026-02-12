"""
Serializers for the trip app.
"""

from rest_framework import serializers


class TripInputSerializer(serializers.Serializer):
    """Validates the input for trip planning."""

    current_location = serializers.CharField(
        max_length=200,
        help_text="Current location of the driver (e.g., 'Chicago, IL')",
    )
    pickup_location = serializers.CharField(
        max_length=200,
        help_text="Pickup location (e.g., 'Dallas, TX')",
    )
    dropoff_location = serializers.CharField(
        max_length=200,
        help_text="Dropoff location (e.g., 'Los Angeles, CA')",
    )
    cycle_used_hours = serializers.FloatField(
        min_value=0,
        max_value=69,
        help_text="Hours already used in the current 70-hour/8-day cycle (0-69)",
    )
