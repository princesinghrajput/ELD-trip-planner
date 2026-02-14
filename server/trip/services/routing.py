"""
Routing service using OpenRouteService (ORS).

Calculates driving distance, duration, and road geometry between coordinates.
Requires a free API key from openrouteservice.org.
"""

import logging
import math
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-hgv"
ORS_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY", "")

# Conversion constants
METERS_TO_MILES = 0.000621371
SECONDS_TO_MINUTES = 1 / 60


class RoutingError(Exception):
    """Raised when a route cannot be calculated."""

    pass


def get_route(
    origin: tuple[float, float],
    destination: tuple[float, float],
) -> dict:
    """
    Get driving route between two coordinate pairs.

    Args:
        origin: (latitude, longitude) of the start point.
        destination: (latitude, longitude) of the end point.

    Returns:
        dict with keys:
            - distance_miles (float): Total driving distance in miles.
            - duration_minutes (float): Estimated driving time in minutes.
            - geometry (list[list[float]]): [[lat, lng], ...] coordinate pairs
              for drawing the route polyline.

    Raises:
        RoutingError: If the route cannot be calculated.
    """
    if not ORS_API_KEY:
        raise RoutingError(
            "OpenRouteService API key not configured. "
            "Set OPENROUTESERVICE_API_KEY in your .env file."
        )

    # ORS expects coordinates as [longitude, latitude]
    body = {
        "coordinates": [
            [origin[1], origin[0]],
            [destination[1], destination[0]],
        ],
    }

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json, application/geo+json",
    }

    try:
        response = requests.post(
            ORS_DIRECTIONS_URL,
            json=body,
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        if "routes" not in data or not data["routes"]:
            raise RoutingError(
                "No route found between the given locations. "
                "Please check your addresses."
            )

        route = data["routes"][0]
        summary = route["summary"]

        # Distance in miles, duration in minutes
        distance_miles = round(summary["distance"] * METERS_TO_MILES, 1)
        duration_minutes = round(summary["duration"] * SECONDS_TO_MINUTES, 1)

        # Decode geometry — ORS returns encoded polyline by default
        # We need to decode it to get [[lat, lng], ...] pairs
        geometry_encoded = route.get("geometry")
        if geometry_encoded:
            geometry = decode_polyline(geometry_encoded)
        else:
            geometry = []

        logger.info(
            "Route calculated: %.1f miles, %.1f minutes, %d geometry points",
            distance_miles,
            duration_minutes,
            len(geometry),
        )

        return {
            "distance_miles": distance_miles,
            "duration_minutes": duration_minutes,
            "geometry": geometry,
        }


    except requests.RequestException as exc:
        msg = "Routing service error."
        if exc.response is not None:
            code = exc.response.status_code
            if code == 401 or code == 403:
                msg = "Invalid ORS API Key or unauthorized."
            elif code == 429:
                msg = "Routing service quota exceeded."
            logger.error("Routing request failed (%s): %s", code, exc)
        else:
            logger.error("Routing request failed: %s", exc)
            
        raise RoutingError(f"{msg} Please try again later.") from exc


def decode_polyline(encoded: str) -> list[list[float]]:
    """
    Decode a Google-encoded polyline string into a list of [lat, lng] pairs.

    ORS uses the standard Google polyline encoding format with a precision
    of 5 decimal places.

    Args:
        encoded: The encoded polyline string.

    Returns:
        List of [latitude, longitude] pairs.
    """
    decoded = []
    index = 0
    lat = 0
    lng = 0

    while index < len(encoded):
        # Decode latitude
        shift = 0
        result = 0
        while True:
            char_code = ord(encoded[index]) - 63
            index += 1
            result |= (char_code & 0x1F) << shift
            shift += 5
            if char_code < 0x20:
                break
        lat += (~(result >> 1) if (result & 1) else (result >> 1))

        # Decode longitude
        shift = 0
        result = 0
        while True:
            char_code = ord(encoded[index]) - 63
            index += 1
            result |= (char_code & 0x1F) << shift
            shift += 5
            if char_code < 0x20:
                break
        lng += (~(result >> 1) if (result & 1) else (result >> 1))

        decoded.append([lat / 1e5, lng / 1e5])

    return decoded


def get_intermediate_point(
    geometry: list[list[float]],
    fraction: float,
) -> list[float]:
    """
    Get a point at a given fraction (0.0–1.0) along the route geometry.

    Useful for placing fuel stop markers at approximate mileage points.

    Args:
        geometry: List of [lat, lng] coordinate pairs from get_route().
        fraction: A value between 0.0 and 1.0 representing the position
                  along the route.

    Returns:
        [latitude, longitude] at the given fraction.
    """
    if not geometry:
        raise ValueError("Geometry is empty")

    fraction = max(0.0, min(1.0, fraction))

    if fraction == 0.0:
        return geometry[0]
    if fraction == 1.0:
        return geometry[-1]

    # Calculate cumulative distances between consecutive points
    total_distance = 0.0
    segment_distances = []

    for i in range(1, len(geometry)):
        d = _haversine(geometry[i - 1], geometry[i])
        segment_distances.append(d)
        total_distance += d

    target_distance = total_distance * fraction
    accumulated = 0.0

    for i, seg_dist in enumerate(segment_distances):
        if accumulated + seg_dist >= target_distance:
            # Interpolate within this segment
            remaining = target_distance - accumulated
            seg_fraction = remaining / seg_dist if seg_dist > 0 else 0
            lat = geometry[i][0] + seg_fraction * (geometry[i + 1][0] - geometry[i][0])
            lng = geometry[i][1] + seg_fraction * (geometry[i + 1][1] - geometry[i][1])
            return [lat, lng]
        accumulated += seg_dist

    return geometry[-1]


def _haversine(coord1: list[float], coord2: list[float]) -> float:
    """
    Calculate the great-circle distance between two points in miles.

    Args:
        coord1: [lat, lng] in degrees.
        coord2: [lat, lng] in degrees.

    Returns:
        Distance in miles.
    """
    R = 3958.8  # Earth's radius in miles

    lat1 = math.radians(coord1[0])
    lat2 = math.radians(coord2[0])
    dlat = math.radians(coord2[0] - coord1[0])
    dlng = math.radians(coord2[1] - coord1[1])

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c
