"""API shapes. Fields go out in camelCase so they match the website's data/mock.ts."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)


class In(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class IncidentOut(Out):
    id: str
    reason: str
    place: str
    lat: float
    lng: float
    level: str
    delay_min: int
    confidence: int
    verification: int
    reports: int
    since: datetime
    agency: str | None
    segment_id: str | None


class ReportIn(In):
    reporter: str = "anonymous"
    reason: str
    place: str | None = None
    lat: float
    lng: float
    speed_kmh: float | None = Field(None, description="Phone GPS speed when reporting")
    has_photo: bool = False


class ReportResult(Out):
    incident: IncidentOut
    merged: bool
    verification_steps: list[str]


class SegmentOut(Out):
    id: str
    name: str
    road_type: str
    agency: str
    agency_verified: bool
    free_flow_min: float


class CompanyReportOut(Out):
    id: str
    company: str
    place: str
    reason: str
    employees: int
    delay_min: int
    evidence: list[str]
    status: str
    group_with: str | None
    at: datetime


class CompanyReportIn(In):
    company: str
    place: str
    reason: str
    employees: int
    delay_min: int
    evidence: list[str] = []


class ReferralOut(Out):
    id: str
    issue: str
    segment: str
    agency: str
    stage: int
    sent: datetime
    reports: int


class ReferralIn(In):
    issue: str
    segment: str
    agency: str | None = None
    reports: int = 0


class HotspotOut(Out):
    place: str
    lat: float
    lng: float
    days: int
    main_cause: str
    hours_lost: int
    suggestion: str


class CauseIn(In):
    hour: int = Field(ge=0, le=23)
    weekday: int = Field(0, ge=0, le=6)
    month: int = Field(10, ge=1, le=12)
    rain_mm: float = 0
    speed_kmh: float
    normal_speed_kmh: float = 40
    reports: int = 1
    duration_min: float = 30
    at_junction: bool = False
    highway: bool = True


class DelayIn(In):
    cause: str
    hour: int = Field(ge=0, le=23)
    rain_mm: float = 0
    reports: int = 1
    highway: bool = True
    speed_kmh: float
    normal_speed_kmh: float = 40


class PunchIn(In):
    employee_id: str
    at: datetime | None = None
    gate: str = "Main gate"
