from fastapi import APIRouter

from ..ml import predict
from ..schemas import CauseIn, DelayIn

router = APIRouter(prefix="/ml", tags=["ml"])


@router.post("/cause")
def guess_cause(body: CauseIn):
    """Cause guesser: ranked causes with confidence %."""
    ranked = predict.guess_cause(body.model_dump())
    return {"best": ranked[0], "all": ranked}


@router.post("/delay")
def predict_delay(body: DelayIn):
    """Expected delay in minutes for a jam."""
    return {"delayMin": predict.predict_delay(body.cause, body.hour, body.rain_mm, body.reports,
                                              body.highway, body.speed_kmh, body.normal_speed_kmh)}


@router.get("/metrics")
def metrics():
    """How well the demo models score on held-out sample data."""
    return predict.metrics()
