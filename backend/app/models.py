"""Database tables.

Positions are plain lat/lng floats so the same code runs on SQLite and Postgres.
On the PostGIS laptop we can add geometry columns later without changing the API.
"""
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

LEVELS = ["free", "moderate", "heavy", "severe", "closed"]
REASONS = [
    "Accident", "Road repair", "Festival", "VIP movement", "Heavy rain",
    "Flood", "Signal failure", "Breakdown", "Closure", "Strike",
]
VERIFICATION_STEPS = [
    "User report", "GPS location", "Multiple users",
    "GPS speed confirms", "Photo / video", "Authority confirmed",
]


class Segment(Base):
    """A stretch of road with a responsible agency (road ownership)."""
    __tablename__ = "segments"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str]
    road_type: Mapped[str]
    agency: Mapped[str]
    agency_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    start_lat: Mapped[float]
    start_lng: Mapped[float]
    end_lat: Mapped[float]
    end_lng: Mapped[float]
    free_flow_min: Mapped[float]  # normal travel time with no traffic


class SegmentSnapshot(Base):
    """Traffic on a segment as polled by the server (every 5 min in the full version)."""
    __tablename__ = "segment_snapshots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    segment_id: Mapped[str] = mapped_column(ForeignKey("segments.id"), index=True)
    at: Mapped[datetime] = mapped_column(DateTime, index=True)
    travel_min: Mapped[float]
    speed_kmh: Mapped[float]
    source: Mapped[str] = mapped_column(String, default="google")  # google, tomtom, seed
    segment: Mapped[Segment] = relationship()

    @property
    def delay_min(self) -> float:
        return max(0.0, self.travel_min - self.segment.free_flow_min)


class Incident(Base):
    __tablename__ = "incidents"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    reason: Mapped[str]
    place: Mapped[str]
    lat: Mapped[float]
    lng: Mapped[float]
    level: Mapped[str]
    delay_min: Mapped[int]
    confidence: Mapped[int]
    verification: Mapped[int] = mapped_column(Integer, default=1)
    reports: Mapped[int] = mapped_column(Integer, default=1)
    since: Mapped[datetime] = mapped_column(DateTime)
    agency: Mapped[str | None] = mapped_column(String, nullable=True)
    segment_id: Mapped[str | None] = mapped_column(ForeignKey("segments.id"), nullable=True)
    has_photo: Mapped[bool] = mapped_column(Boolean, default=False)
    min_speed_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)
    authority_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Report(Base):
    """One person's report. Reports near each other with the same reason merge into one incident."""
    __tablename__ = "reports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    incident_id: Mapped[str] = mapped_column(ForeignKey("incidents.id"), index=True)
    reporter: Mapped[str]
    reason: Mapped[str]
    lat: Mapped[float]
    lng: Mapped[float]
    speed_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)
    has_photo: Mapped[bool] = mapped_column(Boolean, default=False)
    at: Mapped[datetime] = mapped_column(DateTime)


class Employee(Base):
    __tablename__ = "employees"
    id: Mapped[str] = mapped_column(String, primary_key=True)  # initials for the demo
    name: Mapped[str]
    company: Mapped[str]
    home_lat: Mapped[float]
    home_lng: Mapped[float]
    shift_start: Mapped[str] = mapped_column(String, default="09:00")
    points: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)


class AssignedRoute(Base):
    """Commute route fixed by HR in advance: an ordered list of segment ids."""
    __tablename__ = "assigned_routes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), index=True)
    segment_ids: Mapped[list] = mapped_column(JSON)
    approved_by: Mapped[str] = mapped_column(String, default="HR")
    valid_from: Mapped[datetime] = mapped_column(DateTime)


class GatePunch(Base):
    """Arrival time from office gate hardware (not from the phone)."""
    __tablename__ = "gate_punches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), index=True)
    at: Mapped[datetime] = mapped_column(DateTime, index=True)
    gate: Mapped[str] = mapped_column(String, default="Main gate")


class CompanyReport(Base):
    __tablename__ = "company_reports"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    company: Mapped[str]
    place: Mapped[str]
    reason: Mapped[str]
    employees: Mapped[int]
    delay_min: Mapped[int]
    evidence: Mapped[list] = mapped_column(JSON)
    status: Mapped[str]  # New, Possible duplicate, Verified, Referred
    group_with: Mapped[str | None] = mapped_column(String, nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime)


class Referral(Base):
    __tablename__ = "referrals"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    issue: Mapped[str]
    segment: Mapped[str]
    agency: Mapped[str]
    stage: Mapped[int]  # 0 Referred, 1 Acknowledged, 2 Investigation, 3 Resolved
    sent: Mapped[datetime] = mapped_column(DateTime)
    reports: Mapped[int]


class Hotspot(Base):
    __tablename__ = "hotspots"
    place: Mapped[str] = mapped_column(String, primary_key=True)
    lat: Mapped[float]
    lng: Mapped[float]
    days: Mapped[int]
    main_cause: Mapped[str]
    hours_lost: Mapped[int]
    suggestion: Mapped[str]
