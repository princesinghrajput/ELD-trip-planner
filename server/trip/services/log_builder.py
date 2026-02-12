"""
Converts a raw HOS timeline into structured daily log data.

Each daily log contains a 24-hour status grid, totals by duty status,
and a list of remarks — everything the frontend needs to draw FMCSA
driver daily log sheets.
"""

from collections import defaultdict
from datetime import datetime, timedelta

from .constants import DRIVING, OFF_DUTY, ON_DUTY_NOT_DRIVING, SLEEPER_BERTH


def build_daily_logs(timeline: list[dict], driver_name: str = "Driver") -> list[dict]:
    """Group the flat timeline into per-day ELD log sheets."""
    if not timeline:
        return []

    by_date = _split_by_date(timeline)
    logs = []

    for date_str in sorted(by_date):
        events = by_date[date_str]
        segments = _to_grid_segments(events, date_str)
        logs.append({
            "date": date_str,
            "segments": segments,
            "totals": _sum_totals(segments),
            "remarks": _remarks(events),
        })

    return logs


def _split_by_date(timeline: list[dict]) -> dict[str, list[dict]]:
    """Split events that span midnight into per-day slices."""
    daily: dict[str, list[dict]] = defaultdict(list)

    for ev in timeline:
        start = datetime.fromisoformat(ev["start_time"])
        end = datetime.fromisoformat(ev["end_time"])
        cur = start

        # walk through midnight boundaries
        while cur.date() < end.date():
            midnight = datetime(cur.year, cur.month, cur.day) + timedelta(days=1)
            daily[cur.date().isoformat()].append({
                **ev,
                "start_time": cur.isoformat(),
                "end_time": midnight.isoformat(),
                "duration_mins": int((midnight - cur).total_seconds() / 60),
            })
            cur = midnight

        # remainder (or full event if no split happened)
        if cur < end:
            daily[cur.date().isoformat()].append({
                **ev,
                "start_time": cur.isoformat(),
                "end_time": end.isoformat(),
                "duration_mins": int((end - cur).total_seconds() / 60),
            })

    return dict(daily)


def _to_grid_segments(events: list[dict], date_str: str) -> list[dict]:
    """
    Turn events into 24h grid segments with start_hour / end_hour floats.
    Gaps are filled with OFF_DUTY.
    """
    date = datetime.fromisoformat(date_str).date()
    raw = []

    for ev in events:
        s = datetime.fromisoformat(ev["start_time"])
        e = datetime.fromisoformat(ev["end_time"])
        sh = s.hour + s.minute / 60
        eh = 24.0 if e.date() > date else e.hour + e.minute / 60
        sh = max(0.0, min(24.0, sh))
        eh = max(sh, min(24.0, eh))

        if eh > sh:
            raw.append({
                "status": ev["status"],
                "start_hour": round(sh, 2),
                "end_hour": round(eh, 2),
                "duration_mins": ev.get("duration_mins", 0),
            })

    return _fill_gaps(raw)


def _fill_gaps(segments: list[dict]) -> list[dict]:
    """Fill any gaps in the 24h grid with OFF_DUTY."""
    if not segments:
        return [{"status": OFF_DUTY, "start_hour": 0.0, "end_hour": 24.0, "duration_mins": 1440}]

    result = []

    # gap before first
    if segments[0]["start_hour"] > 0:
        result.append({
            "status": OFF_DUTY,
            "start_hour": 0.0,
            "end_hour": segments[0]["start_hour"],
            "duration_mins": int(segments[0]["start_hour"] * 60),
        })

    for i, seg in enumerate(segments):
        result.append(seg)
        # gap between segments
        if i < len(segments) - 1 and seg["end_hour"] < segments[i + 1]["start_hour"]:
            gap = segments[i + 1]["start_hour"] - seg["end_hour"]
            result.append({
                "status": OFF_DUTY,
                "start_hour": seg["end_hour"],
                "end_hour": segments[i + 1]["start_hour"],
                "duration_mins": int(gap * 60),
            })

    # gap after last
    if result[-1]["end_hour"] < 24.0:
        result.append({
            "status": OFF_DUTY,
            "start_hour": result[-1]["end_hour"],
            "end_hour": 24.0,
            "duration_mins": int((24.0 - result[-1]["end_hour"]) * 60),
        })

    return result


def _sum_totals(segments: list[dict]) -> dict[str, float]:
    """Hours per duty status for the totals row."""
    totals = {OFF_DUTY: 0.0, SLEEPER_BERTH: 0.0, DRIVING: 0.0, ON_DUTY_NOT_DRIVING: 0.0}
    for seg in segments:
        hrs = seg["end_hour"] - seg["start_hour"]
        if seg["status"] in totals:
            totals[seg["status"]] += hrs
    return {k: round(v, 2) for k, v in totals.items()}


def _remarks(events: list[dict]) -> list[dict]:
    """Extract stops / breaks as remark entries."""
    out = []
    for ev in events:
        note = ev.get("note", "")
        if not note or note.startswith("Driving"):
            continue
        t = datetime.fromisoformat(ev["start_time"])
        out.append({"time": t.strftime("%H:%M"), "location": ev.get("location", ""), "note": note})
    return out
