
from collections import Counter, defaultdict
from pathlib import Path
import json
import warnings

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


warnings.filterwarnings("ignore", category=FutureWarning)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

FLEET_PATH = DATA_DIR / "fleet_clean.csv"
HISTORY_PATH = DATA_DIR / "booking_history_clean.csv"

# Keep the original trained model untouched until a replacement
# has demonstrated better performance.
MODEL_PATH = MODELS_DIR / "drivex_recommender_v2.joblib"
METRICS_PATH = REPORTS_DIR / "training_metrics_v2.json"
PREDICTIONS_PATH = REPORTS_DIR / "test_predictions_v2.csv"

RANDOM_STATE = 42

TRAIN_NEGATIVES = 3
VALIDATION_NEGATIVES = 19
TEST_NEGATIVES = 49

# Set to False to run the faster Logistic Regression experiment only.
RUN_RANDOM_FOREST = True

NUMERIC_FEATURES = [
    "vehicle_year",
    "source_daily_rate",
    "duration_days",
    "booking_lead_hours",
    "membership_discount_percent",
    "customer_prior_bookings",
    "customer_mean_daily_rate",
    "category_match",
    "manufacturer_match",
    "fuel_match",
]

CATEGORICAL_FEATURES = [
    "manufacturer",
    "model_name",
    "category",
    "fuel_type",
    "transmission",
    "membership_tier",
    "pickup_city",
    "dropoff_city",
    "customer_preferred_category",
    "customer_preferred_manufacturer",
    "customer_preferred_fuel",
]

FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES

CONTEXT_COLUMNS = [
    "id",
    "customer_id",
    "vehicle_id",
    "duration_days",
    "booking_lead_hours",
    "membership_tier",
    "membership_discount_percent",
    "pickup_city",
    "dropoff_city",
    "customer_prior_bookings",
    "customer_mean_daily_rate",
    "customer_preferred_category",
    "customer_preferred_manufacturer",
    "customer_preferred_fuel",
]


def load_data():
    fleet = pd.read_csv(FLEET_PATH)
    history = pd.read_csv(HISTORY_PATH)

    required_fleet = {
        "vehicle_id",
        "manufacturer",
        "model_name",
        "category",
        "vehicle_year",
        "fuel_type",
        "transmission",
        "source_daily_rate",
    }

    required_history = {
        "id",
        "customer_id",
        "vehicle_id",
        "booking_date",
        "duration_days",
        "booking_lead_hours",
        "pickup_city",
        "dropoff_city",
        "membership_tier",
        "membership_discount_percent",
    }

    missing_fleet = required_fleet - set(fleet.columns)
    missing_history = required_history - set(history.columns)

    if missing_fleet:
        raise ValueError(
            f"Missing fleet columns: {sorted(missing_fleet)}"
        )

    if missing_history:
        raise ValueError(
            f"Missing booking columns: {sorted(missing_history)}"
        )

    fleet["vehicle_id"] = pd.to_numeric(
        fleet["vehicle_id"], errors="coerce"
    )
    history["vehicle_id"] = pd.to_numeric(
        history["vehicle_id"], errors="coerce"
    )
    history["customer_id"] = pd.to_numeric(
        history["customer_id"], errors="coerce"
    )

    fleet = fleet.dropna(subset=["vehicle_id"]).copy()
    history = history.dropna(
        subset=[
            "id",
            "customer_id",
            "vehicle_id",
            "booking_date",
            "duration_days",
        ]
    ).copy()

    fleet["vehicle_id"] = fleet["vehicle_id"].astype(int)
    history["vehicle_id"] = history["vehicle_id"].astype(int)
    history["customer_id"] = history["customer_id"].astype(int)

    history["booking_date"] = pd.to_datetime(
        history["booking_date"], errors="coerce"
    )

    history["duration_days"] = pd.to_numeric(
        history["duration_days"], errors="coerce"
    )
    history["booking_lead_hours"] = pd.to_numeric(
        history["booking_lead_hours"], errors="coerce"
    )
    history["membership_discount_percent"] = pd.to_numeric(
        history["membership_discount_percent"], errors="coerce"
    )

    history = history.dropna(
        subset=["booking_date", "duration_days"]
    ).copy()

    fleet = fleet.drop_duplicates("vehicle_id").copy()

    history = history[
        history["vehicle_id"].isin(fleet["vehicle_id"])
        & (history["duration_days"] > 0)
    ].copy()

    for col in [
        "manufacturer",
        "model_name",
        "category",
        "fuel_type",
        "transmission",
    ]:
        fleet[col] = fleet[col].fillna("Unknown").astype(str)

    for col in [
        "membership_tier",
        "pickup_city",
        "dropoff_city",
    ]:
        history[col] = history[col].fillna("Unknown").astype(str)

    if len(fleet) < 50:
        raise ValueError("The fleet dataset is unexpectedly small.")

    if len(history) < 100:
        raise ValueError("Not enough booking history to train.")

    if history["id"].duplicated().any():
        raise ValueError("Booking IDs must be unique.")

    if history["customer_id"].nunique() < 2:
        raise ValueError("At least two customers are required.")

    return fleet.reset_index(drop=True), history.reset_index(drop=True)


def build_customer_context(history):
    """
    Build each booking's customer profile using strictly earlier
    booking timestamps. Bookings at the same timestamp are processed
    together, so they cannot leak into each other's profiles.
    """
    history = history.sort_values(
        "booking_date", kind="stable"
    ).reset_index(drop=True)

    category_counts = defaultdict(Counter)
    manufacturer_counts = defaultdict(Counter)
    fuel_counts = defaultdict(Counter)

    booking_counts = Counter()
    rate_sums = defaultdict(float)
    rate_counts = Counter()

    context_rows = []

    for _, same_time in history.groupby(
        "booking_date", sort=False
    ):
        rows_at_time = list(same_time.itertuples(index=False))

        # Create profiles before updating with bookings at this time.
        for row in rows_at_time:
            customer_id = int(row.customer_id)

            prior_count = booking_counts[customer_id]

            preferred_category = (
                category_counts[customer_id].most_common(1)[0][0]
                if category_counts[customer_id]
                else "Unknown"
            )

            preferred_manufacturer = (
                manufacturer_counts[customer_id].most_common(1)[0][0]
                if manufacturer_counts[customer_id]
                else "Unknown"
            )

            preferred_fuel = (
                fuel_counts[customer_id].most_common(1)[0][0]
                if fuel_counts[customer_id]
                else "Unknown"
            )

            context_rows.append(
                {
                    "id": int(row.id),
                    "customer_prior_bookings": prior_count,
                    "customer_mean_daily_rate": (
                        rate_sums[customer_id]
                        / rate_counts[customer_id]
                        if rate_counts[customer_id]
                        else np.nan
                    ),
                    "customer_preferred_category": preferred_category,
                    "customer_preferred_manufacturer": (
                        preferred_manufacturer
                    ),
                    "customer_preferred_fuel": preferred_fuel,
                }
            )

        # Update profiles only after every booking at this timestamp
        # has received its historical profile.
        for row in rows_at_time:
            customer_id = int(row.customer_id)

            category_counts[customer_id][str(row.category)] += 1
            manufacturer_counts[customer_id][
                str(row.manufacturer)
            ] += 1
            fuel_counts[customer_id][str(row.fuel_type)] += 1

            rate = pd.to_numeric(
                row.source_daily_rate, errors="coerce"
            )

            if pd.notna(rate):
                rate_sums[customer_id] += float(rate)
                rate_counts[customer_id] += 1

            booking_counts[customer_id] += 1

    profiles = pd.DataFrame(context_rows)

    result = history.merge(
        profiles,
        on="id",
        how="left",
        validate="one_to_one",
    )

    return result


def build_candidate_pairs(bookings, fleet, negatives_per_booking, rng):
    """
    Each historical booking is one positive example.
    Alternative vehicles are sampled as weak negatives, not as
    confirmed customer rejections.
    """
    contexts = bookings[CONTEXT_COLUMNS].copy()
    contexts["group_id"] = contexts["id"].astype(str)

    positives = contexts.merge(
        fleet,
        on="vehicle_id",
        how="inner",
        validate="many_to_one",
    )
    positives["target"] = 1

    fleet_ids = fleet["vehicle_id"].to_numpy()
    fleet_id_set = set(fleet_ids)

    requested_negatives = min(
        negatives_per_booking, len(fleet_ids) - 1
    )

    negative_vehicle_ids = []

    for booked_vehicle_id in bookings["vehicle_id"].to_numpy():
        alternatives = fleet_ids[
            fleet_ids != booked_vehicle_id
        ]

        selected = rng.choice(
            alternatives,
            size=requested_negatives,
            replace=False,
        )

        negative_vehicle_ids.append(selected)

    negative_vehicle_ids = np.asarray(negative_vehicle_ids)

    negative_contexts = contexts.loc[
        contexts.index.repeat(requested_negatives)
    ].reset_index(drop=True)

    negative_contexts["vehicle_id"] = (
        negative_vehicle_ids.reshape(-1)
    )

    negatives = negative_contexts.merge(
        fleet,
        on="vehicle_id",
        how="inner",
        validate="many_to_one",
    )
    negatives["target"] = 0

    pairs = pd.concat(
        [positives, negatives],
        ignore_index=True,
    )

    # Explicit preference-match signals help the model learn whether
    # a candidate matches the customer's observed historical choices.
    pairs["category_match"] = (
        (pairs["customer_preferred_category"] != "Unknown")
        & (
            pairs["category"]
            == pairs["customer_preferred_category"]
        )
    ).astype(int)

    pairs["manufacturer_match"] = (
        (pairs["customer_preferred_manufacturer"] != "Unknown")
        & (
            pairs["manufacturer"]
            == pairs["customer_preferred_manufacturer"]
        )
    ).astype(int)

    pairs["fuel_match"] = (
        (pairs["customer_preferred_fuel"] != "Unknown")
        & (pairs["fuel_type"] == pairs["customer_preferred_fuel"])
    ).astype(int)

    for col in NUMERIC_FEATURES:
        pairs[col] = pd.to_numeric(
            pairs[col], errors="coerce"
        )

    for col in CATEGORICAL_FEATURES:
        pairs[col] = pairs[col].fillna("Unknown").astype(str)

    return pairs


def build_pipeline(model_type):
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="most_frequent"),
            ),
            (
                "onehot",
                OneHotEncoder(handle_unknown="ignore"),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, NUMERIC_FEATURES),
            (
                "categorical",
                categorical_pipeline,
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )

    if model_type == "logistic_regression":
        classifier = LogisticRegression(
            max_iter=200,
            class_weight="balanced",
            solver="liblinear",
            random_state=RANDOM_STATE,
        )
    elif model_type == "random_forest":
        classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=14,
            min_samples_leaf=10,
            max_features="sqrt",
            class_weight="balanced_subsample",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )


def evaluate_ranking(pairs, scores):
    evaluated = pairs[
        ["group_id", "target", "vehicle_id"]
    ].copy()
    evaluated["score"] = np.asarray(scores)

    reciprocal_ranks = []
    hit_at_5 = []
    ndcg_at_5 = []
    prediction_rows = []

    for group_id, group in evaluated.groupby(
        "group_id", sort=False
    ):
        group = group.sort_values(
            ["score", "vehicle_id"],
            ascending=[False, True],
        ).reset_index(drop=True)

        positive_positions = np.flatnonzero(
            group["target"].to_numpy() == 1
        )

        if len(positive_positions) == 0:
            continue

        rank = int(positive_positions[0]) + 1

        reciprocal_ranks.append(1.0 / rank)
        hit_at_5.append(float(rank <= 5))
        ndcg_at_5.append(
            1.0 / np.log2(rank + 1) if rank <= 5 else 0.0
        )

        positive_row = group[group["target"] == 1].iloc[0]

        prediction_rows.append(
            {
                "booking_id": group_id,
                "positive_vehicle_id": int(
                    positive_row["vehicle_id"]
                ),
                "positive_rank": rank,
                "positive_score": float(positive_row["score"]),
            }
        )

    return {
        "groups": len(reciprocal_ranks),
        "recall_at_5": (
            float(np.mean(hit_at_5)) if hit_at_5 else None
        ),
        "mrr": (
            float(np.mean(reciprocal_ranks))
            if reciprocal_ranks else None
        ),
        "ndcg_at_5": (
            float(np.mean(ndcg_at_5)) if ndcg_at_5 else None
        ),
        "predictions": pd.DataFrame(prediction_rows),
    }


def main():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading datasets...")
    fleet, history = load_data()

    print(f"Fleet vehicles: {len(fleet):,}")
    print(f"Valid booking rows: {len(history):,}")
    print(f"Unique customers: {history['customer_id'].nunique():,}")

    print("\nBuilding historical customer profiles...")
    history = build_customer_context(history)
    history = history.sort_values(
        "booking_date", kind="stable"
    ).reset_index(drop=True)

    # Chronological 70% / 15% / 15% split.
    n = len(history)
    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    train_bookings = history.iloc[:train_end].copy()
    validation_bookings = history.iloc[
        train_end:validation_end
    ].copy()
    test_bookings = history.iloc[validation_end:].copy()

    print(f"Training bookings: {len(train_bookings):,}")
    print(f"Validation bookings: {len(validation_bookings):,}")
    print(f"Test bookings: {len(test_bookings):,}")
    print(
        "Training cutoff:",
        train_bookings["booking_date"].max(),
    )
    print(
        "Validation cutoff:",
        validation_bookings["booking_date"].max(),
    )

    rng = np.random.default_rng(RANDOM_STATE)

    print("\nBuilding training candidates...")
    train_pairs = build_candidate_pairs(
        train_bookings, fleet, TRAIN_NEGATIVES, rng
    )
    print(f"Training rows: {len(train_pairs):,}")

    print("\nBuilding validation candidates...")
    validation_pairs = build_candidate_pairs(
        validation_bookings,
        fleet,
        VALIDATION_NEGATIVES,
        rng,
    )
    print(f"Validation rows: {len(validation_pairs):,}")

    print("\nBuilding test candidates...")
    test_pairs = build_candidate_pairs(
        test_bookings, fleet, TEST_NEGATIVES, rng
    )
    print(f"Test rows: {len(test_pairs):,}")

    X_train = train_pairs[FEATURE_COLUMNS]
    y_train = train_pairs["target"]

    X_validation = validation_pairs[FEATURE_COLUMNS]
    X_test = test_pairs[FEATURE_COLUMNS]

    experiments = ["logistic_regression"]

    if RUN_RANDOM_FOREST:
        experiments.append("random_forest")

    results = {}
    fitted_models = {}

    for model_name in experiments:
        print(f"\nTraining {model_name}...")
        model = build_pipeline(model_name)
        model.fit(X_train, y_train)

        print(f"Evaluating {model_name} on validation...")
        validation_scores = model.predict_proba(
            X_validation
        )[:, 1]

        validation_metrics = evaluate_ranking(
            validation_pairs, validation_scores
        )

        results[model_name] = {
            "validation_recall_at_5": (
                validation_metrics["recall_at_5"]
            ),
            "validation_mrr": validation_metrics["mrr"],
            "validation_ndcg_at_5": (
                validation_metrics["ndcg_at_5"]
            ),
        }

        fitted_models[model_name] = model

        print(
            f"Validation Recall@5: "
            f"{validation_metrics['recall_at_5']:.4f}"
        )
        print(f"Validation MRR: {validation_metrics['mrr']:.4f}")
        print(
            f"Validation NDCG@5: "
            f"{validation_metrics['ndcg_at_5']:.4f}"
        )

    # Select the model using validation NDCG@5 only.
    best_model_name = max(
        results,
        key=lambda name: (
            results[name]["validation_ndcg_at_5"] or 0.0
        ),
    )

    best_model = fitted_models[best_model_name]

    print(f"\nSelected model: {best_model_name}")
    print("Evaluating the selected model on held-out test data...")

    test_scores = best_model.predict_proba(X_test)[:, 1]
    test_metrics = evaluate_ranking(test_pairs, test_scores)

    # Non-personalized baseline: rank vehicles by training booking count.
    popularity = train_bookings["vehicle_id"].value_counts()

    baseline_scores = (
        test_pairs["vehicle_id"]
        .map(popularity)
        .fillna(0)
        .to_numpy()
    )

    baseline_metrics = evaluate_ranking(
        test_pairs, baseline_scores
    )

    # Pairwise ROC-AUC is secondary; ranking metrics are primary.
    try:
        test_auc = float(
            roc_auc_score(
                test_pairs["target"],
                test_scores,
            )
        )
    except ValueError:
        test_auc = None

    metrics = {
        "selected_model": best_model_name,
        "random_state": RANDOM_STATE,
        "source_fleet_rows": int(len(fleet)),
        "valid_booking_rows": int(len(history)),
        "unique_customers": int(history["customer_id"].nunique()),
        "training_booking_rows": int(len(train_bookings)),
        "validation_booking_rows": int(len(validation_bookings)),
        "testing_booking_rows": int(len(test_bookings)),
        "training_cutoff_date": str(
            train_bookings["booking_date"].max()
        ),
        "validation_cutoff_date": str(
            validation_bookings["booking_date"].max()
        ),
        "negative_samples": {
            "training": TRAIN_NEGATIVES,
            "validation": VALIDATION_NEGATIVES,
            "testing": TEST_NEGATIVES,
        },
        "experiments": results,
        "selected_model_test": {
            "candidate_groups": test_metrics["groups"],
            "recall_at_5": test_metrics["recall_at_5"],
            "mrr": test_metrics["mrr"],
            "ndcg_at_5": test_metrics["ndcg_at_5"],
            "roc_auc_on_sampled_pairs": test_auc,
        },
        "popularity_baseline_test": {
            "candidate_groups": baseline_metrics["groups"],
            "recall_at_5": baseline_metrics["recall_at_5"],
            "mrr": baseline_metrics["mrr"],
            "ndcg_at_5": baseline_metrics["ndcg_at_5"],
        },
        "limitations": [
            "Negative alternatives are sampled and are not confirmed rejections.",
            "The source dataset has no booking cancellation/status field.",
            "Fleet prices and attributes are not historical snapshots.",
            "Historical review statistics are excluded from this experiment.",
            "The model is evaluated on sampled candidates, not all available vehicles.",
            "Source price currency is unconfirmed and must not be treated as EGP.",
            "This is an offline experiment, not yet integrated with the application.",
        ],
    }

    joblib.dump(best_model, MODEL_PATH)

    with open(METRICS_PATH, "w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=2, ensure_ascii=False)

    test_metrics["predictions"].to_csv(
        PREDICTIONS_PATH, index=False
    )

    print("\n========== FINAL TEST RESULTS ==========")
    print("Selected model:", best_model_name)
    print(
        "Model Recall@5:",
        metrics["selected_model_test"]["recall_at_5"],
    )
    print("Model MRR:", metrics["selected_model_test"]["mrr"])
    print(
        "Model NDCG@5:",
        metrics["selected_model_test"]["ndcg_at_5"],
    )
    print(
        "Baseline Recall@5:",
        metrics["popularity_baseline_test"]["recall_at_5"],
    )
    print("Baseline MRR:", metrics["popularity_baseline_test"]["mrr"])
    print(
        "Baseline NDCG@5:",
        metrics["popularity_baseline_test"]["ndcg_at_5"],
    )
    print("Sampled-pair ROC-AUC:", test_auc)

    print("\nSaved model:", MODEL_PATH)
    print("Saved metrics:", METRICS_PATH)
    print("Saved test rankings:", PREDICTIONS_PATH)

    print(
        "\nImportant: these metrics describe sampled candidate sets. "
        "They do not prove real-world booking conversion."
    )


if __name__ == "__main__":
    main()
