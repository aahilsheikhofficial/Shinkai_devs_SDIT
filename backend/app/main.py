import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, SessionLocal, engine
from .ml.predict import metrics
from .poller import poll_once, run_forever
from .routers import commute, gov, incidents, ml, weather
from .seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    metrics()  # loads the ML models (trains them first if missing)
    task = asyncio.create_task(run_forever())
    yield
    task.cancel()


app = FastAPI(title="TrafficSense API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_list, allow_methods=["*"], allow_headers=["*"])

for r in (incidents.router, gov.router, commute.router, ml.router, weather.router):
    app.include_router(r)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/commute/poll-now", tags=["commute"])
async def poll_now():
    """Take a traffic snapshot of every segment right now (needs GOOGLE_MAPS_API_KEY)."""
    return {"saved": await poll_once()}
