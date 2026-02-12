"""
HOS Trip Simulator.

Takes a trip's legs and simulates the full driving schedule while enforcing
FMCSA hours-of-service rules. Outputs an ordered timeline of events.

Rules:
  - 11h driving / 14h window per shift
  - 30min break after 8h driving
  - 10h off-duty to reset shift
  - 70h / 8-day cycle with 34h restart
  - Fuel stops every 1000 mi
"""

import logging
from datetime import datetime, timedelta

from .constants import (
    AVERAGE_SPEED_MPH,
    CYCLE_RESTART_MINUTES,
    DRIVING,
    FUEL_STOP_DURATION_MINUTES,
    FUEL_STOP_INTERVAL_MILES,
    MANDATORY_BREAK_MINUTES,
    MANDATORY_REST_MINUTES,
    MAX_CYCLE_MINUTES,
    MAX_DRIVING_BEFORE_BREAK,
    MAX_DRIVING_MINUTES,
    MAX_DUTY_WINDOW_MINUTES,
    OFF_DUTY,
    ON_DUTY_NOT_DRIVING,
)

logger = logging.getLogger(__name__)


class TripSimulator:
    """Stateful simulator that tracks HOS counters and builds a timeline."""

    def __init__(self, cycle_used_hours: float = 0, start_time: datetime | None = None):
        self.clock = start_time or datetime(2025, 1, 1, 6, 0)

        # shift counters (reset after 10h rest)
        self.shift_driving = 0       # minutes driven this shift
        self.window_start = None     # when the 14h window opened
        self.since_break = 0         # minutes since last 30-min break

        # cycle counter
        self.cycle_used = int(cycle_used_hours * 60)

        # fuel / mileage
        self.miles_since_fuel = 0.0
        self.total_miles = 0.0

        # output
        self.timeline: list[dict] = []
        self.day = 1

    # ---- public interface ----

    def add_pickup(self, location: str, lat: float = 0, lng: float = 0):
        self._on_duty_stop(60, location, lat, lng, "Loading at pickup")

    def add_dropoff(self, location: str, lat: float = 0, lng: float = 0):
        self._on_duty_stop(60, location, lat, lng, "Unloading at dropoff")

    def drive_segment(
        self,
        distance_miles: float,
        location_from: str = "",
        location_to: str = "",
        lat_from: float = 0,
        lng_from: float = 0,
        lat_to: float = 0,
        lng_to: float = 0,
    ):
        remaining = distance_miles
        while remaining > 0.5:
            to_fuel = FUEL_STOP_INTERVAL_MILES - self.miles_since_fuel
            chunk_mi = min(remaining, max(to_fuel, 0.5))
            chunk_min = max(1, round((chunk_mi / AVERAGE_SPEED_MPH) * 60))

            driven = self._drive(chunk_min, location_from, location_to, lat_from, lng_from)

            actual_mi = (driven / 60) * AVERAGE_SPEED_MPH
            remaining -= actual_mi
            self.miles_since_fuel += actual_mi
            self.total_miles += actual_mi

            if self.miles_since_fuel >= FUEL_STOP_INTERVAL_MILES and remaining > 0.5:
                self._fuel_stop(location_from, lat_from, lng_from)

    def get_timeline(self) -> list[dict]:
        return self.timeline

    def get_total_miles(self) -> float:
        return round(self.total_miles, 1)

    # ---- core drive loop (recursive on HOS splits) ----

    def _drive(self, mins: int, frm: str, to: str, lat: float, lng: float) -> int:
        if mins <= 0:
            return 0

        self._check_cycle(frm, lat, lng)
        self._open_window()

        avail = min(
            MAX_DRIVING_MINUTES - self.shift_driving,
            self._window_left(),
            MAX_DRIVING_BEFORE_BREAK - self.since_break,
            MAX_CYCLE_MINUTES - self.cycle_used,
        )

        if avail <= 0:
            self._rest(frm, lat, lng)
            return self._drive(mins, frm, to, lat, lng)

        now = min(mins, avail)
        label = f"Driving: {frm} → {to}" if frm and to else "Driving"
        self._event(DRIVING, now, frm, lat, lng, label)

        self.shift_driving += now
        self.since_break += now
        self.cycle_used += now

        left = mins - now
        if left <= 0:
            return now

        # hit a limit — handle it and keep going
        if self.since_break >= MAX_DRIVING_BEFORE_BREAK:
            self._break(frm, lat, lng)

        if self.shift_driving >= MAX_DRIVING_MINUTES or self._window_left() <= 0:
            self._rest(frm, lat, lng)

        if self.cycle_used >= MAX_CYCLE_MINUTES:
            self._check_cycle(frm, lat, lng)

        return now + self._drive(left, frm, to, lat, lng)

    # ---- HOS actions ----

    def _check_cycle(self, loc: str, lat: float = 0, lng: float = 0):
        if self.cycle_used >= MAX_CYCLE_MINUTES:
            logger.info("70h cycle hit — 34h restart")
            self._event(OFF_DUTY, CYCLE_RESTART_MINUTES, loc, lat, lng, "34-hour restart (cycle)")
            self._reset_all()

    def _rest(self, loc: str, lat: float = 0, lng: float = 0):
        logger.info("Shift limit — 10h rest")
        self._event(OFF_DUTY, MANDATORY_REST_MINUTES, loc or "Rest area", lat, lng, "10-hour off-duty rest")
        self._reset_shift()

    def _break(self, loc: str, lat: float = 0, lng: float = 0):
        logger.info("8h driving — 30min break")
        self._event(OFF_DUTY, MANDATORY_BREAK_MINUTES, loc or "Rest area", lat, lng, "30-minute break")
        self.since_break = 0

    def _fuel_stop(self, loc: str, lat: float = 0, lng: float = 0):
        self._open_window()
        self._event(ON_DUTY_NOT_DRIVING, FUEL_STOP_DURATION_MINUTES, loc or "Fuel station", lat, lng, "Fuel stop")
        self.miles_since_fuel = 0
        self.cycle_used += FUEL_STOP_DURATION_MINUTES
        self.since_break = 0  # 30min non-driving counts as break

    def _on_duty_stop(self, mins: int, loc: str, lat: float, lng: float, note: str):
        self._open_window()
        self._event(ON_DUTY_NOT_DRIVING, mins, loc, lat, lng, note)
        self.cycle_used += mins
        if mins >= MANDATORY_BREAK_MINUTES:
            self.since_break = 0

    # ---- state helpers ----

    def _open_window(self):
        if self.window_start is None:
            self.window_start = self.clock

    def _window_left(self) -> int:
        if not self.window_start:
            return MAX_DUTY_WINDOW_MINUTES
        elapsed = (self.clock - self.window_start).total_seconds() / 60
        return max(0, int(MAX_DUTY_WINDOW_MINUTES - elapsed))

    def _reset_shift(self):
        self.shift_driving = 0
        self.window_start = None
        self.since_break = 0

    def _reset_all(self):
        self._reset_shift()
        self.cycle_used = 0

    # ---- timeline recording ----

    def _event(self, status: str, mins: int, loc: str = "", lat: float = 0, lng: float = 0, note: str = ""):
        start = self.clock
        end = start + timedelta(minutes=mins)

        d = self.day
        if start.date() != end.date():
            self.day += (end.date() - start.date()).days

        self.timeline.append({
            "status": status,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "duration_mins": mins,
            "location": loc,
            "lat": lat,
            "lng": lng,
            "note": note,
            "day": d,
        })
        self.clock = end
