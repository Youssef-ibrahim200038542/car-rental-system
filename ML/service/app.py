"""DriveX AI recommendation service (FastAPI).

Laravel calls POST /rank with the bookable cars and the user's preferences, and
gets back the AI ranking. If this service is down, Laravel falls back to its
rule-based scorer, so the website keeps working.

Run from the repository root:

    pip install -r ML/requirements.txt
    uvicorn app:app --app-dir ML/service --port 8001
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "recommendation_system"))

from ai_recommender import CarRecommender  # noqa: E402
from drivex_ranker import DriveXRanker  # noqa: E402
from train import MODEL_PATH, train  # noqa: E402


def load_ranker() -> DriveXRanker:
    # The .joblib is git-ignored, so a fresh clone trains it on first start (about a second).
    model = CarRecommender.load(MODEL_PATH) if MODEL_PATH.exists() else train()
    return DriveXRanker(model)


ranker = load_ranker()
app = FastAPI(title="DriveX AI Recommender", version="1.0")


class Preferences(BaseModel):
    budget: float | None = Field(default=None, ge=0)
    category: str | None = None
    fuel_type: Literal["petrol", "diesel", "hybrid", "electric"] | None = None
    transmission: Literal["manual", "automatic"] | None = None
    seats: int | None = Field(default=None, ge=1)
    branch_id: int | None = None


class FleetCar(BaseModel):
    id: int
    brand: str
    model: str
    year: int
    category: str | None = None
    fuel_type: str
    transmission: str
    seats: int
    daily_rate: float = Field(ge=0)
    branch_id: int | None = None


class RankRequest(BaseModel):
    preferences: Preferences = Preferences()
    cars: list[FleetCar]
    limit: int = Field(default=6, ge=1, le=50)


@app.get("/health")
def health():
    return {"status": "ok", "method": ranker.method, "alpha": ranker.alpha}


@app.post("/rank")
def rank(body: RankRequest):
    cars = [car.model_dump() for car in body.cars]
    for car in cars:
        car["category"] = car["category"] or ""
    ranking = ranker.rank(cars, body.preferences.model_dump(), limit=body.limit)
    return {"method": ranker.method, "alpha": ranker.alpha, "ranking": ranking}
