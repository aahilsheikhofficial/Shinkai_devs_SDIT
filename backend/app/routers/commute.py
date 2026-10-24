"""Road delay certificate: excuse lateness only by the delay the server saw on the employee's own route.

Draft of the "verify the road, never the phone" idea, still waiting for the team's go-ahead.
- HR fixes each employee's route in advance (AssignedRoute).
- The server keeps traffic snapshots per road segment (SegmentSnapshot).
- Arrival comes from the office gate (GatePunch), not from the phone.
- Excused minutes = extra minutes the road itself added on that route, at the time they were driving it.
"""
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models as m
from ..db import get_db
from ..schemas import PunchIn

router = APIRouter(prefix="/commute", tags=["commute"])
DEPARTURE_BUFFER_MIN = 10  # expected to leave this long before the no-traffic arrival time
GRACE_MIN = 5


def _snapshot_at(db: Session, segment_id: str, t: datetime) -> m.SegmentSnapshot | None:
    """Snapshot closest to t, within 10 minutes. None means the server has no record, so no delay is certified."""
    near = (db.query(m.SegmentSnapshot)
            .filter(m.SegmentSnapshot.segment_id == segment_id,
                    m.SegmentSnapshot.at >= t - timedelta(minutes=10), m.SegmentSnapshot.at <= t + timedelta(minutes=10))
            .all())
    return min(near, key=lambda s: abs((s.at - t).total_seconds()), default=None)


def certificate(db: Session, emp: m.Employee, day: date) -> dict:
    route = (db.query(m.AssignedRoute).filter(m.AssignedRoute.employee_id == emp.id)
             .order_by(m.AssignedRoute.valid_from.desc()).first())
    if not route:
        raise HTTPException(404, "No HR-approved route for this employee")
    segs = [db.get(m.Segment, sid) for sid in route.segment_ids]
    h, mi = map(int, emp.shift_start.split(":"))
    shift = datetime.combine(day, datetime.min.time()).replace(hour=h, minute=mi)
    free_total = sum(s.free_flow_min for s in segs)
    depart = shift - timedelta(minutes=free_total + DEPARTURE_BUFFER_MIN)

    # Drive the route forward from the expected departure, using what the road looked like at each moment
    t, legs, excused = depart, [], 0.0
    for s in segs:
        snap = _snapshot_at(db, s.id, t)
        travel = snap.travel_min if snap else s.free_flow_min
        extra = max(0.0, travel - s.free_flow_min)
        legs.append({"segment": s.name, "enteredAt": t.strftime("%H:%M"), "normalMin": s.free_flow_min,
                     "actualMin": round(travel, 1), "extraMin": round(extra, 1),
                     "speedKmh": snap.speed_kmh if snap else None, "source": snap.source if snap else "none"})
        excused += extra
        t += timedelta(minutes=travel)

    punch = (db.query(m.GatePunch).filter(m.GatePunch.employee_id == emp.id,
                                          m.GatePunch.at >= datetime.combine(day, datetime.min.time()),
                                          m.GatePunch.at < datetime.combine(day + timedelta(days=1), datetime.min.time()))
             .order_by(m.GatePunch.at).first())
    excused = round(excused)
    if not punch:
        return {"employeeId": emp.id, "name": emp.name, "date": day.isoformat(), "status": "No gate punch",
                "certifiedDelayMin": excused, "legs": legs}

    late = max(0, round((punch.at - shift).total_seconds() / 60))
    unexcused = max(0, late - excused - GRACE_MIN) if late > GRACE_MIN else 0
    if late <= GRACE_MIN:
        status = "On time"
    elif unexcused == 0:
        status = "Late · excused"
    elif excused > 0:
        status = "Late · partly excused"
    else:
        status = "Late · not excused"
    return {
        "employeeId": emp.id, "name": emp.name, "date": day.isoformat(), "shiftStart": emp.shift_start,
        "gatePunch": punch.at.strftime("%H:%M"), "gate": punch.gate, "lateMin": late,
        "certifiedDelayMin": excused, "excusedMin": min(late, excused + GRACE_MIN) if late > GRACE_MIN else late,
        "unexcusedMin": unexcused, "status": status, "legs": legs,
        "appeal": "Disagree? Raise a manual appeal with HR." if unexcused else None,
    }


@router.get("/certificates")
def all_certificates(day: date | None = None, db: Session = Depends(get_db)):
    day = day or date.today()
    return [certificate(db, e, day) for e in db.query(m.Employee).all()]


@router.get("/certificates/{employee_id}")
def one_certificate(employee_id: str, day: date | None = None, db: Session = Depends(get_db)):
    emp = db.get(m.Employee, employee_id)
    if not emp:
        raise HTTPException(404, "Employee not found")
    return certificate(db, emp, day or date.today())


@router.post("/gate-punch")
def gate_punch(body: PunchIn, db: Session = Depends(get_db)):
    """Called by the office gate hardware (or the demo button)."""
    if not db.get(m.Employee, body.employee_id):
        raise HTTPException(404, "Employee not found")
    p = m.GatePunch(employee_id=body.employee_id, at=body.at or datetime.now(), gate=body.gate)
    db.add(p)
    db.commit()
    return {"ok": True, "at": p.at}


@router.get("/employees")
def employees(db: Session = Depends(get_db)):
    return [{"id": e.id, "name": e.name, "company": e.company, "points": e.points, "streak": e.streak,
             "tier": "Gold" if e.points >= 800 else "Silver" if e.points >= 500 else "Bronze" if e.points >= 300 else "None"}
            for e in db.query(m.Employee).order_by(m.Employee.points.desc()).all()]
