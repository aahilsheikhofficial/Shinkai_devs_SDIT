# TrafficSense backend

FastAPI + SQLAlchemy + a small scikit-learn ML part. Runs on SQLite with no setup, and on PostgreSQL + PostGIS on the host laptop by changing `DATABASE_URL`.

## Core idea: Road Delay Certificate ("verify the road, never the phone")

- The server polls Google Routes for every road segment every 5 minutes and stores the traffic (`segment_snapshots`).
- HR fixes each employee's commute route in advance (`assigned_routes`).
- Arrival time comes from the office gate punch (`gate_punches`), not from the phone.
- Excused minutes are the extra minutes the road added on that employee's own route, at the time they were driving it. Anything above that is not excused, and the employee can appeal to HR.
- The phone app only reports causes (accident, flood...). It never decides who is excused.

## Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (on Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          # Mac/Linux: cp .env.example .env
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs to try every endpoint. On first start it creates the database, loads the demo data (same as the website) and trains the ML models (a few seconds).

To share it with the team, run a tunnel: `cloudflared tunnel --url http://localhost:8000` and put that URL in `web/.env` as `VITE_API_BASE_URL`.

## Live traffic

Put the key in `backend/.env` as `GOOGLE_MAPS_API_KEY` (never in `.env.example`). The key needs **Routes API** enabled in Google Cloud. Without a key, the poller stays off and the seeded morning traffic is used.

## Endpoints

| Area | Endpoint |
|---|---|
| Incidents | `GET /incidents`, `GET /incidents/{id}`, `POST /incidents/report`, `POST /incidents/{id}/confirm?agency=`, `POST /incidents/{id}/clear` |
| Certificate | `GET /commute/certificates`, `GET /commute/certificates/{employeeId}`, `POST /commute/gate-punch`, `POST /commute/poll-now`, `GET /commute/employees` |
| Gov | `GET/POST /company-reports`, `PATCH /company-reports/{id}?status=`, `GET /referrals`, `POST /referrals/{id}/advance`, `GET /hotspots`, `GET /segments`, `GET /road-ownership` |
| ML | `POST /ml/cause`, `POST /ml/delay`, `GET /ml/metrics` |
| Weather | `GET /weather` (Open-Meteo, cached 30 min) |

JSON fields are camelCase to match `web/src/data/mock.ts`.

## Verification levels (user reports)

Reports within 300 m with the same reason in 2 hours merge into one incident. Levels: 1 user report, 2 GPS location, 3 multiple users (3+), 4 GPS speed confirms (under 15 km/h), 5 photo/video, 6 authority confirmed.

## ML

- **Cause guesser** (`RandomForestClassifier`): from hour, day, month, rain, speed vs normal speed, number of reports, duration, junction or highway, it ranks the likely causes with a confidence %.
- **Delay predictor** (`GradientBoostingRegressor`): expected delay in minutes.
- Both are trained on generated sample data (`app/ml/train.py`). Retrain with `python -m app.ml.train`. Replace with real reports once the app collects them.

## Layout

```
app/
  main.py        app, startup (create tables, seed, load ML, start poller)
  models.py      tables
  schemas.py     API shapes
  seed.py        demo data
  poller.py      Google Routes traffic snapshots every 5 min
  routers/       incidents, commute (certificate), gov, ml, weather
  ml/            train.py, predict.py
```
