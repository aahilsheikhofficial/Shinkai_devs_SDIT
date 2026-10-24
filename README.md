# Shinkai_devs_SDIT

# TrafficSense

**Verify the road, not the employee.**

TrafficSense is a traffic-delay platform for Mangaluru and Udupi, built by team Shinkai Devs for Nexathon (Shree Devi). It tells commuters why a road is blocked, gives companies a fair answer to "why was this employee late?", and gives the traffic authority evidence about roads that keep failing.

## The idea: Road Delay Certificate

1. HR fixes each employee's commute route in advance, as a set of road segments.
2. Every 5 minutes, the server asks the **Google Routes API** how long each segment takes and stores a snapshot.
3. Arrival time comes from the **office gate punch**, not the phone.
4. The server replays the commute from the expected departure time. Excused minutes = the extra minutes the road added on that route at that time.
5. The verdict is one of **On time** (5 min grace), **Late · excused**, **Late · partly excused**, **Late · not excused**, or **No gate punch**. Anyone with unexcused minutes can appeal to HR.

**No employee GPS:** it protects privacy, can't be faked with GPS spoofing apps, and avoids collecting tracking data under India's DPDP Act.

**No AI/ML:** decisions about attendance must be explainable and auditable, and there is no real training data yet. Everything uses fixed rules, and rerouting uses Google's own alternative routes.

## Four versions

| Version | Where | Main features |
|---|---|---|
| **Commuter** | Web `/commuter` + app | Live traffic map, place search, route alerts with Avoid, nearby incidents, one-tap report, SOS, weather and rain warning |
| **Employee** | Web `/employee` + app | Today's commute and ETA, faster route tip, alerts, weekly commute chart, late arrival log with evidence, honesty badge |
| **Company** | Web `/company` | Overview stats, live employee map, auto attendance, fair lateness, honesty badges, weather risk on employees' routes, employee status board, weekly report (HR approves, then it's sent to Gov) |
| **Gov (Authority Portal)** | Web `/gov` | Company reports with duplicate merge, verify, hotspots with PDF evidence reports, road ownership (segment → agency), referral tracking (Referred → Resolved) |

Incident reports within 300 m with the same reason inside 2 hours merge into one incident. Verification levels: 1 report, 2 GPS, 3 multiple users, 4 slow speed, 5 photo, 6 authority confirmed.

## Tech stack

- **Web:** React 19, Vite, TypeScript, Tailwind v4, Recharts, Google Maps (`@vis.gl/react-google-maps`)
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite (PostGIS optional)
- **Mobile:** Flutter, `google_maps_flutter`
- **External data:** Google Routes API (traffic), Open-Meteo (weather, no key)

## Folder layout

```
web/       React website: src/pages, src/versions/{commuter,employee,company,gov}, src/components, src/data
backend/   FastAPI: app/main.py, models, seed, poller.py (Google Routes), routers/, tests/
app/       Flutter app (Commuter + Employee): lib/screens, lib/widgets, lib/data
```

## Run it (Windows)

**Backend**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --port 8000
```
API docs: http://localhost:8000/docs. It needs Python 3.11, because `numpy==2.4.6` is pinned.

**Website**
```powershell
cd web
npm install
copy .env.example .env      # set VITE_API_BASE_URL and VITE_GOOGLE_MAPS_API_KEY
npm run dev
```
Open http://localhost:5173. Without the backend or a Maps key, the site falls back to demo data and a drawn map.

**Flutter app**
Add `MAPS_API_KEY=your-key-here` to `app\android\local.properties`. Start an Android emulator, then:
```powershell
cd app
flutter pub get
flutter run
```

## Environment variables

Real keys go only in `.env` / `local.properties` (gitignored). Never commit them.

| File | Variables |
|---|---|
| `backend/.env` | `DATABASE_URL`, `GOOGLE_MAPS_API_KEY` (Routes API), `CORS_ORIGINS` |
| `web/.env` | `VITE_API_BASE_URL`, `VITE_GOOGLE_MAPS_API_KEY` (Maps JS + Places), `VITE_GOOGLE_MAP_ID` |
| `app/android/local.properties` | `MAPS_API_KEY` (Maps SDK for Android) |

## API endpoints

| Area | Endpoints |
|---|---|
| Incidents | `GET /incidents`, `GET /incidents/{id}`, `POST /incidents/report`, `POST /incidents/{id}/confirm`, `POST /incidents/{id}/clear` |
| Certificate | `GET /commute/certificates`, `GET /commute/certificates/{employeeId}`, `POST /commute/gate-punch`, `POST /commute/poll-now`, `GET /commute/employees` |
| Gov | `GET/POST /company-reports`, `PATCH /company-reports/{id}`, `POST /company-reports/{id}/merge`, `GET/POST /referrals`, `POST /referrals/{id}/advance`, `GET /hotspots`, `GET /segments`, `GET /road-ownership`, `POST /road-ownership/confirm` |
| Other | `GET /weather`, `GET /health` |

## Team

| Member | Owns |
|---|---|
| Mohammed Safaf (Faf) | Employee |
| Aahil | Gov version (Authority Portal) |
| Gautam | Company version |
| Madiha | Commuter |

## Git workflow

- Work on your own branch, `feature/<your-name>`. Never commit to `main`.
- Run `git pull origin main` before you start.
- Merge into `main` through a pull request.
- Check `git status` before every commit, so no `.env` or key file is staged.

