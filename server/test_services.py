"""Quick test — HOS engine + log builder."""
import sys
sys.path.insert(0, ".")

from datetime import datetime
from trip.services.hos_calculator import TripSimulator
from trip.services.log_builder import build_daily_logs


def show(sim):
    for i, e in enumerate(sim.timeline, 1):
        s = e["status"].ljust(5)
        d = str(e["duration_mins"]).rjust(5)
        t1 = e["start_time"][5:16]
        t2 = e["end_time"][5:16]
        print(f"  {i:2}. {s} {d}m  {t1} > {t2}  {e['note']}")


# test 1: 700mi drive
print("=== 700mi drive ===")
sim = TripSimulator(cycle_used_hours=0, start_time=datetime(2025, 1, 1, 6, 0))
sim.drive_segment(700, "Chicago", "Dallas")
show(sim)

# test 2: full trip
print("\n=== Full trip ===")
sim2 = TripSimulator(cycle_used_hours=10, start_time=datetime(2025, 1, 1, 6, 0))
sim2.drive_segment(300, "Chicago", "Indy")
sim2.add_pickup("Indy", 39.76, -86.15)
sim2.drive_segment(175, "Indy", "Columbus")
sim2.add_dropoff("Columbus", 39.96, -82.99)
show(sim2)

# test daily logs
logs = build_daily_logs(sim2.get_timeline())
print(f"\n  Daily logs: {len(logs)} day(s)")
for log in logs:
    print(f"  {log['date']}: {log['totals']}")
    for r in log['remarks']:
        print(f"    - {r['time']} {r['note']} @ {r['location']}")
