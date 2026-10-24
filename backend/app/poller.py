"""Every 5 minutes, ask Google Routes how long each road segment takes right now and store it.

This is the server's own record of the road, so lateness never depends on the employee's phone.
Google cannot tell us past traffic later, so we must keep these snapshots as they happen.
Without GOOGLE_MAPS_API_KEY in .env the poller stays off and the seeded snapshots are used.
"""
import asyncio
import logging
import math
from datetime import datetime

import httpx

from . import models as m
from .config import settings
from .db import SessionLocal

log = logging.getLogger("poller")
ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
INTERVAL_S = 300


def _seconds(v: str | None) -> float | None:
    return float(v.rstrip("s")) if v else None


async def poll_segment(client: httpx.AsyncClient, seg: m.Segment) -> m.SegmentSnapshot | None:
    body = {
        "origin": {"location": {"latLng": {"latitude": seg.start_lat, "longitude": seg.start_lng}}},
        "destination": {"location": {"latLng": {"latitude": seg.end_lat, "longitude": seg.end_lng}}},
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
    }
    headers = {"X-Goog-Api-Key": settings.google_maps_api_key,
               "X-Goog-FieldMask": "routes.duration,routes.staticDuration,routes.distanceMeters"}
    r = await client.post(ROUTES_URL, json=body, headers=headers)
    r.raise_for_status()
    route = (r.json().get("routes") or [None])[0]
    if not route:
        return None
    travel_min = _seconds(route["duration"]) / 60
    km = route.get("distanceMeters", 0) / 1000
    return m.SegmentSnapshot(segment_id=seg.id, at=datetime.now(), travel_min=round(travel_min, 1),
                             speed_kmh=round(km / max(travel_min, 0.1) * 60, 1), source="google")


async def poll_once() -> int:
    """Poll every segment once. Returns how many snapshots were saved."""
    if not settings.google_maps_api_key or settings.google_maps_api_key.startswith("your-"):
        return 0
    with SessionLocal() as db:
        segs = db.query(m.Segment).all()
        async with httpx.AsyncClient(timeout=10) as client:
            results = await asyncio.gather(*(poll_segment(client, s) for s in segs), return_exceptions=True)
        saved = 0
        for seg, res in zip(segs, results):
            if isinstance(res, Exception):
                log.warning("Routes API failed for %s: %s", seg.id, res)
            elif res is not None and not math.isnan(res.travel_min):
                db.add(res)
                saved += 1
        db.commit()
        return saved


async def run_forever() -> None:
    while True:
        try:
            n = await poll_once()
            if n:
                log.info("Saved %d traffic snapshots", n)
        except Exception as e:  # keep polling even if one round fails
            log.warning("Poll round failed: %s", e)
        await asyncio.sleep(INTERVAL_S)
