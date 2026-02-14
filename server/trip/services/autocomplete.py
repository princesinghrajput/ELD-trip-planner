"""
Autocomplete service using Nominatim (OpenStreetMap).
"""

import logging
import time
import requests

logger = logging.getLogger(__name__)

NOMINATIM_AUTOCOMPLETE_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "ELDTripPlanner/1.0 (trip-planning-application)"

# Shared rate limiter with geocoding? Or separate? 
# Nominatim limits by IP/User-Agent. We should obey strictly.
_last_suggest_time = 0

def suggest_locations(query: str) -> list[dict]:
    """
    Get location suggestions for a partial query string.
    """
    global _last_suggest_time

    if not query or len(query) < 2:
        return []

    # Rate limit (1 req/sec)
    elapsed = time.time() - _last_suggest_time
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)

    params = {
        "q": query,
        "format": "json",
        "addressdetails": 1,
        "limit": 5,
        "countrycodes": "us,ca,mx",  # Limit to North America for ELD context
    }

    headers = {
        "User-Agent": USER_AGENT,
    }

    try:
        response = requests.get(
            NOMINATIM_AUTOCOMPLETE_URL,
            params=params,
            headers=headers,
            timeout=5,
        )
        _last_suggest_time = time.time()
        
        if response.status_code != 200:
            logger.error("Nominatim suggest error: %s", response.text)
            return []

        results = response.json()
        
        suggestions = []
        for r in results:
            # Format a nice label
            display_name = r.get("display_name", "")
            # Simple cleanup: maybe take first few parts?
            # Nominatim returns "Name, Street, City, County, State, Zip, Country"
            # We'll just return the full display name for now, client can truncate.
            suggestions.append({
                "label": display_name,
                "value": display_name, 
                "lat": r.get("lat"),
                "lng": r.get("lon")
            })
            
        return suggestions

    except Exception as exc:
        logger.error("Autocomplete failed: %s", exc)
        return []
