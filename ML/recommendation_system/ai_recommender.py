"""DriveX AI car recommender: two-stage retrieve-then-rerank.

Stage 1 - KNN retrieval (unsupervised): the user request and every car are
encoded into the same weighted feature space (one-hot category / fuel / make,
standardized log daily rate). scikit-learn ``NearestNeighbors`` returns the
cars closest to the request.

Stage 2 - learned re-ranking (supervised): a ``HistGradientBoostingRegressor``
is trained to predict how often a car gets rented (log1p of renter trips, a
real customer-behaviour signal) from its attributes. The final score blends
request similarity with predicted demand:

    score = alpha * similarity + (1 - alpha) * predicted_demand

``alpha`` is chosen on a validation split, never on the test split.

Hard constraints (budget ceiling, minimum year, category) are applied before
retrieval and relaxed step by step only when no car satisfies them; relaxed
results are labelled as alternatives in ``reasons``.

Usage from Python::

    from ai_recommender import CarRecommender
    rec = CarRecommender.load("ML/models/drivex_recommender.joblib")
    rec.recommend({"category": "suv", "budget": 150, "fuel_type": "electric"}, k=5)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RANDOM_STATE = 42

# Relative importance of each request field in the KNN distance.
# Declared product priorities, not learned weights.
KNN_WEIGHTS = {"category": 3.0, "fuel_type": 1.5, "make": 1.0, "price": 2.0}

# Inputs of the demand model. Ratings and review counts are excluded on purpose:
# review_count is ~100% correlated with trips (target leakage) and a missing
# rating means "never reviewed", which also leaks the target.
DEMAND_CAT = ["category", "fuel_type", "make"]
DEMAND_NUM = ["daily_rate", "year", "model_supply"]

RENAME = {
    "fuelType": "fuel_type",
    "renterTripsTaken": "trips",
    "reviewCount": "review_count",
    "rate.daily": "daily_rate",
    "vehicle.make": "make",
    "vehicle.model": "model",
    "vehicle.type": "category",
    "vehicle.year": "year",
}


def clean_cars(raw: pd.DataFrame) -> pd.DataFrame:
    """Normalize the Cornell cleaned CSV into the schema used by the recommender."""
    df = raw.rename(columns=RENAME).copy()
    for col in ["daily_rate", "year", "rating", "review_count", "trips"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    for col in ["make", "model", "category", "fuel_type"]:
        df[col] = df[col].astype("string").str.strip()
    df = df.drop_duplicates().dropna(subset=["make", "category", "daily_rate", "year"])
    df = df[df["daily_rate"] > 0].reset_index(drop=True)
    df["category"] = df["category"].str.lower()
    df["fuel_type"] = df["fuel_type"].fillna("unknown").str.lower()
    df["make"] = df["make"].str.title()
    df["model"] = df["model"].fillna("Unknown").str.title()
    df["year"] = df["year"].astype(int)
    df["car_id"] = np.arange(len(df))
    return df


def _norm(value) -> str:
    return str(value).strip().casefold()


def _minmax(values: np.ndarray) -> np.ndarray:
    values = np.asarray(values, dtype=float)
    span = values.max() - values.min()
    return np.ones_like(values) if span == 0 else (values - values.min()) / span


@dataclass
class CarRecommender:
    alpha: float = 0.5
    n_candidates: int = 50
    cars: pd.DataFrame | None = None
    encoders: dict = field(default_factory=dict)
    demand_model: HistGradientBoostingRegressor | None = None
    model_supply: dict = field(default_factory=dict)

    # ------------------------------------------------------------------ fit
    def fit(self, cars: pd.DataFrame, train_ids=None) -> "CarRecommender":
        """Fit encoders on the catalogue and the demand model on ``train_ids`` only."""
        self.cars = cars.reset_index(drop=True).copy()
        train = self.cars if train_ids is None else self.cars[self.cars["car_id"].isin(train_ids)]

        self.encoders = {
            col: OneHotEncoder(handle_unknown="ignore", sparse_output=False).fit(self.cars[[col]])
            for col in ["category", "fuel_type", "make"]
        }
        self.encoders["price"] = StandardScaler().fit(np.log1p(self.cars[["daily_rate"]]))

        # How many listings of the same model exist in the training data (supply signal).
        self.model_supply = train["model"].value_counts().to_dict()
        self.demand_model = HistGradientBoostingRegressor(
            max_iter=300, learning_rate=0.05, max_leaf_nodes=31, min_samples_leaf=20,
            l2_regularization=1.0, categorical_features="from_dtype", random_state=RANDOM_STATE,
        )
        self.demand_model.fit(self._demand_X(train), np.log1p(train["trips"]))
        self.cars["predicted_demand"] = self.demand_model.predict(self._demand_X(self.cars))
        return self

    def _demand_X(self, frame: pd.DataFrame) -> pd.DataFrame:
        X = frame[DEMAND_CAT + ["daily_rate", "year"]].copy()
        for col in DEMAND_CAT:
            X[col] = pd.Categorical(X[col].astype(str), categories=sorted(self.cars[col].astype(str).unique()))
        X["model_supply"] = frame["model"].map(self.model_supply).fillna(0).astype(float)
        return X[DEMAND_CAT + DEMAND_NUM]

    # ------------------------------------------------------------ encoding
    def _fields(self, request: dict) -> list[str]:
        fields = [f for f in ["category", "fuel_type", "make"] if request.get(f)]
        if request.get("budget") is not None:
            fields.append("price")
        return fields

    def _encode_cars(self, frame: pd.DataFrame, fields: list[str]) -> np.ndarray:
        blocks = []
        for f in fields:
            if f == "price":
                block = self.encoders["price"].transform(np.log1p(frame[["daily_rate"]]))
            else:
                block = self.encoders[f].transform(frame[[f]])
            blocks.append(block * np.sqrt(KNN_WEIGHTS[f]))
        return np.hstack(blocks)

    def _encode_request(self, request: dict, fields: list[str]) -> np.ndarray:
        values = {
            "category": request.get("category", "").lower() if request.get("category") else None,
            "fuel_type": request.get("fuel_type", "").lower() if request.get("fuel_type") else None,
            "make": str(request.get("make", "")).title() if request.get("make") else None,
            # Target price = the budget: closest to what the user is willing to pay.
            "daily_rate": float(request["budget"]) if request.get("budget") is not None else 0.0,
        }
        row = pd.DataFrame([{k: (v if v is not None else "") for k, v in values.items()}])
        return self._encode_cars(row, fields)

    # ----------------------------------------------------------- filtering
    def _eligible(self, request: dict, pool: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
        """Apply hard constraints, relaxing them in order when nothing matches."""
        notes: list[str] = []
        budget, min_year, category = request.get("budget"), request.get("min_year"), request.get("category")
        steps = [
            ("strict", 1.0, True, True),
            ("budget relaxed by 25%", 1.25, True, True),
            ("minimum year relaxed", 1.25, False, True),
            ("category relaxed", 1.25, False, False),
        ]
        for label, budget_factor, use_year, use_category in steps:
            mask = pd.Series(True, index=pool.index)
            if budget is not None:
                mask &= pool["daily_rate"] <= float(budget) * budget_factor
            if use_year and min_year is not None:
                mask &= pool["year"] >= int(min_year)
            if use_category and category:
                mask &= pool["category"].map(_norm) == _norm(category)
            if mask.any():
                if label != "strict":
                    notes.append(f"No exact match, so the {label}")
                return pool[mask], notes
        return pool, ["No car satisfies the constraints; showing closest cars"]

    # ----------------------------------------------------------- recommend
    def candidates(self, request: dict, pool: pd.DataFrame | None = None, exclude_ids=()):
        """Stage 1: KNN retrieval of the cars most similar to the request."""
        pool = self.cars if pool is None else pool
        if exclude_ids is not None and len(exclude_ids):
            pool = pool[~pool["car_id"].isin(exclude_ids)]
        eligible, notes = self._eligible(request, pool)
        fields = self._fields(request)
        n = min(self.n_candidates, len(eligible))
        if fields:
            knn = NearestNeighbors(n_neighbors=n, metric="euclidean", algorithm="brute")
            knn.fit(self._encode_cars(eligible, fields))
            dist, idx = knn.kneighbors(self._encode_request(request, fields))
            cand = eligible.iloc[idx[0]].copy()
            cand["knn_distance"] = dist[0]
        else:  # empty request: every car is equally similar
            cand = eligible.copy()
            cand["knn_distance"] = 0.0
        cand["similarity"] = 1.0 / (1.0 + cand["knn_distance"])
        return cand, notes

    def rank(self, cand: pd.DataFrame, alpha: float | None = None) -> pd.DataFrame:
        """Stage 2: blend request similarity with learned demand."""
        alpha = self.alpha if alpha is None else alpha
        cand = cand.copy()
        cand["similarity_score"] = _minmax(cand["similarity"])
        cand["demand_score"] = _minmax(cand["predicted_demand"])
        cand["score"] = alpha * cand["similarity_score"] + (1 - alpha) * cand["demand_score"]
        return cand.sort_values(["score", "daily_rate"], ascending=[False, True])

    def recommend(self, request: dict, k: int = 5) -> pd.DataFrame:
        cand, notes = self.candidates(request)
        top = self.rank(cand).head(k).copy()
        top["reasons"] = [self._reasons(row, request, notes) for row in top.itertuples()]
        cols = ["car_id", "make", "model", "category", "fuel_type", "year", "daily_rate",
                "similarity_score", "demand_score", "score", "reasons"]
        return top[cols].round(3).reset_index(drop=True)

    def _reasons(self, row, request: dict, notes: list[str]) -> list[str]:
        out = list(notes)
        if request.get("budget") is not None:
            out.append("Within budget" if row.daily_rate <= float(request["budget"]) else "Over budget (alternative)")
        for key, label in [("category", "Category"), ("fuel_type", "Fuel"), ("make", "Make")]:
            if request.get(key):
                out.append(f"{label} matches" if _norm(getattr(row, key)) == _norm(request[key])
                           else f"Different {label.lower()} (closest alternative)")
        if request.get("min_year") is not None:
            out.append("Meets minimum year" if row.year >= int(request["min_year"]) else "Older than requested")
        if row.demand_score >= 0.7:
            out.append("Predicted to be popular with renters")
        if request.get("seats") is not None:
            out.append("Seat count not available in this dataset")
        return out

    # ---------------------------------------------------------- persistence
    def save(self, path) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)

    @staticmethod
    def load(path) -> "CarRecommender":
        return joblib.load(path)


if __name__ == "__main__":  # quick demo: python ai_recommender.py
    import sys
    model_path = Path(__file__).resolve().parent.parent / "models" / "drivex_recommender.joblib"
    rec = CarRecommender.load(model_path)
    request = {"category": "suv", "budget": 150, "fuel_type": "electric", "min_year": 2018}
    if len(sys.argv) > 1:
        import json
        request = json.loads(sys.argv[1])
    pd.set_option("display.width", 200, "display.max_colwidth", 80)
    print(rec.recommend(request, k=5))
