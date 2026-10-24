"""API smoke tests. Run from backend/: python -m pytest -q"""
import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["GOOGLE_MAPS_API_KEY"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def client():
    return TestClient(app)


def test_read_endpoints():
    with client() as c:
        for path in ["/health", "/incidents", "/segments", "/road-ownership", "/company-reports", "/referrals",
                     "/hotspots", "/commute/certificates", "/commute/employees", "/ml/metrics", "/weather"]:
            assert c.get(path).status_code == 200, path


def test_report_merges_and_raises_level():
    with client() as c:
        body = {"reason": "Accident", "place": "Kankanady", "lat": 12.88, "lng": 74.859, "speedKmh": 8}
        first = c.post("/incidents/report", json=body).json()
        c.post("/incidents/report", json=body)
        third = c.post("/incidents/report", json={**body, "hasPhoto": True}).json()
        assert first["merged"] is False and third["merged"] is True
        assert third["incident"]["id"] == first["incident"]["id"]
        assert third["incident"]["verification"] == 5


def test_company_report_flow():
    with client() as c:
        merged = c.post("/company-reports/CR-9031/merge").json()
        assert merged["status"] == "Verified" and merged["employees"] == 6 + 3 + 4
        ids = [r["id"] for r in c.get("/company-reports").json()]
        assert "CR-9030" not in ids and "CR-9029" not in ids
        assert c.patch("/company-reports/CR-9026?status=Referred").json()["status"] == "Referred"
        assert c.patch("/company-reports/CR-9026?status=Bogus").status_code == 400


def test_referrals_and_ownership():
    with client() as c:
        r = c.post("/referrals", json={"issue": "Test", "segment": "Ullal Road", "reports": 3}).json()
        assert r["agency"] == "Mangaluru City Corporation" and r["stage"] == 0
        assert c.post("/referrals", json={"issue": "x", "segment": "Nowhere"}).status_code == 400
        assert c.post(f"/referrals/{r['id']}/advance").json()["stage"] == 1
        assert c.post("/road-ownership/confirm?segment=Kulur bridge approach").json()["verified"] is True


def test_certificate_rules():
    with client() as c:
        certs = {x["employeeId"]: x for x in c.get("/commute/certificates").json()}
        assert certs["AS"]["status"] == "Late · excused"
        assert certs["PS"]["status"] == "Late · partly excused" and certs["PS"]["unexcusedMin"] > 0
        assert certs["RD"]["status"] == "Late · not excused"
        assert certs["AR"]["status"] == "No gate punch"
