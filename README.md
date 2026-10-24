# Shinkai_devs_SDIT

TrafficSense
Verify the road, not the employee.

TrafficSense is a traffic-delay platform for Mangaluru and Udupi, built for the Nexathon hackathon (Shree Devi) by team Shinkai Devs. It tells commuters why a road is blocked, gives companies a fair and provable answer to "why was this employee late?", and gives the traffic authority evidence about roads that keep failing.

The core is the Road Delay Certificate: the server checks live Google traffic on each employee's HR-approved route, and the office gate punch caps the result. The employee's phone GPS is never used to excuse them, and there is no AI or machine learning anywhere in the decision.

Contents
The problem
How it works: the Road Delay Certificate
Design choices
The four versions
Incident reports and verification levels
Tech stack
Folder layout
Setup and run (Windows)
Environment variables
API endpoints
Demo data
Prototype status
Team
Git workflow
The problem
Employers on the NH-66 corridor (Pumpwell, Thokkotu, Nanthoor, Kottara) lose hours every week to late arrivals, and they can't tell a real jam from an excuse. Today the options are bad:

Trust the employee's word. This is unfair to everyone who is honest.
Track the employee's phone. This is invasive, easy to fake with GPS spoofing apps, and risky under India's DPDP Act.
Ignore traffic. This punishes people for a flooded road or an accident they couldn't avoid.
Google Maps and Waze already handle navigation and incident reports well. TrafficSense doesn't replace them. It links verified road delays to fair attendance for companies, and to long-term evidence for the authorities who own the roads.

How it works: the Road Delay Certificate
HR fixes each employee's commute route in advance (assigned_routes). It is made of named road segments, such as Ullal → Thokkotu → NH-66 → Pumpwell → Padil.
The server records the road itself. Every 5 minutes, backend/app/poller.py asks the Google Routes API (TRAFFIC_AWARE) how long each segment takes right now, and stores a snapshot (segment_snapshots). Google can't report past traffic later, so we keep our own record as it happens.
Arrival comes from the office gate punch (gate_punches), not from the phone.
The certificate replays the commute:
Expected departure = shift start − the route's no-traffic time − a 10 min buffer.
From that moment, the server "drives" the route segment by segment. For each segment it uses the snapshot closest to that time (within ±10 min).
Certified delay = the extra minutes the road added on each segment beyond its no-traffic time.
The verdict:
Minutes late = gate punch − shift start.
Late by up to 5 min (the grace period): On time.
Lateness fully covered by the certified delay + grace: Late · excused.
Some of it covered: Late · partly excused, showing the unexcused minutes.
None of it covered: Late · not excused.
No punch recorded: No gate punch.
Appeal: anyone with unexcused minutes sees "Disagree? Raise a manual appeal with HR." The system gives evidence, and people make the final call.
If the server has no snapshot for a segment, it certifies no delay for that segment. Missing data never counts as an excuse.

Design choices
Why not use the employee's GPS?

Privacy: nobody is tracked, and personal trips stay private.
Integrity: phone GPS is easy to spoof, and coworkers can collude to fake a jam. Road data from Google, recorded by our server, can't be changed by the person who benefits.
Law: commute tracking raises consent and purpose-limitation questions under the DPDP Act. Checking the road instead of the person avoids collecting that data at all.
The phone app can still report a cause (accident, flood, and so on), but a report never decides who is excused.

Why no AI or ML?

Explainable: HR decisions about pay and attendance must be traceable line by line. Every certificate shows each segment, its normal time, its actual time, and the extra minutes.
No training data: there is no real labelled data on Mangaluru delays yet. A model trained on made-up data would only look accurate.
Fair and auditable: fixed rules give the same answer for everyone and can be checked by HR, the employee, or an auditor.
The weekly reports use a fixed template, and rerouting uses Google's own alternative routes.

The four versions
The first screen asks "Who are you?" and shows four roles. Each role has its own artwork and sign-in page (demo mode: any details work). The orange accent and the traffic colours are the same everywhere: green (free), yellow, orange, red, and black (closed). There's a light/dark toggle, and every button has a hover highlight.

1. Commuter (web /commuter and Flutter app)
Full-screen live map with Google traffic, real Mangaluru markers, and place search (Places API).
Route alert, for example: "Accident ahead at Pumpwell, +32 min, 14 people reported, verified by GPS speed", with an Avoid option.
"Near you" incidents list with reason, delay, confidence and verification level.
Report in one tap: pick a reason, and the location and time are attached automatically. The report goes to POST /incidents/report.
SOS emergency button.
Live weather chip and heavy-rain warning (Open-Meteo).
2. Employee (web /employee and Flutter app)
Today's commute: route (for example Ullal → TechPark, Padil), ETA, current delay and its cause, and a "faster route found" tip.
Live route map and alerts on your route.
Commute tracking panel: shows the commute window (8:00 to 9:30) and states that the company never sees personal trips.
Commute time this week chart, and a "Why you were late (30 days)" breakdown.
Late arrival log: date, delay, reason, evidence and status (Auto-justified / Needs note), with export.
Honesty badge, one-tap reporting, and the rain warning.
3. Company (web /company, sidebar layout)
Overview:
Stat tiles: On time, Delayed, Late · excused, Late · not excused, Average delay.
Live employee map.
Auto attendance for today (marked by the office geofence, no punching in).
Fair lateness over 30 days (late minutes split by verified cause).
Regularly late employees.
Honesty badges (points for verified reports, minus points for false claims; Bronze, Silver and Gold tiers).
Tracking policies and "What the company can see" (visible vs never visible).
Auto-complaint to Gov and "Shared with Government".
Map: live employee and incident map.
Weather:
3-day, 5-day or custom forecast for the roads on employees' HR-approved routes.
Risk level, expected cause and employees affected, with filters and paging.
Expected causes are forecasts, not confirmed incidents.
Status / Employees: live arrivals board with search, status and date filters, sorting by delay, and route, reason, verification and evidence per person.
Reports: a weekly report builder covering weather, road and map, and employee status for this week, last week or a custom period. HR ticks "I have checked this report and approve it". The approved report is sent to the Authority Portal (POST /company-reports) and gets a portal reference. Report history is saved in the browser, and reports can be downloaded.
Shared with Gov: proven delays (verification level 4 or higher) are sent to the Authority Portal as anonymised evidence (no names). Status updates come back automatically.
4. Government: Authority Portal (web /gov, dark control-room layout)
Overview:
Stat tiles: company reports today, duplicates found, hours lost today, recurring hotspots, open referrals.
City traffic map with a live incident feed.
Commuter-hours lost today chart.
Incidents by reason chart.
Company reports:
Reports from companies, with automatic duplicate detection (same place and reason within 2 hours).
Actions: Merge (employees add up and evidence is combined), Verify, and Refer to agency.
Hotspots:
Recurring hotspots, for example "18 of the last 30 working days", with the main cause, commuter-hours lost and a suggested fix.
An evidence report generator with a Download PDF option.
Road ownership: maps each road segment to its responsible agency (NHAI, PWD Karnataka, MCC, MESCOM or the Traffic Police), with Confirm owner.
Referral tracking: stages Referred → Acknowledged → Investigation → Resolved.
Reports: monthly incidents by reason and recurring hotspots, exportable as a PDF.
Every page states that the evidence supports a traffic engineering investigation and that final decisions remain with authorised officials.

Incident reports and verification levels
User reports within 300 m with the same reason inside 2 hours merge into one incident. Each merge raises the incident's verification level and confidence.

Level	Meaning
1	User report
2	GPS location (every app report carries one)
3	Multiple users (3 or more reports)
4	GPS speed confirms (3+ reports and speed under 15 km/h)
5	Photo / video attached
6	Authority confirmed (POST /incidents/{id}/confirm)
Confidence = 30 + 10 × level + 2 × reports (counting up to 10 reports), capped at 99%. Severity is moderate below 10 min of delay, heavy from 10 min, and severe from 25 min.

Tech stack
Part	Technology
Web	React 19, Vite 6, TypeScript, Tailwind CSS v4, React Router, Recharts, lucide-react
Maps (web)	Google Maps JavaScript API via @vis.gl/react-google-maps (live TrafficLayer, Places API (New) search). Falls back to a drawn SVG map with no key.
Backend	Python 3.11, FastAPI, SQLAlchemy 2, pydantic-settings, httpx, Uvicorn
Database	SQLite by default. PostgreSQL + PostGIS on the host laptop by changing DATABASE_URL.
Live traffic	Google Routes API (computeRoutes, TRAFFIC_AWARE), polled every 5 min
Weather	Open-Meteo (no key), cached 30 min, with a sample fallback when offline
Mobile	Flutter (Dart 3.13+), google_maps_flutter, http, google_fonts. Android, plus web for quick checks.
Sharing	Cloudflare Tunnel or ngrok to expose the laptop backend to the team
Tests	pytest (backend/tests/test_api.py)
Folder layout
Shinkai_devs_SDIT/
├── web/                      React website (all four versions)
│   ├── .env.example          copy to .env (never commit .env)
│   └── src/
│       ├── App.tsx           routes; Google Maps loads once here
│       ├── pages/            Landing ("Who are you?"), Login
│       ├── versions/
│       │   ├── commuter/     CommuterView
│       │   ├── employee/     EmployeeDashboard
│       │   ├── company/      CompanyDashboard, WeatherPage, EmployeeStatusPage, ReportsPage
│       │   └── gov/          GovDashboard (Authority Portal)
│       ├── components/       GoogleTrafficMap, SvgTrafficMap, CompanyShell, ControlShell,
│       │                     NotificationsBell, WeatherChip, toast, theme, ui
│       └── data/             api.ts (backend calls + demo fallback), mock.ts, weather.ts, domains.ts
├── backend/                  FastAPI server
│   ├── .env.example          copy to .env (never commit .env)
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py           startup: create tables, seed demo data, start the traffic poller
│   │   ├── config.py         settings from .env
│   │   ├── db.py             database session
│   │   ├── models.py         tables
│   │   ├── schemas.py        API shapes (camelCase JSON)
│   │   ├── seed.py           demo data (same as web mock.ts)
│   │   ├── poller.py         Google Routes snapshots every 5 min
│   │   └── routers/          incidents, commute (certificate), gov, weather
│   └── tests/test_api.py
└── app/                      Flutter app (Commuter + Employee)
    ├── pubspec.yaml
    ├── android/              MAPS_API_KEY goes in android/local.properties (gitignored)
    └── lib/
        ├── main.dart, theme.dart
        ├── data/             mock.dart, weather.dart (Open-Meteo)
        ├── widgets/          traffic_map.dart, common.dart
        └── screens/          role_picker, login, commuter_home, employee_home
Database tables: segments, segment_snapshots, incidents, reports, employees, assigned_routes, gate_punches, company_reports, referrals, hotspots.

Setup and run (Windows)
Prerequisites
Git
Python 3.11
Node.js 20 or newer
Flutter SDK with Android Studio and an Android emulator (flutter doctor should be clean)
A Google Cloud API key, only if you want live maps and traffic
1. Clone and switch to your branch
git clone https://github.com/aahilsheikhofficial/Shinkai_devs_SDIT.git
cd Shinkai_devs_SDIT
git checkout -b feature/<your-name>      # or: git checkout feature/<your-name>
git pull origin main
2. Backend (FastAPI)
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --port 8000 --reload
Open http://localhost:8000/docs to try every endpoint, and http://localhost:8000/health to check it's up.
On first start it creates trafficsense.db and loads the demo data.
Use python -m pip and python -m uvicorn inside the venv. Otherwise Windows may pick up a global uvicorn.
requirements.txt pins numpy==2.4.6, because numpy 2.5 needs Python 3.12.
Live traffic: put your key in backend\.env as GOOGLE_MAPS_API_KEY (enable the Routes API on it). Without a key, the poller stays off and the seeded morning traffic is used. POST /commute/poll-now takes a snapshot immediately.
Run the tests with python -m pytest -q.
To share the backend with the team, run cloudflared tunnel --url http://localhost:8000 and put that URL in everyone's web\.env as VITE_API_BASE_URL.
3. Website
Open a second terminal:

cd web
npm install
copy .env.example .env
# edit web\.env: VITE_API_BASE_URL=http://localhost:8000 and your VITE_GOOGLE_MAPS_API_KEY
npm run dev
Open http://localhost:5173.
With VITE_API_BASE_URL set and the backend running, pages use live data (incidents, reports, company reports, referrals, road ownership). Without it, they keep the bundled demo data and say so.
Without a Maps key, the site shows the drawn SVG map. The key needs the Maps JavaScript API and Places API (New).
Other commands: npm run build (production build), npm run lint.
4. Flutter app (emulator)
Start an Android emulator from Android Studio (Device Manager).
Add your key to app\android\local.properties (this file is created by Flutter and is gitignored):
MAPS_API_KEY=your-key-here
Enable Maps SDK for Android on that key.
Run the app:
cd app
flutter pub get
flutter run
Pick the emulator if asked. For a quick check without Android, flutter run -d chrome shows the same app with an offline drawn map.
Environment variables
Real keys go only in .env / local.properties, which are gitignored. Never put a real key in .env.example, in code, or in a commit.

File	Variable	Example / placeholder	Purpose
backend/.env	DATABASE_URL	sqlite:///./trafficsense.db (PostGIS: postgresql+psycopg://trafficsense:password@localhost:5432/trafficsense)	Database
backend/.env	GOOGLE_MAPS_API_KEY	your-key-here	Google Routes API for traffic snapshots
backend/.env	CORS_ORIGINS	http://localhost:5173,http://127.0.0.1:5173	Allowed web origins
web/.env	VITE_API_BASE_URL	http://localhost:8000	Backend URL (local or tunnel)
web/.env	VITE_GOOGLE_MAPS_API_KEY	your-key-here	Maps JavaScript API + Places API (New)
web/.env	VITE_GOOGLE_MAP_ID	(empty; DEMO_MAP_ID works for testing)	Optional Google Map ID for map styling
app/android/local.properties	MAPS_API_KEY	your-key-here	Maps SDK for Android
For PostGIS, also run python -m pip install "psycopg[binary]==3.2.13".

API endpoints
Base URL: http://localhost:8000. JSON fields are camelCase. Interactive docs are at /docs.

Area	Method and path	What it does
Health	GET /health	Server check
Incidents	GET /incidents?active=true	Active incidents
GET /incidents/{id}	One incident
POST /incidents/report	User report (reason, lat, lng, optional place, speedKmh, hasPhoto, reporter). Merges or opens an incident and returns the verification steps reached.
POST /incidents/{id}/confirm?agency=	Authority confirms (level 6)
POST /incidents/{id}/clear	Close an incident
Certificate	GET /commute/certificates?day=YYYY-MM-DD	Road Delay Certificates for every employee
GET /commute/certificates/{employeeId}?day=	One employee's certificate, segment by segment
POST /commute/gate-punch	Record a gate punch (employeeId, optional at, gate)
POST /commute/poll-now	Take a Google Routes snapshot of every segment now
GET /commute/employees	Employees with honesty points, streak and badge tier
Gov	GET /company-reports?company=	Company reports
POST /company-reports	Company submits a report (flags possible duplicates)
PATCH /company-reports/{id}?status=	Set to New, Possible duplicate, Verified or Referred
POST /company-reports/{leadId}/merge	Merge duplicates into the lead report
GET /referrals / POST /referrals	List or create referrals (the agency comes from road ownership if not given)
POST /referrals/{id}/advance	Move to the next stage
GET /hotspots	Recurring hotspots
GET /segments	Road segments with free-flow times and owners
GET /road-ownership	Segment → agency, verified flag, open incidents
POST /road-ownership/confirm?segment=	Confirm a segment's owner
Weather	GET /weather	Mangaluru weather and 5-day rain risk (Open-Meteo proxy, cached 30 min)
Demo data
The backend seed (backend/app/seed.py) matches the website's web/src/data/mock.ts: real Mangaluru coordinates, NH-66 segments with their agencies, incidents, company reports, referrals and hotspots. It also includes a seeded morning of traffic for employees of Infinite Tech Pvt Ltd, so the certificate shows every outcome:

AS (Aahil Sheikh) and MK (Madiha K): late, fully excused by the road.
PS (Priya Shetty): partly excused (18 min unexcused, with an appeal to HR).
RD (Rohan D'Souza): late and not excused.
AR (Ananya Rao): no gate punch.
Prototype status
Website: all four versions are built and clickable. Commuter reporting, Company → Gov reports, and the Gov actions (verify, merge, refer, advance, confirm owner) call the backend when VITE_API_BASE_URL is set. Everything else uses demo data.
Backend: incidents, the Road Delay Certificate, the Gov portal, weather and the Google Routes poller all work, with pytest tests.
Flutter app: Commuter and Employee screens with Google Maps and live weather. It runs on demo data and doesn't call the backend yet.
Not built yet: real accounts and login, push notifications (FCM), gate-punch hardware integration, and PostGIS geometry (positions are lat/lng floats for now).
Team
Team Shinkai Devs:

Member	Owns
Mohammed Safaf (Faf)	TBD
Aahil	Government version (Authority Portal)
Gautam	Company version
Madiha	TBD
Git workflow
Work only on your own branch, feature/<your-name>. Never commit straight to main.
Before starting work, run git pull origin main on your branch.
Merge into main through a pull request on GitHub.
Keep each version in its own folder (web/src/versions/<version>) so members don't overwrite each other.
Keys stay in .env / local.properties. Before every commit, check with git status that no .env, local.properties, .venv, node_modules or *.db file is staged.
git checkout feature/<your-name>
git pull origin main
# ...make changes...
git add <files>
git commit -m "Short description of the change"
git push -u origin feature/<your-name>
# then open a pull request into main on GitHub