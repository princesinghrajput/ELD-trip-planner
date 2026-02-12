"""
FMCSA Hours of Service constants.

Based on the Interstate Truck Driver's Guide to HOS (FMCSA-HOS-395).
All values for property-carrying drivers under the 70-hour/8-day rule.
"""

# -- Driving limits --
MAX_DRIVING_MINUTES = 660          # 11 hrs
MAX_DUTY_WINDOW_MINUTES = 840      # 14 hrs
MAX_DRIVING_BEFORE_BREAK = 480     # 8 hrs continuous driving

# -- Rest requirements --
MANDATORY_REST_MINUTES = 600       # 10 hrs off-duty
MANDATORY_BREAK_MINUTES = 30       # 30 min break
CYCLE_RESTART_MINUTES = 2040       # 34 hrs

# -- Cycle (70-hour / 8-day) --
MAX_CYCLE_MINUTES = 4200           # 70 hrs

# -- Operational --
FUEL_STOP_INTERVAL_MILES = 1000
FUEL_STOP_DURATION_MINUTES = 30
PICKUP_DURATION_MINUTES = 60
DROPOFF_DURATION_MINUTES = 60
AVERAGE_SPEED_MPH = 55

# -- Duty status codes (ELD spec) --
OFF_DUTY = "OFF"
SLEEPER_BERTH = "SB"
DRIVING = "D"
ON_DUTY_NOT_DRIVING = "ON"
