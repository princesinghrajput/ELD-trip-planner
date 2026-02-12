from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import TripInputSerializer
from .services.trip_planner import TripPlannerError, plan_trip


@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok", "service": "ELD Trip Planner API"})


@api_view(["POST"])
def plan_trip_view(request):
    """
    POST /api/plan-trip/
    Accepts trip details → runs HOS simulation → returns route, timeline,
    daily log sheets, and stop markers.
    """
    serializer = TripInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        result = plan_trip(
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            cycle_used_hours=data["cycle_used_hours"],
        )
        return Response(result)
    except TripPlannerError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
