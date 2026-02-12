"""
Views for the trip app.
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def health_check(request):
    """Basic health check endpoint to verify the API is running."""
    return Response({"status": "ok"})
