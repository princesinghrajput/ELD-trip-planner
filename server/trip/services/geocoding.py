"""
Geocoding service using Nominatim (OpenStreetMap).

Converts human-readable address strings into (lat, lng) coordinates.
Uses the free Nominatim API — no API key required.
"""

import logging
import time

import requests

logger = logging.getLogger(__name__)

NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"

# Nominatim ToS requires a descriptive User-Agent
USER_AGENT = "ELDTripPlanner/1.0 (trip-planning-application)"

# Rate limiting: Nominatim requests max 1 req/sec
_last_request_time = 0


class GeocodingError(Exception):
    """Raised when an address cannot be geocoded."""

    pass


def geocode_address(address: str) -> tuple[float, float]:
    """
    Convert a human-readable address into (latitude, longitude) coordinates.

    Args:
        address: A place name or address string (e.g., "Chicago, IL").

    Returns:
        A tuple of (latitude, longitude) as floats.

    Raises:
        GeocodingError: If the address cannot be found or the API fails.
    """
    global _last_request_time

    # Respect Nominatim rate limits (1 request per second)
    elapsed = time.time() - _last_request_time
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)

    params = {
        "q": address,
        "format": "json",
        "limit": 1,
    }

    headers = {
        "User-Agent": USER_AGENT,
    }

    try:
        response = requests.get(
            NOMINATIM_BASE_URL,
            params=params,
            headers=headers,
            timeout=10,
        )
        _last_request_time = time.time()

        response.raise_for_status()
        results = response.json()

        if not results:
            raise GeocodingError(
                f"Could not find location: '{address}'. "
                "Please try a more specific address."
            )

        lat = float(results[0]["lat"])
        lng = float(results[0]["lon"])

        logger.info("Geocoded '%s' → (%.5f, %.5f)", address, lat, lng)
        return (lat, lng)

    except requests.RequestException as exc:
        logger.error("Geocoding request failed for '%s': %s", address, exc)
        raise GeocodingError(
            f"Geocoding service error for '{address}'. Please try again later."
        ) from exc
