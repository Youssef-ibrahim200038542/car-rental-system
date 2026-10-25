
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = PROJECT_ROOT / "ml" / "data" / "processed" / "fleet_clean.csv"

REQUIRED_COLUMNS = {
    "vehicle_id",
    "manufacturer",
    "model_name",
    "category",
    "vehicle_year",
    "status",
    "source_daily_rate",
    "average_rating",
    "review_count",
}


def load_cars():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_PATH}"
        )

    df = pd.read_csv(DATASET_PATH)

    missing_columns = REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        raise ValueError(
            f"Missing dataset columns: {sorted(missing_columns)}"
        )

    df["source_daily_rate"] = pd.to_numeric(
        df["source_daily_rate"], errors="coerce"
    )
    df["average_rating"] = pd.to_numeric(
        df["average_rating"], errors="coerce"
    )
    df["review_count"] = pd.to_numeric(
        df["review_count"], errors="coerce"
    ).fillna(0)

    df["status"] = df["status"].astype(str).str.strip().str.lower()
    df["category"] = df["category"].astype(str).str.strip()

    return df


def recommend_cars(category, max_daily_budget, limit=5):
    """
    Recommend available cars using the user's selected category
    and maximum daily budget.

    Cars are ranked using a Bayesian-adjusted rating so that
    ratings with more reviews receive more confidence.
    """

    if max_daily_budget <= 0:
        raise ValueError("Budget must be greater than zero.")

    df = load_cars()

    # Only cars currently marked as available.
    candidates = df[
        (df["status"] == "available")
        & (df["category"].str.casefold() == category.strip().casefold())
        & (df["source_daily_rate"] > 0)
        & (df["source_daily_rate"] <= max_daily_budget)
    ].copy()

    if candidates.empty:
        return candidates

    # Global average rating used when a car has few or no reviews.
    rated_cars = df[df["average_rating"].between(1, 5)]
    global_mean = (
        rated_cars["average_rating"].mean()
        if not rated_cars.empty
        else 3.0
    )

    # Bayesian rating: balances the average rating with review count.
    # This prevents a car with one review from automatically
    # outranking a consistently well-rated car.
    prior_reviews = 3

    candidates["rating_score"] = (
        (
            candidates["review_count"] * candidates["average_rating"].fillna(global_mean)
            + prior_reviews * global_mean
        )
        / (candidates["review_count"] + prior_reviews)
    )

    # Within a selected category, lower prices can break rating ties.
    candidates = candidates.sort_values(
        by=["rating_score", "source_daily_rate", "review_count"],
        ascending=[False, True, False],
    )

    candidates = candidates.drop_duplicates(subset=["vehicle_id"])

    result_columns = [
        "vehicle_id",
        "manufacturer",
        "model_name",
        "category",
        "vehicle_year",
        "source_daily_rate",
        "average_rating",
        "review_count",
        "rating_score",
    ]

    return candidates[result_columns].head(limit).reset_index(drop=True)


def main():
    df = load_cars()
    categories = sorted(df["category"].dropna().unique())

    print("\n=== DriveX Car Recommendation System ===")
    print("\nAvailable categories:")

    for index, category in enumerate(categories, start=1):
        print(f"{index}. {category}")

    try:
        selected_index = int(input("\nChoose a category number: "))
        if selected_index < 1 or selected_index > len(categories):
            print("Invalid category selection.")
            return

        selected_category = categories[selected_index - 1]

        budget = float(input("Maximum daily budget: $"))

        recommendations = recommend_cars(
            category=selected_category,
            max_daily_budget=budget,
            limit=5,
        )

        print(f"\nRecommendations for {selected_category}, up to ${budget:.2f}/day")

        if recommendations.empty:
            print(
                "No currently available cars match this category and budget."
            )
            return

        print(
            recommendations.to_string(
                index=False,
                formatters={
                    "source_daily_rate": lambda value: f"${value:.2f}",
                    "average_rating": lambda value: (
                        f"{value:.2f}" if pd.notna(value) else "No rating"
                    ),
                    "rating_score": lambda value: f"{value:.2f}",
                },
            )
        )

    except ValueError as error:
        print(f"Invalid input: {error}")


if __name__ == "__main__":
    main()
