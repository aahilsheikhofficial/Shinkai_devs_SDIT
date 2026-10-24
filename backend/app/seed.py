"""Demo data, the same as the website's data/mock.ts. Runs on startup when the DB is empty."""
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from . import models as m


def _today(hhmm: str) -> datetime:
    h, mi = map(int, hhmm.split(":"))
    return datetime.now().replace(hour=h, minute=mi, second=0, microsecond=0)


def _day(d: int, month: int = 10) -> datetime:
    return datetime.now().replace(month=month, day=d, hour=10, minute=0, second=0, microsecond=0)


SEGMENTS = [
    # id, name, type, agency, verified, start, end, free-flow minutes
    ("ullal-thokkotu", "Ullal Road", "City road", "Mangaluru City Corporation", True, (12.8075, 74.8495), (12.8185, 74.8590), 4),
    ("nh66-thokkotu-pumpwell", "NH-66 Thokkotu–Pumpwell", "National Highway", "NHAI", True, (12.8185, 74.8590), (12.8695, 74.8555), 9),
    ("nh66-pumpwell-nanthoor", "NH-66 Pumpwell–Nanthoor", "National Highway", "NHAI", True, (12.8695, 74.8555), (12.8876, 74.8607), 5),
    ("nh66-nanthoor-kulur", "NH-66 Nanthoor–Kulur", "National Highway", "NHAI", True, (12.8876, 74.8607), (12.9246, 74.8297), 8),
    ("nh66-kulur-surathkal", "NH-66 Kulur–Surathkal", "National Highway", "NHAI", True, (12.9246, 74.8297), (12.9850, 74.8020), 12),
    ("nh73-pumpwell-padil", "NH-73 Pumpwell–Padil", "National Highway", "NHAI", True, (12.8695, 74.8555), (12.8736, 74.8850), 6),
    ("nh73-padil-techpark", "NH-73 Padil–TechPark", "National Highway", "NHAI", True, (12.8736, 74.8850), (12.8790, 74.8960), 3),
    ("hampankatta-kankanady", "Hampankatta–Kankanady", "City road", "Mangaluru City Corporation", True, (12.8700, 74.8430), (12.8800, 74.8590), 7),
    ("kulur-bridge", "Kulur bridge approach", "State road", "PWD Karnataka", False, (12.9200, 74.8300), (12.9246, 74.8297), 2),
]

# Today's traffic on each segment (travel minutes), from 07:30 to 10:00 every 5 minutes
JAMS = {"nh66-thokkotu-pumpwell": 18, "nh73-pumpwell-padil": 30, "ullal-thokkotu": 8, "nh66-pumpwell-nanthoor": 6, "nh66-nanthoor-kulur": 4}

INCIDENTS = [
    ("INC-2041", "Accident", "Pumpwell flyover", 12.8695, 74.8555, "severe", 32, 92, 5, 14, "08:12", "Traffic Police", "nh73-pumpwell-padil", True, 4),
    ("INC-2042", "Road repair", "Thokkotu junction", 12.8185, 74.8590, "heavy", 18, 84, 4, 7, "07:40", "NHAI", "nh66-thokkotu-pumpwell", False, 9),
    ("INC-2043", "Flood", "Ullal Road", 12.8075, 74.8495, "closed", 45, 96, 6, 22, "06:55", "MCC", "ullal-thokkotu", True, 0),
    ("INC-2044", "Signal failure", "Nanthoor circle", 12.8876, 74.8607, "heavy", 11, 71, 3, 5, "08:31", "MESCOM", "nh66-pumpwell-nanthoor", False, None),
    ("INC-2045", "Breakdown", "Kulur bridge", 12.9246, 74.8297, "moderate", 6, 58, 2, 2, "08:44", None, "kulur-bridge", False, None),
]

EMPLOYEES = [
    # id, name, home, points, streak, route, gate punch
    ("AS", "Aahil Sheikh", (12.8075, 74.8495), 640, 12, ["ullal-thokkotu", "nh66-thokkotu-pumpwell", "nh73-pumpwell-padil", "nh73-padil-techpark"], "09:47"),
    ("MK", "Madiha K", (12.8185, 74.8590), 810, 28, ["nh66-thokkotu-pumpwell", "nh73-pumpwell-padil", "nh73-padil-techpark"], "09:33"),
    ("GR", "Gautam R", (12.9850, 74.8020), 530, 9, ["nh66-kulur-surathkal", "nh66-nanthoor-kulur", "nh66-pumpwell-nanthoor", "nh73-pumpwell-padil", "nh73-padil-techpark"], "09:05"),
    ("MS", "Mohammed Safaf", (12.8700, 74.8430), 920, 41, ["hampankatta-kankanady", "nh73-pumpwell-padil", "nh73-padil-techpark"], "08:52"),
    ("PS", "Priya Shetty", (12.8800, 74.8590), 180, 0, ["nh66-pumpwell-nanthoor", "nh73-pumpwell-padil", "nh73-padil-techpark"], "09:58"),
    ("RD", "Rohan D’Souza", (12.8736, 74.8850), 310, 3, ["nh73-padil-techpark"], "09:11"),
    ("AR", "Ananya Rao", (12.9300, 74.8300), 0, 0, ["kulur-bridge", "nh66-nanthoor-kulur", "nh66-pumpwell-nanthoor", "nh73-pumpwell-padil", "nh73-padil-techpark"], None),
]

COMPANY_REPORTS = [
    ("CR-9031", "Infinite Tech Pvt Ltd", "Thokkotu junction", "Road repair", 6, 24, ["GPS", "Photo"], "New", None, "09:02"),
    ("CR-9030", "Coastal Logistics", "Thokkotu junction", "Road repair", 3, 21, ["GPS"], "Possible duplicate", "CR-9031", "08:58"),
    ("CR-9029", "Karavali Hospital", "Thokkotu junction", "Road repair", 4, 19, ["GPS", "Video"], "Possible duplicate", "CR-9031", "08:51"),
    ("CR-9028", "Infinite Tech Pvt Ltd", "Pumpwell flyover", "Accident", 3, 32, ["GPS", "Photo", "Maps speed"], "Verified", None, "08:40"),
    ("CR-9027", "Mangala Textiles", "Ullal Road", "Flood", 9, 45, ["GPS", "Photo"], "Referred", None, "07:15"),
    ("CR-9026", "SDIT College", "Nanthoor circle", "Signal failure", 12, 11, ["GPS"], "New", None, "08:35"),
]

REFERRALS = [
    ("REF-118", "Recurring congestion, Thokkotu junction", "NH-66 Pumpwell–Thokkotu", "NHAI", 2, 21, 26),
    ("REF-117", "Accident-prone U-turn, Pumpwell", "NH-66 Nanthoor–Pumpwell", "NHAI", 1, 18, 19),
    ("REF-116", "Waterlogging on Ullal Road", "Ullal Road", "Mangaluru City Corporation", 3, 12, 22),
    ("REF-115", "Signal outage, Nanthoor circle", "Nanthoor circle signal", "Traffic Police (signals)", 0, 23, 5),
]

HOTSPOTS = [
    ("Pumpwell junction", 12.8695, 74.8555, 18, "Accident", 1240, "Signal re-timing study + grade-separated U-turn"),
    ("Thokkotu junction", 12.8185, 74.8590, 15, "Road repair", 860, "Fast-track NHAI service-road completion"),
    ("Nanthoor circle", 12.8876, 74.8607, 12, "Signal failure", 540, "Replace controller, add battery backup"),
    ("Ullal Road dip", 12.8075, 74.8495, 9, "Flood", 610, "Drainage audit before next monsoon"),
]


def seed(db: Session) -> None:
    if db.query(m.Segment).first():
        return
    for sid, name, rtype, agency, ver, (slat, slng), (elat, elng), free in SEGMENTS:
        db.add(m.Segment(id=sid, name=name, road_type=rtype, agency=agency, agency_verified=ver,
                         start_lat=slat, start_lng=slng, end_lat=elat, end_lng=elng, free_flow_min=free))
    db.flush()

    start = _today("07:30")
    for sid, *_rest in SEGMENTS:
        free = next(s[7] for s in SEGMENTS if s[0] == sid)
        jam = JAMS.get(sid, 0)
        for i in range(31):  # 07:30 .. 10:00
            t = start + timedelta(minutes=5 * i)
            # jam builds up from 08:00, peaks around 08:45, eases by 10:00
            shape = max(0.0, 1 - abs((t - _today("08:45")).total_seconds()) / 3600)
            travel = free + jam * shape
            km = free * 40 / 60
            db.add(m.SegmentSnapshot(segment_id=sid, at=t, travel_min=round(travel, 1),
                                     speed_kmh=round(km / travel * 60, 1), source="seed"))

    for (iid, reason, place, lat, lng, level, delay, conf, ver, reps, since, agency, seg, photo, speed) in INCIDENTS:
        db.add(m.Incident(id=iid, reason=reason, place=place, lat=lat, lng=lng, level=level, delay_min=delay,
                          confidence=conf, verification=ver, reports=reps, since=_today(since), agency=agency,
                          segment_id=seg, has_photo=photo, min_speed_kmh=speed, authority_confirmed=ver == 6))

    for eid, name, (hlat, hlng), pts, streak, route, punch in EMPLOYEES:
        db.add(m.Employee(id=eid, name=name, company="Infinite Tech Pvt Ltd", home_lat=hlat, home_lng=hlng,
                          points=pts, streak=streak))
        db.add(m.AssignedRoute(employee_id=eid, segment_ids=route, valid_from=_day(1)))
        if punch:
            db.add(m.GatePunch(employee_id=eid, at=_today(punch)))

    for cid, comp, place, reason, emps, delay, ev, status, grp, at in COMPANY_REPORTS:
        db.add(m.CompanyReport(id=cid, company=comp, place=place, reason=reason, employees=emps, delay_min=delay,
                               evidence=ev, status=status, group_with=grp, at=_today(at)))
    for rid, issue, seg, agency, stage, day, reps in REFERRALS:
        db.add(m.Referral(id=rid, issue=issue, segment=seg, agency=agency, stage=stage, sent=_day(day), reports=reps))
    for place, lat, lng, days, cause, hrs, sugg in HOTSPOTS:
        db.add(m.Hotspot(place=place, lat=lat, lng=lng, days=days, main_cause=cause, hours_lost=hrs, suggestion=sugg))
    db.commit()
