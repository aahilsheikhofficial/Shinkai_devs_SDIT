"""Load the trained models once and answer predictions. Trains on first use if missing."""
from functools import lru_cache

import joblib
import numpy as np

from .train import CAUSES, MODEL_DIR, train


@lru_cache
def _models():
    if not (MODEL_DIR / "cause.joblib").exists():
        train(verbose=False)
    return (
        joblib.load(MODEL_DIR / "cause.joblib"),
        joblib.load(MODEL_DIR / "delay.joblib"),
        joblib.load(MODEL_DIR / "metrics.joblib"),
    )


def metrics() -> dict:
    return _models()[2]


def guess_cause(f: dict) -> list[dict]:
    cause, _, _ = _models()
    row = np.array([[
        f["hour"], f["weekday"], f["month"], f["rain_mm"], f["speed_kmh"], f["normal_speed_kmh"],
        f["reports"], f["duration_min"], int(f["at_junction"]), int(f["highway"]),
    ]])
    probs = cause.predict_proba(row)[0]
    ranked = sorted(zip(CAUSES, probs), key=lambda p: -p[1])
    return [{"cause": c, "confidence": round(float(p) * 100)} for c, p in ranked]


def predict_delay(cause_name: str, hour: int, rain_mm: float, reports: int, highway: bool, speed_kmh: float, normal_speed_kmh: float) -> float:
    _, delay, _ = _models()
    idx = CAUSES.index(cause_name) if cause_name in CAUSES else 0
    drop = max(0.0, 1 - speed_kmh / max(normal_speed_kmh, 1))
    return round(float(delay.predict(np.array([[idx, hour, rain_mm, reports, int(highway), drop]]))[0]), 1)
