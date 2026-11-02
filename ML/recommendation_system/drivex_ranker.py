"""Applies the trained AI recommender to the live DriveX fleet.

Laravel sends the cars that can actually be booked (status and date
availability already checked) plus the user's preferences. This module:

1. applies the user's hard constraints (budget, category, transmission, seats),
   relaxing them one at a time when nothing matches;
2. retrieves the nearest cars with weighted KNN over DriveX's own columns;
3. predicts demand with the gradient-boosting model trained in
   ``ML/notebooks/drivex_ai_recommender.ipynb`` and blends the two scores:
   ``score = alpha * similarity + (1 - alpha) * demand``.

The demand model was trained on the Cornell dataset (US categories, USD prices),
so DriveX cars are translated into that feature space first:
- category: SUV -> suv, Minivan/Van -> minivan, Truck/Pickup -> truck, others -> car;
- fuel: petrol -> gasoline;
- price: an EGP rate is mapped to the same *percentile* of the Cornell price
  distribution (the cheapest DriveX car looks like a cheap Cornell car, the most
  expensive like an expensive one), so no exchange rate is assumed.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors

from ai_recommender import CarRecommender

KNN_WEIGHTS = {"category": 3.0, "transmission": 2.0, "price": 2.0, "fuel_type": 1.5, "seats": 1.0, "branch_id": 1.0}

CATEGORY_TO_CORNELL = {
    "suv": "suv", "crossover": "suv", "4x4": "suv",
    "minivan": "minivan", "van": "minivan", "mpv": "minivan",
    "truck": "truck", "pickup": "truck",
}
FUEL_TO_CORNELL = {"petrol": "gasoline", "gasoline": "gasoline", "diesel": "diesel", "hybrid": "hybrid", "electric": "electric"}

POPULAR_THRESHOLD = 0.7
BUDGET_RELAX_FACTOR = 1.25


def _norm(value) -> str:
    return "" if value is None else str(value).strip().casefold()


def _minmax(values) -> np.ndarray:
    values = np.asarray(values, dtype=float)
    span = values.max() - values.min()
    return np.ones_like(values) if span == 0 else (values - values.min()) / span


def _egp(amount: float) -> str:
    return f"{amount:,.0f} EGP/day"


class DriveXRanker:
    method = "ai-knn-demand-hybrid"

    def __init__(self, model: CarRecommender):
        self.model = model
        self.alpha = float(model.alpha)
        self.cornell_prices = np.sort(model.cars["daily_rate"].to_numpy(dtype=float))

    # ------------------------------------------------------------ demand model
    def predict_demand(self, cars: pd.DataFrame) -> np.ndarray:
        price_pct = cars["daily_rate"].rank(pct=True, method="average").clip(0, 1)
        frame = pd.DataFrame({
            "category": cars["category"].map(lambda c: CATEGORY_TO_CORNELL.get(_norm(c), "car")),
            "fuel_type": cars["fuel_type"].map(lambda f: FUEL_TO_CORNELL.get(_norm(f), "unknown")),
            "make": cars["brand"].astype(str).str.strip().str.title(),
            "model": cars["model"].astype(str).str.strip().str.title(),
            "daily_rate": np.quantile(self.cornell_prices, price_pct),
            "year": cars["year"].astype(int),
        })
        return self.model.demand_model.predict(self.model._demand_X(frame))

    # ------------------------------------------------------------ constraints
    @staticmethod
    def _eligible(cars: pd.DataFrame, prefs: dict) -> tuple[pd.DataFrame, list[str]]:
        budget, seats = prefs.get("budget"), prefs.get("seats")
        category, transmission = _norm(prefs.get("category")), _norm(prefs.get("transmission"))
        steps = [
            ("", dict(budget=1.0, category=True, transmission=True, seats=True)),
            (f"No exact match within your budget, so cars up to {int((BUDGET_RELAX_FACTOR - 1) * 100)}% over it are included",
             dict(budget=BUDGET_RELAX_FACTOR, category=True, transmission=True, seats=True)),
            ("No car in that category fits, so other categories are included",
             dict(budget=BUDGET_RELAX_FACTOR, category=False, transmission=True, seats=True)),
            ("No car with that transmission fits, so both transmissions are included",
             dict(budget=BUDGET_RELAX_FACTOR, category=False, transmission=False, seats=True)),
            ("No car has enough seats, so smaller cars are included",
             dict(budget=BUDGET_RELAX_FACTOR, category=False, transmission=False, seats=False)),
        ]
        for note, rule in steps:
            mask = pd.Series(True, index=cars.index)
            if budget is not None:
                mask &= cars["daily_rate"] <= float(budget) * rule["budget"]
            if rule["category"] and category:
                mask &= cars["category"].map(_norm) == category
            if rule["transmission"] and transmission:
                mask &= cars["transmission"].map(_norm) == transmission
            if rule["seats"] and seats is not None:
                mask &= cars["seats"] >= int(seats)
            if mask.any():
                return cars[mask], [note] if note else []
        return cars, ["No car matches your filters, so the closest cars overall are shown"]

    # ------------------------------------------------------------------- KNN
    @staticmethod
    def _knn_space(cars: pd.DataFrame, prefs: dict) -> tuple[np.ndarray, np.ndarray]:
        """Weighted feature matrix for the cars and the request; empty preferences add no columns."""
        car_blocks, req_blocks = [], []
        for field in ["category", "fuel_type", "transmission", "branch_id"]:
            wanted = prefs.get(field)
            if wanted in (None, ""):
                continue
            values = cars[field].map(_norm)
            levels = sorted(set(values) | {_norm(wanted)})
            w = np.sqrt(KNN_WEIGHTS[field])
            car_blocks.append(np.stack([(values == lv).to_numpy(float) for lv in levels], axis=1) * w)
            req_blocks.append(np.array([[float(_norm(wanted) == lv) for lv in levels]]) * w)

        numeric = []
        if prefs.get("budget") is not None:
            numeric.append(("price", np.log1p(cars["daily_rate"].to_numpy(float)), np.log1p(float(prefs["budget"]))))
        if prefs.get("seats") is not None:
            numeric.append(("seats", cars["seats"].to_numpy(float), float(prefs["seats"])))
        for name, column, target in numeric:
            mean, std = column.mean(), column.std() or 1.0
            w = np.sqrt(KNN_WEIGHTS[name])
            car_blocks.append(((column - mean) / std)[:, None] * w)
            req_blocks.append(np.array([[(target - mean) / std]]) * w)

        if not car_blocks:
            return np.zeros((len(cars), 1)), np.zeros((1, 1))
        return np.hstack(car_blocks), np.hstack(req_blocks)

    # ------------------------------------------------------------------ rank
    def rank(self, cars: list[dict], prefs: dict, limit: int = 6) -> list[dict]:
        if not cars:
            return []
        df = pd.DataFrame(cars)
        df["daily_rate"] = df["daily_rate"].astype(float)
        df["demand"] = self.predict_demand(df)

        eligible, notes = self._eligible(df, prefs)
        X, q = self._knn_space(eligible, prefs)
        n = min(self.model.n_candidates, len(eligible))
        knn = NearestNeighbors(n_neighbors=n, metric="euclidean", algorithm="brute").fit(X)
        dist, idx = knn.kneighbors(q)

        cand = eligible.iloc[idx[0]].copy()
        cand["similarity_score"] = _minmax(1.0 / (1.0 + dist[0]))
        cand["demand_score"] = _minmax(cand["demand"])
        cand["score"] = self.alpha * cand["similarity_score"] + (1 - self.alpha) * cand["demand_score"]
        cand = cand.sort_values(["score", "daily_rate"], ascending=[False, True]).head(limit)

        return [
            {
                "id": int(row.id),
                "score": round(float(row.score), 4),
                "similarity_score": round(float(row.similarity_score), 4),
                "demand_score": round(float(row.demand_score), 4),
                "reasons": self._reasons(row, prefs, notes),
            }
            for row in cand.itertuples()
        ]

    @staticmethod
    def _reasons(row, prefs: dict, notes: list[str]) -> list[str]:
        out = list(notes)
        budget = prefs.get("budget")
        if budget is not None:
            if row.daily_rate <= float(budget):
                out.append(f"Within your budget ({_egp(row.daily_rate)})")
            else:
                over = (row.daily_rate - float(budget)) / float(budget) * 100 if float(budget) > 0 else 100
                out.append(f"{over:.0f}% over your budget ({_egp(row.daily_rate)})")
        for field, label in [("category", "category"), ("fuel_type", "fuel"), ("transmission", "transmission")]:
            wanted = prefs.get(field)
            if wanted:
                actual = getattr(row, field)
                out.append(f"Matches your {label} ({actual})" if _norm(actual) == _norm(wanted)
                           else f"Different {label} ({actual}), closest alternative")
        if prefs.get("seats") is not None:
            out.append(f"{row.seats} seats (you need {prefs['seats']})" if row.seats >= int(prefs["seats"])
                       else f"Only {row.seats} seats (you need {prefs['seats']})")
        if prefs.get("branch_id") is not None and int(row.branch_id) == int(prefs["branch_id"]):
            out.append("At your chosen branch")
        if row.demand_score >= POPULAR_THRESHOLD:
            out.append("AI predicts high demand for this car")
        return out
