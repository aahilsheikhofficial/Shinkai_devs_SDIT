"""Incidents and user reports, with the 6 verification levels."""
import math
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models as m
from ..db import get_db
from ..ml.predict import predict_delay
from ..schemas import IncidentOut, ReportIn, ReportResult

router = APIRouter(prefix="/incidents", tags=["incidents"])

MERGE_RADIUS_M = 300
MERGE_WINDOW = timedelta(hours=2)
SLOW_KMH = 15  # phone speed below this counts as "GPS speed confirms"


def distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def verification_level(inc: m.Incident) -> int:
    """Highest level reached: 1 report, 2 GPS, 3 multiple users, 4 slow speed, 5 photo, 6 authority."""
    if inc.authority_confirmed:
        return 6
    if inc.has_photo:
        return 5
    if inc.min_speed_kmh is not None and inc.min_speed_kmh < SLOW_KMH and inc.reports >= 3:
        return 4
    if inc.reports >= 3:
        return 3
    return 2  # every app report carries GPS


def confidence(inc: m.Incident) -> int:
    return min(99, 30 + inc.verification * 10 + min(inc.reports, 10) * 2)


@router.get("", response_model=list[IncidentOut])
def list_incidents(active: bool = True, db: Session = Depends(get_db)):
    return db.query(m.Incident).filter(m.Incident.active == active).order_by(m.Incident.since.desc()).all()


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.get(m.Incident, incident_id)
    if not inc:
        raise HTTPException(404, "Incident not found")
    return inc


@router.post("/report", response_model=ReportResult)
def report(body: ReportIn, db: Session = Depends(get_db)):
    """A user reports a jam. Merges into a nearby incident with the same reason, or opens a new one."""
    now = datetime.now()
    nearby = [
        i for i in db.query(m.Incident).filter(m.Incident.active, m.Incident.reason == body.reason).all()
        if distance_m(i.lat, i.lng, body.lat, body.lng) <= MERGE_RADIUS_M and now - i.since <= MERGE_WINDOW
    ]
    merged = bool(nearby)
    if merged:
        inc = nearby[0]
        inc.reports += 1
    else:
        count = db.query(m.Incident).count()
        inc = m.Incident(
            id=f"INC-{2041 + count}", reason=body.reason, place=body.place or "Reported location",
            lat=body.lat, lng=body.lng, level="moderate", delay_min=0, confidence=0, reports=1, since=now,
        )
        db.add(inc)
    if body.has_photo:
        inc.has_photo = True
    if body.speed_kmh is not None:
        inc.min_speed_kmh = min(body.speed_kmh, inc.min_speed_kmh or body.speed_kmh)

    inc.verification = verification_level(inc)
    inc.confidence = confidence(inc)
    speed = inc.min_speed_kmh if inc.min_speed_kmh is not None else 20
    inc.delay_min = round(predict_delay(inc.reason, now.hour, 0, inc.reports, True, speed, 40))
    inc.level = "severe" if inc.delay_min >= 25 else "heavy" if inc.delay_min >= 10 else "moderate"

    db.add(m.Report(incident_id=inc.id, reporter=body.reporter, reason=body.reason, lat=body.lat, lng=body.lng,
                    speed_kmh=body.speed_kmh, has_photo=body.has_photo, at=now))
    db.commit()
    db.refresh(inc)
    return ReportResult(incident=IncidentOut.model_validate(inc), merged=merged,
                        verification_steps=m.VERIFICATION_STEPS[: inc.verification])


@router.post("/{incident_id}/confirm", response_model=IncidentOut)
def authority_confirm(incident_id: str, agency: str, db: Session = Depends(get_db)):
    """Gov or police confirms an incident: level 6."""
    inc = db.get(m.Incident, incident_id)
    if not inc:
        raise HTTPException(404, "Incident not found")
    inc.authority_confirmed, inc.agency = True, agency
    inc.verification = 6
    inc.confidence = confidence(inc)
    db.commit()
    return inc


@router.post("/{incident_id}/clear", response_model=IncidentOut)
def clear(incident_id: str, db: Session = Depends(get_db)):
    inc = db.get(m.Incident, incident_id)
    if not inc:
        raise HTTPException(404, "Incident not found")
    inc.active = False
    db.commit()
    return inc
