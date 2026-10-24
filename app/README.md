# TrafficSense mobile app (Flutter)

Phone app for the two on-the-road roles: **Commuter** and **Employee**. Company and Government use the website (`../web`). Dummy data for the demo; the FastAPI backend replaces it later.

## Screens

- **Who are you?** Pick Commuter or Employee; the artwork swaps.
- **Sign in** with that role's artwork (demo: any details work).
- **Commuter:** full-screen live map, place search, alert with reason + confidence, *Avoid* reroute, nearby incidents sheet, one-tap **Report**, **SOS**, live weather + rain warning.
- **Employee:** today's commute (ETA, cause, faster route), rain warning, live route map, privacy-first tracking toggle, weekly commute chart, alerts, late-arrival log with honesty badge.
- Light/dark toggle everywhere, orange accent, fixed traffic colours (same as the website).

## Run it

1. Install Flutter + Android Studio and run `flutter doctor` (see the team doc for the list).
2. Google Maps key: open `android/local.properties` (created by Flutter, gitignored) and add a line:
   ```
   MAPS_API_KEY=your-key-here
   ```
   Enable **Maps SDK for Android** on that key in Google Cloud. Never put the key anywhere else.
3. From this folder:
   ```
   flutter pub get
   flutter run
   ```
   With a phone plugged in (USB debugging on) it installs there; otherwise pick the emulator.

Quick check without Android: `flutter run -d chrome` shows the same app with an offline drawn map.

## Code

```
lib/
  main.dart             app + light/dark
  theme.dart            colours, buttons (orange highlight on press/hover)
  data/mock.dart        dummy incidents, route, late log (real Mangaluru coordinates)
  data/weather.dart     Open-Meteo live weather, cached 30 min, sample fallback
  widgets/traffic_map.dart   Google map (Android) / offline map (web)
  widgets/common.dart   weather chip, rain warning, incident card, report sheet
  screens/              role picker, login, commuter, employee
```
