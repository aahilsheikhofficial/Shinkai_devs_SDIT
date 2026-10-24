"""Open-Meteo proxy (no key), cached 30 minutes, with a sample fallback when offline."""
import time

import httpx
from fastapi import APIRouter

router = APIRouter(tags=["weather"])
MANGALURU = (12.872, 74.862)
_cache: dict = {"at": 0.0, "data": None}
SAMPLE = {"live": False, "tempC": 27, "rainNowMm": 1.2, "label": "Light rain",
          "days": [{"date": "sample", "rainMm": r, "chance": c} for r, c in [(12, 40), (38, 70), (74, 90), (81, 95), (46, 60)]]}


def _risk(mm: float) -> str:
    return "High" if mm >= 50 else "Medium" if mm >= 20 else "Low"


@router.get("/weather")
def weather():
    if _cache["data"] and time.time() - _cache["at"] < 1800:
        return _cache["data"]
    try:
        r = httpx.get("https://api.open-meteo.com/v1/forecast", timeout=6, params={
            "latitude": MANGALURU[0], "longitude": MANGALURU[1], "timezone": "Asia/Kolkata", "forecast_days": 5,
            "current": "temperature_2m,precipitation,weather_code",
            "daily": "precipitation_sum,precipitation_probability_max",
        })
        r.raise_for_status()
        j = r.json()
        d = j["daily"]
        data = {"live": True, "tempC": j["current"]["temperature_2m"], "rainNowMm": j["current"]["precipitation"],
                "code": j["current"]["weather_code"],
                "days": [{"date": t, "rainMm": mm, "chance": p, "risk": _risk(mm or 0)}
                         for t, mm, p in zip(d["time"], d["precipitation_sum"], d["precipitation_probability_max"])]}
    except Exception:
        data = {**SAMPLE, "days": [{**x, "risk": _risk(x["rainMm"])} for x in SAMPLE["days"]]}
    _cache.update(at=time.time(), data=data)
    return data
