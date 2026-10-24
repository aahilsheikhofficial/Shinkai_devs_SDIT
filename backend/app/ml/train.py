"""Train the two demo models on generated sample data.

1. Cause guesser: what probably caused a jam, with a confidence (%).
2. Delay predictor: how many minutes of delay to expect.

The sample data follows simple real-world patterns (rain in monsoon months,
accidents at peak hours, signal failures at junctions) plus noise. Swap in real
reports once the app collects them. Run: python -m app.ml.train
"""
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import accuracy_score, mean_absolute_error
from sklearn.model_selection import train_test_split

MODEL_DIR = Path(__file__).parent / "models"
CAUSES = ["Accident", "Road repair", "Heavy rain", "Signal failure", "Breakdown", "Festival"]
# hour, weekday, month, rain_mm, speed_kmh, normal_speed_kmh, reports, duration_min, at_junction, highway
CAUSE_FEATURES = [
    "hour", "weekday", "month", "rain_mm", "speed_kmh", "normal_speed_kmh",
    "reports", "duration_min", "at_junction", "highway",
]
DELAY_FEATURES = ["cause_idx", "hour", "rain_mm", "reports", "highway", "speed_drop"]


def _sample(rng: np.random.Generator, cause: str) -> list[float]:
    hour = int(rng.integers(5, 23))
    weekday = int(rng.integers(0, 7))
    month = int(rng.integers(1, 13))
    monsoon = month in (6, 7, 8, 9)
    rain = float(rng.gamma(1.5, 6 if monsoon else 1.5)) if rng.random() < (0.6 if monsoon else 0.15) else 0.0
    highway = int(rng.random() < 0.6)
    normal = 45.0 if highway else 30.0
    junction = int(rng.random() < 0.4)
    reports = int(rng.poisson(4)) + 1
    duration = float(rng.gamma(2, 20))

    if cause == "Accident":
        hour = int(rng.choice([8, 9, 17, 18, 19, 22, hour]))
        speed = rng.uniform(2, 12)
        reports += int(rng.poisson(6))
        duration = float(rng.uniform(15, 90))
    elif cause == "Road repair":
        speed = rng.uniform(8, 20)
        duration = float(rng.uniform(120, 600))
        hour = int(rng.integers(7, 19))
    elif cause == "Heavy rain":
        month = int(rng.choice([6, 7, 8, 9]))
        rain = float(rng.uniform(8, 60))
        speed = rng.uniform(6, 22)
        duration = float(rng.uniform(30, 180))
    elif cause == "Signal failure":
        junction = 1
        speed = rng.uniform(4, 15)
        duration = float(rng.uniform(20, 240))
        highway = int(rng.random() < 0.3)
    elif cause == "Breakdown":
        speed = rng.uniform(12, 28)
        reports = int(rng.integers(1, 4))
        duration = float(rng.uniform(5, 45))
    else:  # Festival
        weekday = int(rng.choice([5, 6, weekday]))
        hour = int(rng.integers(16, 23))
        speed = rng.uniform(3, 14)
        reports += int(rng.poisson(3))
        highway = int(rng.random() < 0.2)
        duration = float(rng.uniform(60, 300))
    return [hour, weekday, month, rain, float(speed), normal, reports, duration, junction, highway]


def make_data(n: int = 6000, seed: int = 7):
    rng = np.random.default_rng(seed)
    weights = np.array([0.3, 0.22, 0.18, 0.12, 0.12, 0.06])
    labels = rng.choice(len(CAUSES), size=n, p=weights)
    X = np.array([_sample(rng, CAUSES[i]) for i in labels])

    # Delay in minutes, driven by cause, rain, how slow traffic is and how many people report it
    base = np.array([28, 16, 20, 12, 7, 25])[labels]
    speed_drop = 1 - X[:, 4] / X[:, 5]
    delay = base * (0.5 + speed_drop) + 0.4 * X[:, 3] + 0.8 * np.sqrt(X[:, 6]) + 4 * X[:, 9]
    delay = np.clip(delay + rng.normal(0, 3, n), 1, None)
    D = np.column_stack([labels, X[:, 0], X[:, 3], X[:, 6], X[:, 9], speed_drop])
    return X, labels, D, delay


def train(verbose: bool = True) -> dict:
    X, y, D, delay = make_data()
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=1, stratify=y)
    cause = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=1, n_jobs=-1).fit(Xtr, ytr)
    acc = accuracy_score(yte, cause.predict(Xte))

    Dtr, Dte, dtr, dte = train_test_split(D, delay, test_size=0.2, random_state=1)
    delay_model = GradientBoostingRegressor(random_state=1).fit(Dtr, dtr)
    mae = mean_absolute_error(dte, delay_model.predict(Dte))

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(cause, MODEL_DIR / "cause.joblib")
    joblib.dump(delay_model, MODEL_DIR / "delay.joblib")
    metrics = {"cause_accuracy": round(float(acc), 3), "delay_mae_min": round(float(mae), 2), "samples": len(X)}
    joblib.dump(metrics, MODEL_DIR / "metrics.joblib")
    if verbose:
        print(f"Cause guesser accuracy: {acc:.1%}  |  Delay predictor error: ±{mae:.1f} min")
    return metrics


if __name__ == "__main__":
    train()
