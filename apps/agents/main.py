from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.agents import router as agents_router
from routers.webhooks import router as webhooks_router
from scheduler.jobs import create_scheduler
from db import get_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect MongoDB
    get_db()
    # Start scheduler
    scheduler = create_scheduler()
    scheduler.start()
    print("[Pact] Scheduler started")
    yield
    scheduler.shutdown()
    print("[Pact] Scheduler stopped")
    await close_db()


app = FastAPI(
    title="Pact Agent Economy API",
    description="Autonomous AI agent economy — agents that hire, pay, and fire each other",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router)
app.include_router(webhooks_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "pact-agents"}
