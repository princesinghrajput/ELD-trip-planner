Here is the extracted Jira board content formatted into a clean Markdown file.

---

# ELD Trip Planner - Project Backlog

**Project Overview:** A full-stack application to plan trucking trips, calculate routes, and generate FMCSA-compliant Electronic Logging Device (ELD) log sheets.

---

## 📦 Epic 1: Project Setup

**Goal:** Initialize the environment, set up the repository structure, and establish communication between frontend and backend.

### ELD-101: Initialize Django backend project

* **Priority:** HIGH
* **Points:** 2
* **Description:** Bootstrap the Django project with Django REST Framework. Set up project folder structure, virtual environment, and requirements.txt.
* **Acceptance Criteria:**
* [ ] Django 4.x project created with `django-admin startproject`
* [ ] `trip` app created inside the project
* [ ] Django REST Framework installed and added to INSTALLED_APPS
* [ ] CORS headers package (django-cors-headers) installed and configured
* [ ] requirements.txt includes: django, djangorestframework, django-cors-headers, requests, python-dotenv
* [ ] Server runs on `python manage.py runserver` without errors
* [ ] Basic health-check endpoint `GET /api/health/` returns `{status: 'ok'}`


* **Checkpoint:**
> Run the server and hit /api/health/ — you should see JSON response. Show me your folder structure.



### ELD-102: Initialize React frontend project

* **Priority:** HIGH
* **Points:** 2
* **Description:** Bootstrap the React app using Vite. Install all dependencies needed for the project.
* **Acceptance Criteria:**
* [ ] React project created with `npm create vite@latest` (React + JS or React + TS)
* [ ] Installed: axios, react-leaflet, leaflet, react-router-dom
* [ ] Installed: tailwindcss OR a CSS-in-JS solution for styling
* [ ] App runs on `npm run dev` without errors
* [ ] Proxy configured in vite.config.js to point /api → Django backend port
* [ ] Basic App.jsx renders a placeholder heading without errors


* **Checkpoint:**
> Show me your package.json dependencies and the app running in browser.



### ELD-103: Configure CORS and environment variables

* **Priority:** HIGH
* **Points:** 1
* **Dependencies:** ELD-101, ELD-102
* **Description:** Ensure Django allows requests from the React dev server, and set up .env files for both projects.
* **Acceptance Criteria:**
* [ ] Django CORS_ALLOWED_ORIGINS includes `http://localhost:5173` (Vite dev server)
* [ ] Django .env file stores SECRET_KEY, DEBUG, ALLOWED_HOSTS
* [ ] React .env file stores `VITE_API_BASE_URL` pointing to Django server
* [ ] A test POST from React axios to Django returns 200 (not a CORS error)
* [ ] .env files are in .gitignore


* **Checkpoint:**
> Make a test axios.post() call from React to Django and show me it works in browser network tab.



### ELD-104: Deploy backend to Railway or Render

* **Priority:** MEDIUM
* **Points:** 3
* **Dependencies:** ELD-103
* **Description:** Deploy the Django backend to a free cloud host so it is publicly accessible.
* **Acceptance Criteria:**
* [ ] Django app deployed to Railway.app or Render.com
* [ ] Environment variables set in the hosting dashboard (SECRET_KEY, DEBUG=False, ALLOWED_HOSTS)
* [ ] CORS updated to allow the Vercel frontend domain
* [ ] Health check endpoint `GET /api/health/` returns 200 at the live URL
* [ ] Live URL documented in README.md


* **Checkpoint:**
> Share the live backend URL. I'll verify /api/health/ is accessible.



### ELD-105: Deploy frontend to Vercel

* **Priority:** MEDIUM
* **Points:** 2
* **Dependencies:** ELD-104
* **Description:** Deploy the React frontend to Vercel and connect it to the live Django backend.
* **Acceptance Criteria:**
* [ ] React app deployed to Vercel via GitHub integration
* [ ] `VITE_API_BASE_URL` environment variable set in Vercel dashboard to live backend URL
* [ ] App loads at a public Vercel URL without errors
* [ ] No console CORS errors when hitting the backend
* [ ] Live frontend URL documented in README.md


* **Checkpoint:**
> Share the live Vercel URL. I'll open it and check the browser console.



---

## 🗺️ Epic 2: Geocoding & Routing

**Goal:** Implement the core GIS services to convert addresses to coordinates and calculate driving routes.

### ELD-201: Implement geocoding service

* **Priority:** HIGH
* **Points:** 3
* **Dependencies:** ELD-101
* **Description:** Convert human-readable address strings into (lat, lng) coordinates using Nominatim (OpenStreetMap's free API — no API key needed).
* **Acceptance Criteria:**
* [ ] File `trip/geocoding.py` created with a `geocode_address(address: str) -> tuple[float, float]` function
* [ ] Uses Nominatim API: `https://nominatim.openstreetmap.org/search?q=...&format=json`
* [ ] Sets a proper `User-Agent` header in the request (required by Nominatim ToS)
* [ ] Returns (latitude, longitude) as floats
* [ ] Raises a meaningful exception if address not found
* [ ] Tested manually: `geocode_address('Chicago, IL')` returns approx (41.85, -87.65)
* [ ] Rate limiting respected: adds a small sleep between calls if geocoding multiple addresses


* **Checkpoint:**
> Show me the function and a test result for 3 different city inputs.



### ELD-202: Implement routing service

* **Priority:** HIGH
* **Points:** 4
* **Dependencies:** ELD-201
* **Description:** Get driving distance (miles), driving duration (minutes), and road geometry (polyline points) between two lat/lng coordinates using OpenRouteService free API.
* **Acceptance Criteria:**
* [ ] File `trip/routing.py` created
* [ ] Function `get_route(origin: tuple, destination: tuple) -> dict` implemented
* [ ] Uses OpenRouteService Directions API (free, needs a free API key from openrouteservice.org)
* [ ] Returns: `{ distance_miles: float, duration_minutes: float, geometry: [[lat,lng], ...] }`
* [ ] Geometry is a list of [lat, lng] coordinate pairs for drawing the polyline
* [ ] Function `get_intermediate_point(origin, destination, fraction)` implemented — returns a lat/lng at a given fraction (0.0–1.0) along the route (for placing fuel stop markers)
* [ ] Tested: Chicago → Dallas returns ~925 miles, ~13 hours


* **Checkpoint:**
> Show me the raw JSON response and the parsed output for a Chicago→Dallas route.



---

## ⏱️ Epic 3: HOS Engine

**Goal:** Build the complex logic engine that enforces FMCSA Hours of Service rules (11/14/70-hour rules).

### ELD-301: Build trip state simulator core

* **Priority:** CRITICAL
* **Points:** 3
* **Dependencies:** ELD-202
* **Description:** Create the TripSimulator class that manages all HOS state variables and produces an ordered timeline of events.
* **Acceptance Criteria:**
* [ ] File `trip/hos_calculator.py` created
* [ ] Class `TripSimulator` with these state attributes: `clock_time` (datetime), `daily_driving_mins` (int), `window_start_time` (datetime or None), `cumulative_driving_since_break` (int mins), `cycle_used_mins` (int), `miles_since_fuel` (float), `current_day` (int), `timeline` (list of event dicts)
* [ ] Method `add_event(status, duration_mins, location, note)` appends to timeline and advances clock_time
* [ ] Timeline events have: `{ status, start_time, end_time, duration_mins, location, note, day }`
* [ ] Method `get_daily_logs()` groups timeline into per-day structures
* [ ] Constructor accepts `cycle_used_hours` to pre-set cycle_used_mins


* **Checkpoint:**
> Show me the class structure and an example of timeline output for a 2-event simulation.



### ELD-302: Implement 11-hour driving limit

* **Priority:** CRITICAL
* **Points:** 2
* **Dependencies:** ELD-301
* **Description:** The driver cannot drive more than 11 total hours in a single duty window. After 11 hours of driving, force a 10-hour off-duty rest.
* **Acceptance Criteria:**
* [ ] TripSimulator tracks `daily_driving_mins` — total driving minutes since last 10-hr rest
* [ ] Before adding any DRIVING event, check: `daily_driving_mins + proposed_mins > 660` (11 hrs = 660 mins)
* [ ] If over limit: split the driving — drive only up to the remaining allowed minutes, then automatically insert a `10-hour OFF DUTY` rest event
* [ ] After 10-hr rest: `daily_driving_mins` resets to 0, `window_start_time` resets to None, `cumulative_driving_since_break` resets to 0
* [ ] Unit test: simulate 12 hours of continuous driving → result should show 11hrs driving + rest inserted automatically


* **Checkpoint:**
> Write a unit test that feeds 720 minutes of driving and verify the output timeline shows a rest at the 660-minute mark.



### ELD-303: Implement 14-hour driving window

* **Priority:** CRITICAL
* **Points:** 3
* **Dependencies:** ELD-302
* **Description:** The driver cannot drive after 14 consecutive hours from when their duty day started. The window starts on first on-duty activity.
* **Acceptance Criteria:**
* [ ] `window_start_time` is set when the first non-off-duty event of a shift starts
* [ ] Before any DRIVING event: check if `clock_time + proposed_driving > window_start_time + 14hrs`
* [ ] If window would expire during a drive segment: split — drive until window expires, then insert 10-hr rest
* [ ] NON-DRIVING on-duty time also counts against the 14-hr window (doesn't stop the clock)
* [ ] After 10-hr rest: 14-hr window completely resets
* [ ] Unit test: start shift at 6am, drive 8hrs, do 3hrs on-duty-not-driving, then try to drive → should be blocked (14hrs = 8pm cutoff, and 8+3=11hrs into the window means only 3 more hours of window left)


* **Checkpoint:**
> Unit test: start at 6am, drive 9hrs, take 30-min break, drive 2.5hrs more — show me that driving is cut off at exactly the 14-hr mark from 6am.



### ELD-304: Implement 30-minute break rule

* **Priority:** CRITICAL
* **Points:** 3
* **Dependencies:** ELD-303
* **Description:** After every 8 cumulative hours of driving since the last break, a 30-minute non-driving break is required before driving can resume.
* **Acceptance Criteria:**
* [ ] `cumulative_driving_since_break` tracks driving minutes since last 30-min+ non-driving break
* [ ] Any non-driving event ≥30 consecutive minutes resets `cumulative_driving_since_break` to 0
* [ ] Before starting a DRIVING event: if `cumulative_driving_since_break + proposed >= 480` (8hrs = 480 mins): automatically insert 30-min OFF DUTY break first, then resume driving
* [ ] The 30-min break does NOT reset the 14-hr window clock
* [ ] The 30-min break DOES reset `cumulative_driving_since_break`
* [ ] Unit test: drive 7hrs 45min, add 10-min on-duty stop, drive 30min more → break should auto-insert because cumulative driving exceeded 8hrs


* **Checkpoint:**
> Show me a test with exactly 8 hours of accumulated driving (possibly split across multiple segments). Verify a break auto-inserts before the 9th hour.



### ELD-305: Implement 10-hour off-duty reset

* **Priority:** CRITICAL
* **Points:** 2
* **Dependencies:** ELD-304
* **Description:** When a 10-hour off-duty rest is inserted, all daily limits reset and a new duty window begins.
* **Acceptance Criteria:**
* [ ] After a 10-hr rest event: `daily_driving_mins = 0`, `window_start_time = None`, `cumulative_driving_since_break = 0`
* [ ] `current_day` increments when crossing midnight
* [ ] The rest is logged as OFF DUTY in the timeline
* [ ] If the rest crosses midnight, the event is split across two log sheet days properly
* [ ] After rest, driver can immediately start a new 14-hr window with fresh 11-hr driving allowance


* **Checkpoint:**
> Show me a 2-day trip timeline where Day 1 runs out of hours and Day 2 correctly resets with full driving time available.



### ELD-306: Implement 70-hour/8-day cycle limit

* **Priority:** HIGH
* **Points:** 3
* **Dependencies:** ELD-305
* **Description:** Track cumulative on-duty hours across the rolling 8-day period. The `cycle_used_hours` input pre-populates this counter.
* **Acceptance Criteria:**
* [ ] `cycle_used_mins` starts at `cycle_used_hours * 60` from the input
* [ ] Every ON DUTY event (both driving and not-driving) increments `cycle_used_mins`
* [ ] Before any DRIVING event: check `cycle_used_mins >= 4200` (70hrs = 4200 mins)
* [ ] If cycle limit hit: insert a 34-hour OFF DUTY restart (resets cycle to 0)
* [ ] After 34-hr restart: `cycle_used_mins = 0`
* [ ] Unit test: set cycle_used_hours=68, simulate a 3-hour drive → should drive 2hrs, hit limit, insert 34-hr restart, then complete remaining 1hr


* **Checkpoint:**
> Test with cycle_used_hours=65. Show me the timeline showing the 34-hr restart being automatically inserted.



### ELD-307: Implement fuel stop insertion (every 1,000 miles)

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-306
* **Description:** Automatically insert 30-minute fuel stops when cumulative miles since last fuel reaches 1,000.
* **Acceptance Criteria:**
* [ ] `miles_since_fuel` tracks miles driven since last fuel event
* [ ] During route processing: when `miles_since_fuel >= 1000`, interrupt the driving segment and insert a 30-min ON_DUTY_NOT_DRIVING fuel stop
* [ ] Fuel stop location is calculated as the geographic point on the route at the 1,000-mile mark
* [ ] After fuel stop: `miles_since_fuel` resets to 0
* [ ] Fuel stop counts toward on-duty time (not driving) and toward the 14-hr window
* [ ] Multiple fuel stops correctly inserted on long legs (e.g., 2,500-mile leg gets 2 fuel stops)


* **Checkpoint:**
> Plan a trip with a 2,200-mile leg. Show me 2 fuel stops in the timeline at approximately miles 1,000 and 2,000.



### ELD-308: Implement pickup and dropoff stop logic

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-307
* **Description:** At pickup and dropoff locations, insert 1-hour on-duty-not-driving stops for loading/unloading.
* **Acceptance Criteria:**
* [ ] When driver arrives at pickup: automatically add 60-min ON_DUTY_NOT_DRIVING event labeled 'Loading at Pickup'
* [ ] When driver arrives at dropoff: automatically add 60-min ON_DUTY_NOT_DRIVING event labeled 'Unloading at Dropoff'
* [ ] Both stops count toward: daily on-duty total, 14-hr window, 70-hr cycle
* [ ] These stops do NOT count as driving for the 11-hr or 30-min break calculations
* [ ] The 30-min break `cumulative_driving_since_break` does NOT reset from these stops (they are on-duty, but a 1-hr stop DOES satisfy the 30-min break requirement — reset it)
* [ ] Timeline shows correct location names for these events


* **Checkpoint:**
> Show me a short-trip timeline where pickup and dropoff stops appear with correct durations and locations.



### ELD-309: Build per-day log data from timeline

* **Priority:** HIGH
* **Points:** 3
* **Dependencies:** ELD-308
* **Description:** Convert the flat timeline of events into structured per-day data ready for the frontend log sheet renderer.
* **Acceptance Criteria:**
* [ ] Function `build_log_sheets(timeline, start_date)` implemented in `trip/log_builder.py`
* [ ] Groups timeline events by calendar day (midnight to midnight)
* [ ] Events that span midnight are split across two days
* [ ] Each day object contains: `date`, `day_number`, `from_location`, `to_location`, `total_miles_today`, `duty_blocks` (list of {status, start_minutes, end_minutes}), `remarks` (list of {time_minutes, location, note})
* [ ] duty_blocks use `start_minutes` and `end_minutes` as integers from midnight (0–1440)
* [ ] ALL duty_blocks for a day must sum to exactly 1440 minutes (24 hours) — fill gaps with OFF_DUTY
* [ ] Totals calculated: off_duty_hours, sleeper_berth_hours, driving_hours, on_duty_not_driving_hours — must sum to 24.0
* [ ] Recap section calculated: on_duty_today, cycle_total, hours_available_tomorrow


* **Checkpoint:**
> Show me the JSON output of build_log_sheets() for a 2-day trip. I'll manually verify the minutes sum to 1440 per day.



### ELD-310: Wire up main API endpoint

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-309
* **Description:** Create the POST /api/plan-trip/ endpoint that orchestrates all the above services and returns the complete response.
* **Acceptance Criteria:**
* [ ] View `PlanTripView` in `trip/views.py` handles POST /api/plan-trip/
* [ ] Validates input: all 4 fields required, cycle_used_hours between 0–69
* [ ] Returns 400 with error message if any field is invalid or address not found
* [ ] Orchestrates: geocode 3 locations → get 2 routes → simulate trip → build log sheets
* [ ] Response includes: `trip_summary`, `route` (geometry + stops array), `log_sheets` array
* [ ] Each stop in route includes: type, label, lat, lng, arrival_time, duration_minutes
* [ ] Returns 200 with complete JSON on success
* [ ] Tested via curl or Postman: Chicago→Dallas→LA with 20 cycle hours returns valid response


* **Checkpoint:**
> Run this curl command and share the raw JSON response: `curl -X POST http://localhost:8000/api/plan-trip/ -H 'Content-Type: application/json' -d '{"current_location":"Chicago, IL","pickup_location":"Dallas, TX","dropoff_location":"Los Angeles, CA","cycle_used_hours":20}'`



---

## 🗺️ Epic 4: Route Map UI

**Goal:** Visualize the trip on an interactive map.

### ELD-401: Setup Leaflet map component

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-102
* **Description:** Create the base RouteMap React component with Leaflet/OpenStreetMap tiles.
* **Acceptance Criteria:**
* [ ] React component `RouteMap.jsx` created
* [ ] `react-leaflet` MapContainer renders with OpenStreetMap tile layer
* [ ] Map fills its container div, with proper height (e.g., 450px or 60vh)
* [ ] Map initializes centered on USA (roughly lat 39, lng -95, zoom 4)
* [ ] Leaflet CSS imported (critical — map won't render without it)
* [ ] No console errors about missing Leaflet icons (common gotcha — fix icon paths)
* [ ] Map is interactive: zoom, pan work


* **Checkpoint:**
> Show me a screenshot of the blank map rendering correctly in the browser.



### ELD-402: Draw route polyline on map

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-401, ELD-310
* **Description:** Draw the actual road route as a polyline using the geometry coordinates from the API response.
* **Acceptance Criteria:**
* [ ] Polyline drawn using Leaflet's Polyline component with coordinates from `route.geometry`
* [ ] Line color is distinct and visible (e.g., blue #2563eb, weight 4)
* [ ] Map auto-fits bounds to the polyline (fitBounds) so the entire route is visible on load
* [ ] If API not yet called, map shows placeholder or empty state
* [ ] Polyline updates when a new trip is planned


* **Checkpoint:**
> Plan a trip through the form. Show me the map with the polyline drawn.



### ELD-403: Add stop markers with popups

* **Priority:** HIGH
* **Points:** 3
* **Dependencies:** ELD-402
* **Description:** Place a marker at every stop on the route. Each marker has a color indicating its type and a popup with details.
* **Acceptance Criteria:**
* [ ] Each stop in `route.stops` gets a marker on the map
* [ ] Different marker colors/icons by type: start=blue, pickup=green, dropoff=dark green, fuel=orange, rest=red, break=gray
* [ ] Clicking a marker opens a popup showing: stop type, location name, arrival time, duration
* [ ] Markers render correctly at their lat/lng positions
* [ ] Custom SVG or emoji icons used (not just default blue Leaflet markers for everything)
* [ ] All markers visible and clickable without overlapping issues


* **Checkpoint:**
> Show me a screenshot with at least 4 different types of markers visible and one popup open.



### ELD-404: Build trip summary info panel

* **Priority:** MEDIUM
* **Points:** 2
* **Dependencies:** ELD-403
* **Description:** Display key trip statistics alongside the map in a clean info panel.
* **Acceptance Criteria:**
* [ ] Panel shows: Total Distance (miles), Total Trip Duration (days + hours), Number of Driving Days, Number of Log Sheets
* [ ] Panel shows a breakdown: Leg 1 distance/time (Current→Pickup), Leg 2 distance/time (Pickup→Dropoff)
* [ ] Panel shows: Total Driving Hours, Total Rest Hours
* [ ] Panel visible without scrolling (or easily accessible)
* [ ] Numbers match the API response data exactly
* [ ] Loading skeleton shown while API call is in progress


* **Checkpoint:**
> Plan a cross-country trip and verify all numbers in the panel match the API response data.



---

## 📝 Epic 5: ELD Log Sheet Renderer

**Goal:** Render the daily logs in the specific FMCSA grid format using HTML5 Canvas.

### ELD-501: Build log sheet canvas scaffold

* **Priority:** CRITICAL
* **Points:** 3
* **Dependencies:** ELD-309
* **Description:** Create the LogSheet component that renders a single FMCSA-style daily log sheet. Start with the blank grid structure.
* **Acceptance Criteria:**
* [ ] Component `LogSheet.jsx` accepts a `logData` prop (single day object from API)
* [ ] Uses HTML Canvas (preferred) or SVG for drawing
* [ ] Canvas size: at least 900px wide × 600px tall, or scalable
* [ ] Outer border drawn for the full log sheet
* [ ] The 24-hour grid area is defined with correct proportions
* [ ] Four horizontal row bands drawn with labels: Off Duty, Sleeper Berth, Driving, On Duty (Not Driving)
* [ ] The visual appearance resembles the FMCSA form shown in Image 1


* **Checkpoint:**
> Show me a screenshot of the blank log sheet scaffold — just the empty grid, no data yet.



### ELD-502: Draw 24-hour grid with time markers

* **Priority:** CRITICAL
* **Points:** 3
* **Dependencies:** ELD-501
* **Description:** Render the detailed 24-hour time ruler at the top and bottom of the log grid with correct hour and 15-minute tick marks.
* **Acceptance Criteria:**
* [ ] Top time ruler spans the full grid width from Midnight(left) to Midnight(right)
* [ ] Hour labels shown: Midnight, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, Noon, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, Midnight
* [ ] Major tick marks at every hour (taller lines)
* [ ] Minor tick marks at every 15 minutes (shorter lines)
* [ ] Second identical time ruler below the 4 duty status rows (for Remarks section)
* [ ] Grid lines are light gray, readable but not dominant
* [ ] Time ruler matches the exact style of the FMCSA sample form (Image 1)


* **Checkpoint:**
> Show me a screenshot of just the grid with time markers. Zoom in — I want to verify 15-min tick marks are present.



### ELD-503: Draw duty status lines from log data

* **Priority:** CRITICAL
* **Points:** 4
* **Dependencies:** ELD-502
* **Description:** For each duty_block in a day's log data, draw a solid horizontal line on the correct row at the correct time position.
* **Acceptance Criteria:**
* [ ] Function `minutesToX(minutes)` converts a time (0–1440) to a canvas x-coordinate
* [ ] For each duty_block: draw a thick horizontal line (strokeWidth 2–3) on the corresponding row
* [ ] Vertical connector lines drawn between consecutive status changes (line drops/rises to next row)
* [ ] Status-to-row mapping: off_duty→Row1, sleeper_berth→Row2, driving→Row3, on_duty_not_driving→Row4
* [ ] Lines are dark/black, clearly visible on the grid
* [ ] Correct time blocks: e.g., driving from 6:30am–2:30pm shows a line from the 6:30 position to the 14:30 position on Row 3
* [ ] Visual result looks like a filled-out FMCSA paper log


* **Checkpoint:**
> Feed the component a day with: off-duty midnight–6am, driving 6am–2pm, 30-min break 2pm–2:30pm, driving 2:30pm–7pm, off-duty 7pm–midnight. Show me the rendered result.



### ELD-504: Render log sheet header fields

* **Priority:** HIGH
* **Points:** 3
* **Dependencies:** ELD-503
* **Description:** Fill in all the text fields in the header section of the log form.
* **Acceptance Criteria:**
* [ ] Date field shows: month / day / year (from log_data.date)
* [ ] 'From:' field shows the starting city of that day
* [ ] 'To:' field shows the ending city of that day
* [ ] Total Miles Driving Today shows the mileage for that specific day
* [ ] 'Name of Carrier' field shows a value (can be 'Trip Carrier' or user-inputted)
* [ ] Total Hours column on the right shows hours for each of the 4 duty statuses
* [ ] Total hours sum display at the bottom right
* [ ] All text is legible, positioned correctly within the form layout
* [ ] 'Original - File at home terminal / Duplicate - Driver retains 8 days' note visible


* **Checkpoint:**
> Show me a fully rendered log sheet header with all fields populated for a real trip day.



### ELD-505: Render remarks section

* **Priority:** HIGH
* **Points:** 3
* **Dependencies:** ELD-504
* **Description:** Fill in the Remarks section with location notes for every duty status change.
* **Acceptance Criteria:**
* [ ] Remarks section appears below the second time ruler
* [ ] Each remark entry shows: time (e.g., '6:00 AM') and location/city name
* [ ] One remark entry for every duty status change in the day
* [ ] Remarks are listed chronologically
* [ ] Text fits within the remarks box without overflow
* [ ] If there are many remarks, text size reduces or entries are condensed to fit
* [ ] Section matches the visual style of Image 1's Remarks area


* **Checkpoint:**
> Show me the remarks section for a day with at least 6 status changes.



### ELD-506: Render recap/totals section

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-505
* **Description:** Fill in the bottom Recap section with the 70-hour compliance numbers.
* **Acceptance Criteria:**
* [ ] Recap section visible at the bottom of the log sheet
* [ ] '70 Hour/8 Day' column populated
* [ ] Column A: Total hours on duty today (driving + on-duty-not-driving)
* [ ] Column B: Total hours available tomorrow (70 - cycle_total)
* [ ] Column C: Total on-duty hours in last 7 days including today
* [ ] Numbers match the recap object from the API response
* [ ] Section labeled clearly: '70 Hour/8 Day Drivers'


* **Checkpoint:**
> Show me the recap section values for a trip where cycle_used_hours=40. Verify the math manually.



### ELD-507: Build multi-day log sheet list

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-506
* **Description:** Render all log sheets in a scrollable paginated view with navigation.
* **Acceptance Criteria:**
* [ ] Component `LogSheetList.jsx` renders all log sheets from the API response
* [ ] Each sheet clearly labeled: 'Day 1 of 3', 'Day 2 of 3', etc.
* [ ] Sheets stacked vertically with clear visual separation between days
* [ ] Heading above the sheets: 'Driver Daily Logs — [X] sheets'
* [ ] If only 1 log sheet, shows just that one without extra navigation


* **Checkpoint:**
> Plan a 3-day trip. Show me all 3 log sheets rendered in sequence.



### ELD-508: Add print/download functionality

* **Priority:** MEDIUM
* **Points:** 2
* **Dependencies:** ELD-507
* **Description:** Allow the user to print or download the log sheets.
* **Acceptance Criteria:**
* [ ] 'Print Logs' button visible above the log sheets section
* [ ] Clicking 'Print Logs' opens the browser print dialog with ONLY the log sheets (no navigation/form visible)
* [ ] Print CSS applied so each log sheet fits on one A4/Letter page
* [ ] Alternatively: 'Download as PDF' using browser print-to-PDF (acceptable)
* [ ] Log sheets are clearly legible in print preview


* **Checkpoint:**
> Click print and show me the print preview with log sheets properly laid out.



---

## 🎨 Epic 6: UI/UX Polish

**Goal:** Make the application look professional, handle errors gracefully, and provide a good user experience.

### ELD-601: Build the trip input form

* **Priority:** HIGH
* **Points:** 3
* **Dependencies:** ELD-102
* **Description:** Create a polished, production-quality input form for the 4 trip inputs.
* **Acceptance Criteria:**
* [ ] 4 labeled input fields: Current Location, Pickup Location, Dropoff Location, Current Cycle Used (Hrs)
* [ ] Current Cycle Used is a number input with min=0, max=69, step=0.5
* [ ] All fields have placeholder text guiding the user (e.g., 'e.g. Chicago, IL')
* [ ] Form validates: all fields required, cycle_hours 0-69
* [ ] Inline error messages shown under each field on invalid submit
* [ ] Submit button text: 'Plan My Trip' or similar
* [ ] Button disabled and shows spinner while API call is in progress
* [ ] Form design matches the app's overall visual theme


* **Checkpoint:**
> Show me the form with all 4 fields, and demonstrate validation errors appearing.



### ELD-602: Implement loading and error states

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-601
* **Description:** Show clear feedback while the API is working and when errors occur.
* **Acceptance Criteria:**
* [ ] Loading state: spinner or animated progress indicator shown after form submit
* [ ] Loading message: 'Calculating your route and generating logs...' or similar
* [ ] API error: if backend returns 400 or 500, show a user-friendly error message (not raw JSON)
* [ ] Network error: if backend unreachable, show 'Could not connect to server. Please try again.'
* [ ] Address not found: if geocoding fails, show 'Could not find [location name]. Please try a more specific address.'
* [ ] Error message is visually distinct (red border/background)
* [ ] User can correct the form and resubmit after an error


* **Checkpoint:**
> Deliberately enter an invalid address. Show me the error message displayed to the user.



### ELD-603: Implement overall page layout

* **Priority:** MEDIUM
* **Points:** 2
* **Dependencies:** ELD-602
* **Description:** Design the full page layout that organizes the form, map, summary, and log sheets in a logical, readable flow.
* **Acceptance Criteria:**
* [ ] Page has a clear header/logo area (e.g., 'ELD Trip Planner' with a truck icon)
* [ ] Layout flow: Header → Input Form → [after submission:] Trip Summary + Map → Log Sheets
* [ ] Results section only visible after a successful API response
* [ ] Map and Trip Summary appear side-by-side on desktop (>768px), stacked on mobile
* [ ] Log sheets section below the map with a clear section heading
* [ ] Page is scrollable; user naturally scrolls down to see results
* [ ] Consistent color scheme, font, and spacing throughout


* **Checkpoint:**
> Show me a full-page screenshot of the app after planning a trip.



### ELD-604: Apply visual polish and design system

* **Priority:** MEDIUM
* **Points:** 2
* **Dependencies:** ELD-603
* **Description:** Elevate the visual quality of the entire app. It should look professional, not like a default-styled Bootstrap app.
* **Acceptance Criteria:**
* [ ] Consistent color palette (not default browser colors): pick 1 primary color + neutrals
* [ ] Custom font loaded from Google Fonts (not system default)
* [ ] Cards/panels have subtle shadows or borders
* [ ] Input fields have styled focus states
* [ ] Hover effects on interactive elements
* [ ] Stop type icons/badges in the trip summary are color-coded consistently with map markers
* [ ] App does not look 'generic' — has a distinct visual identity
* [ ] No layout breaks on viewport widths 375px, 768px, 1280px


* **Checkpoint:**
> Show me the app on both mobile (375px) and desktop (1280px) widths.



---

## 🚀 Epic 7: Testing & Deployment

**Goal:** Verify the application handles various edge cases and is successfully hosted on the web.

### ELD-701: Test Case: Short trip (1 day, <500 miles)

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-310, ELD-507
* **Description:** End-to-end test of a short trip that fits within a single driving day.
* **Acceptance Criteria:**
* [ ] Test input: Current=Chicago IL, Pickup=Indianapolis IN, Dropoff=Columbus OH, Cycle=0
* [ ] Expected: 1 log sheet, ~5-6 hours driving, no overnight rest required
* [ ] Log sheet shows: driving blocks + 1hr pickup + 1hr dropoff
* [ ] Total hours on log sheet sum to exactly 24
* [ ] Map shows correct polyline and markers
* [ ] No HOS violations in output (no limits exceeded)


* **Checkpoint:**
> Run this exact test case. Share the API response JSON and log sheet screenshot.



### ELD-702: Test Case: Medium trip (2 days, ~1000 miles)

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-701
* **Description:** End-to-end test requiring exactly one overnight 10-hour rest.
* **Acceptance Criteria:**
* [ ] Test input: Current=Chicago IL, Pickup=Dallas TX, Dropoff=Houston TX, Cycle=0
* [ ] Expected: 2 log sheets
* [ ] Day 1: ~11 hours driving, rest period begins before midnight
* [ ] Day 2: continued driving, pickup stop (1hr), dropoff stop (1hr)
* [ ] 30-minute break appears after 8 hours of driving on whichever day it falls
* [ ] Both log sheets total exactly 24 hours


* **Checkpoint:**
> Run this test. Show me both log sheets and verify rest period appears correctly.



### ELD-703: Test Case: Long trip (3 days, ~2000 miles)

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-702
* **Description:** End-to-end test with multiple days, multiple fuel stops, and multiple rest periods.
* **Acceptance Criteria:**
* [ ] Test input: Current=New York NY, Pickup=Chicago IL, Dropoff=Los Angeles CA, Cycle=0
* [ ] Expected: 3+ log sheets
* [ ] At least 2 overnight rest periods
* [ ] At least 1 fuel stop visible on map (Leg 2 is ~2000+ miles → multiple fuel stops)
* [ ] All log sheets sum to 24 hours each
* [ ] Map shows all stops including fuel stops


* **Checkpoint:**
> Run this test. Share all log sheets and the map screenshot showing fuel stops.



### ELD-704: Test Case: Non-zero cycle hours

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-703
* **Description:** Verify that the cycle_used_hours input correctly reduces available hours.
* **Acceptance Criteria:**
* [ ] Test input: Current=Chicago IL, Pickup=Kansas City MO, Dropoff=Denver CO, Cycle=60
* [ ] With 60hrs already used, only 10hrs remain before 70-hr cap hit
* [ ] Expected: driver hits 70-hr cycle limit quickly, 34-hr restart inserted
* [ ] Log sheet shows the 34-hr restart block as OFF DUTY
* [ ] After restart, driver has full 70 hours available again
* [ ] This behavior is clearly visible in the timeline


* **Checkpoint:**
> Run this test with cycle=60. Show me where the 34-hr restart appears in the log sheets.



### ELD-705: Final deployment verification

* **Priority:** HIGH
* **Points:** 2
* **Dependencies:** ELD-701, ELD-702, ELD-703, ELD-704, ELD-105
* **Description:** Verify the fully deployed app works end-to-end on Vercel + Railway.
* **Acceptance Criteria:**
* [ ] All 4 test cases above pass on the live hosted URL (not localhost)
* [ ] No CORS errors in browser console
* [ ] Map loads correctly on live URL (Leaflet tiles load)
* [ ] Log sheets render correctly on live URL
* [ ] Page load time under 5 seconds on a normal connection
* [ ] README.md has: live URL, GitHub link, setup instructions, a brief description
* [ ] GitHub repository is public


* **Checkpoint:**
> Share the live URL. I'll run all 4 test cases end-to-end on the hosted version.