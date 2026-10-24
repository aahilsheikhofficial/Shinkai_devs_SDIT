"""Gov portal: company reports (with duplicate grouping), referrals, hotspots, road ownership."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models as m
from ..db import get_db
from ..schemas import CompanyReportIn, CompanyReportOut, HotspotOut, ReferralIn, ReferralOut, SegmentOut

router = APIRouter(tags=["gov"])
STAGES = ["Referred", "Acknowledged", "Investigation", "Resolved"]


@router.get("/company-reports", response_model=list[CompanyReportOut])
def company_reports(company: str | None = None, db: Session = Depends(get_db)):
    q = db.query(m.CompanyReport)
    if company:
        q = q.filter(m.CompanyReport.company == company)
    return q.order_by(m.CompanyReport.at.desc()).all()


@router.post("/company-reports", response_model=CompanyReportOut)
def submit_company_report(body: CompanyReportIn, db: Session = Depends(get_db)):
    """Company auto-complaint to Gov. Same place + reason within 2 hours is flagged as a possible duplicate."""
    now = datetime.now()
    first = (
        db.query(m.CompanyReport)
        .filter(m.CompanyReport.place == body.place, m.CompanyReport.reason == body.reason,
                m.CompanyReport.group_with.is_(None), m.CompanyReport.at >= now - timedelta(hours=2))
        .order_by(m.CompanyReport.at)
        .first()
    )
    last = db.query(m.CompanyReport).order_by(m.CompanyReport.id.desc()).first()
    next_id = f"CR-{int(last.id.split('-')[1]) + 1}" if last else "CR-9001"
    cr = m.CompanyReport(id=next_id, **body.model_dump(), at=now,
                         status="Possible duplicate" if first else "New", group_with=first.id if first else None)
    db.add(cr)
    db.commit()
    return cr


@router.patch("/company-reports/{report_id}", response_model=CompanyReportOut)
def set_status(report_id: str, status: str, db: Session = Depends(get_db)):
    if status not in ("New", "Possible duplicate", "Verified", "Referred"):
        raise HTTPException(400, "Unknown status")
    cr = db.get(m.CompanyReport, report_id)
    if not cr:
        raise HTTPException(404, "Report not found")
    cr.status = status
    db.commit()
    return cr


@router.post("/company-reports/{lead_id}/merge", response_model=CompanyReportOut)
def merge(lead_id: str, db: Session = Depends(get_db)):
    """Merge every 'Possible duplicate' grouped under lead_id into it: employees add up, evidence is combined."""
    lead = db.get(m.CompanyReport, lead_id)
    if not lead:
        raise HTTPException(404, "Report not found")
    dupes = db.query(m.CompanyReport).filter(m.CompanyReport.group_with == lead_id).all()
    evidence = list(lead.evidence)
    for d in dupes:
        lead.employees += d.employees
        evidence += [e for e in d.evidence if e not in evidence]
        db.delete(d)
    lead.evidence = evidence
    lead.status = "Verified"
    db.commit()
    return lead


@router.get("/referrals", response_model=list[ReferralOut])
def referrals(db: Session = Depends(get_db)):
    return db.query(m.Referral).order_by(m.Referral.sent.desc()).all()


@router.post("/referrals", response_model=ReferralOut)
def new_referral(body: ReferralIn, db: Session = Depends(get_db)):
    """Refer a problem to the agency that owns the road. Agency comes from road ownership when not given."""
    agency = body.agency
    if not agency:
        seg = db.query(m.Segment).filter(m.Segment.name == body.segment).first()
        agency = seg.agency if seg else None
    if not agency:
        raise HTTPException(400, "Unknown road owner. Confirm the road owner first or pass agency.")
    last = db.query(m.Referral).order_by(m.Referral.id.desc()).first()
    ref = m.Referral(id=f"REF-{int(last.id.split('-')[1]) + 1}" if last else "REF-101", issue=body.issue,
                     segment=body.segment, agency=agency, stage=0, sent=datetime.now(), reports=body.reports)
    db.add(ref)
    db.commit()
    return ref


@router.post("/referrals/{referral_id}/advance", response_model=ReferralOut)
def advance(referral_id: str, db: Session = Depends(get_db)):
    ref = db.get(m.Referral, referral_id)
    if not ref:
        raise HTTPException(404, "Referral not found")
    ref.stage = min(ref.stage + 1, len(STAGES) - 1)
    db.commit()
    return ref


@router.get("/hotspots", response_model=list[HotspotOut])
def hotspots(db: Session = Depends(get_db)):
    return db.query(m.Hotspot).order_by(m.Hotspot.hours_lost.desc()).all()


@router.get("/segments", response_model=list[SegmentOut])
def segments(db: Session = Depends(get_db)):
    return db.query(m.Segment).all()


@router.post("/road-ownership/confirm")
def confirm_owner(segment: str, db: Session = Depends(get_db)):
    seg = db.query(m.Segment).filter(m.Segment.name == segment).first()
    if not seg:
        raise HTTPException(404, "Segment not found")
    seg.agency_verified = True
    db.commit()
    return {"segment": seg.name, "agency": seg.agency, "verified": True}


@router.get("/road-ownership")
def road_ownership(db: Session = Depends(get_db)):
    out = []
    for s in db.query(m.Segment).all():
        open_count = db.query(m.Incident).filter(m.Incident.segment_id == s.id, m.Incident.active).count()
        out.append({"segment": s.name, "type": s.road_type, "agency": s.agency,
                    "verified": s.agency_verified, "open": open_count})
    return out
