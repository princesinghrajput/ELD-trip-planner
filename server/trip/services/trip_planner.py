"""
Trip planning orchestrator.

Geocode → Route → HOS simulate → Build logs.
Single entry point: plan_trip().
"""

import logging
from datetime import datetime

from .geocoding import geocode_address
from .hos_calculator import TripSimulator
from .log_builder import build_daily_logs
from .routing import get_route

logger = logging.getLogger(__name__)


class TripPlannerError(Exception):
    """Pipeline-level error."""


def plan_trip(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    cycle_used_hours: float,
) -> dict:
    """
    Run the full planning pipeline and return everything the frontend needs:
    route geometry, HOS timeline, daily log sheets, and stop markers.
    """
    try:
        # 1) geocode
        logger.info("Geocoding...")
        cur = geocode_address(current_location)
        pick = geocode_address(pickup_location)
        drop = geocode_address(dropoff_location)

        # 2) route both legs
        logger.info("Routing...")
        leg1 = get_route(cur, pick)
        leg2 = get_route(pick, drop)
        total_mi = leg1["distance_miles"] + leg2["distance_miles"]

        # 3) HOS simulation
        logger.info("Simulating HOS...")
        sim = TripSimulator(
            cycle_used_hours=cycle_used_hours,
            start_time=datetime.now().replace(second=0, microsecond=0),
        )

        sim.drive_segment(
            leg1["distance_miles"],
            current_location, pickup_location,
            cur[0], cur[1], pick[0], pick[1],
        )
        sim.add_pickup(pickup_location, pick[0], pick[1])

        sim.drive_segment(
            leg2["distance_miles"],
            pickup_location, dropoff_location,
            pick[0], pick[1], drop[0], drop[1],
        )
        sim.add_dropoff(dropoff_location, drop[0], drop[1])

        timeline = sim.get_timeline()

        # 4) daily logs
        daily_logs = build_daily_logs(timeline)

        # 5) stop markers for the map
        stops = _build_stops(timeline)

        return {
            "route": {
                "legs": [
                    _leg_data(current_location, pickup_location, leg1),
                    _leg_data(pickup_location, dropoff_location, leg2),
                ],
                "total_distance_miles": round(total_mi, 1),
                "total_duration_hours": round(
                    (leg1["duration_minutes"] + leg2["duration_minutes"]) / 60, 1
                ),
            },
            "timeline": timeline,
            "daily_logs": daily_logs,
            "stops": stops,
            "summary": {
                "total_days": len(daily_logs),
                "total_driving_miles": sim.get_total_miles(),
                "cycle_hours_at_start": cycle_used_hours,
                "cycle_hours_at_end": round(sim.cycle_used / 60, 1),
            },
        }

    except Exception as exc:
        logger.exception("Trip planning failed: %s", exc)
        raise TripPlannerError(str(exc)) from exc


def _leg_data(frm: str, to: str, leg: dict) -> dict:
    return {
        "from": frm,
        "to": to,
        "distance_miles": round(leg["distance_miles"], 1),
        "duration_hours": round(leg["duration_minutes"] / 60, 1),
        "geometry": leg["geometry"],
    }


def _build_stops(timeline: list[dict]) -> list[dict]:
    """Pull non-driving events into map markers."""
    stops = []
    for ev in timeline:
        if ev["status"] == "D":
            continue

        note = ev.get("note", "")
        if "pickup" in note.lower():
            kind = "pickup"
        elif "dropoff" in note.lower():
            kind = "dropoff"
        elif "fuel" in note.lower():
            kind = "fuel"
        elif "rest" in note.lower() or "restart" in note.lower():
            kind = "rest"
        elif "break" in note.lower():
            kind = "break"
        else:
            kind = "stop"

        stops.append({
            "type": kind,
            "location": ev.get("location", ""),
            "lat": ev.get("lat", 0),
            "lng": ev.get("lng", 0),
            "start_time": ev["start_time"],
            "duration_mins": ev["duration_mins"],
            "note": note,
        })

    return stops
