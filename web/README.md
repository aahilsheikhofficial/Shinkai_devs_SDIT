# TrafficSense web

Clickable prototype of the TrafficSense website. All data is dummy data from `src/data/mock.ts`, and the map is a hand-drawn SVG of Mangaluru, so it runs with no API keys and no backend.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Demo flow

1. **Who are you?** Pick Commuter, Employee, Company or Government. The artwork changes as you hover or pick.
2. **Sign in.** Only that role's artwork is shown. Any details work in demo mode.
3. **Dashboard** for that role:
   - Commuter `/commuter`: live map, alerts with reason and confidence, avoid route, one-tap report, SOS.
   - Employee `/employee`: Extej-style light/dark. Commute, tracking privacy toggle, route alerts, weekly chart, late log.
   - Company `/company`: dark Vexora-style control room. Live employee map, proactive late alerts, monsoon risk, cause guesser, trust scores. Tabs: Overview, Employees, Incidents, Reports.
   - Government `/gov` (Authority Portal, Aahil's spec): dark control room. Company-submitted reports with duplicate merging, verified incident feed (levels 1 to 6), hotspots, evidence report generator, road ownership (segment to agency) and referral tracking (Referred, Acknowledged, Investigation, Resolved). Tabs: Overview, Company reports, Hotspots, Road ownership, Reports.

Every page has a light/dark toggle (top right). Clicking the logo goes back to the start.

## Where things live

```
src/
  pages/            Landing ("Who are you?") and Login
  versions/
    commuter/       Commuter view
    employee/       Employee dashboard
    company/        Company dashboard
    gov/            Government dashboard
  components/       TrafficMap (SVG), ControlShell (Company + Gov top bar), ui helpers, theme toggle
  data/             mock.ts (dummy data), domains.ts (roles + artwork)
  index.css         Colour tokens (orange accent, fixed traffic colours), button hover styles
public/artwork/     Role artworks (placeholders, swap the .webp files to update)
```

Each team member can own one folder under `src/versions/`.

## Stack

React + Vite + TypeScript, Tailwind CSS v4, Recharts, lucide-react icons, React Router. Later: Google Maps via `@vis.gl/react-google-maps` and the FastAPI backend. Keys go in `.env` (see `.env.example`), never in code.
