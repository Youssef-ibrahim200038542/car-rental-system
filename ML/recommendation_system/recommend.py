
import json
import sys
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "fleet_clean.csv"
OUTPUT_PATH = (
    Path(__file__).resolve().parent / "reports" / "recommendations.csv"
)

REQUIRED_COLUMNS = {
    "vehicle_id",
    "manufacturer",
    "model_name",
    "category",
    "vehicle_year",
    "fuel_type",
    "transmission",
    "status",
    "source_daily_rate",
    "features",
}


def normalize(value):
    if pd.isna(value):
        return ""
    return str(value).strip().lower()


def split_features(value):
    if pd.isna(value):
        return set()

    return {
        item.strip().lower()
        for item in str(value).split(",")
        if item.strip()
    }


def add_feature_scores(results, desired_features):
    results = results.copy()
    results["matched_features"] = ""
    results["feature_score"] = 0.0

    if desired_features:
        feature_sets = results["features"].apply(split_features)
        matched = feature_sets.apply(
            lambda items: items & desired_features
        )

        results["matched_features"] = matched.apply(
            lambda items: ", ".join(sorted(items))
        )

        results["feature_score"] = matched.apply(
            lambda items: round(
                len(items) / len(desired_features) * 100, 2
            )
        )

    return results


def add_rating_sort(results):
    results = results.copy()

    if "average_rating" in results.columns:
        results["rating_for_sort"] = pd.to_numeric(
            results["average_rating"], errors="coerce"
        ).fillna(-1)
    else:
        results["rating_for_sort"] = -1

    return results


def clean_value(value):
    if pd.isna(value):
        return None

    if hasattr(value, "item"):
        value = value.item()

    if isinstance(value, float) and not value.is_integer():
        return value

    if isinstance(value, float):
        return int(value)

    return value


def prepare_recommendations(results, limit):
    results = results.copy()

    if "branch_name" not in results.columns:
        results["branch_name"] = None

    if "city" not in results.columns:
        results["city"] = None

    if "vehicle_color" not in results.columns:
        results["vehicle_color"] = None

    if "vehicle_mileage" not in results.columns:
        results["vehicle_mileage"] = None

    if "review_count" not in results.columns:
        results["review_count"] = None

    columns = [
        "vehicle_id",
        "manufacturer",
        "model_name",
        "category",
        "vehicle_year",
        "vehicle_color",
        "fuel_type",
        "transmission",
        "vehicle_mileage",
        "branch_name",
        "city",
        "source_daily_rate",
        "features",
        "average_rating",
        "review_count",
        "matched_features",
        "feature_score",
        "result_type",
        "differences",
    ]

    columns = [
        column for column in columns if column in results.columns
    ]

    records = []

    for _, row in results.head(limit).iterrows():
        record = {
            column: clean_value(row[column])
            for column in columns
        }
        records.append(record)

    return records


def recommend(payload):
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    df = pd.read_csv(DATA_PATH)

    missing = REQUIRED_COLUMNS - set(df.columns)

    if missing:
        raise ValueError(
            "Missing dataset columns: "
            + ", ".join(sorted(missing))
        )

    budget = payload.get("budget")

    if budget is None or str(budget).strip() == "":
        raise ValueError("The budget field is required.")

    try:
        budget = float(budget)
    except (TypeError, ValueError):
        raise ValueError("Budget must be a valid number.")

    if budget < 0:
        raise ValueError("Budget must be zero or greater.")

    min_year = payload.get("min_year")

    if min_year is not None and str(min_year).strip() != "":
        try:
            min_year = int(min_year)
        except (TypeError, ValueError):
            raise ValueError("Minimum year must be a valid year.")
    else:
        min_year = None

    try:
        limit = int(payload.get("limit", 10))
    except (TypeError, ValueError):
        raise ValueError("Limit must be a valid integer.")

    if limit < 1 or limit > 100:
        raise ValueError("Limit must be between 1 and 100.")

    df["source_daily_rate"] = pd.to_numeric(
        df["source_daily_rate"], errors="coerce"
    )
    df["vehicle_year"] = pd.to_numeric(
        df["vehicle_year"], errors="coerce"
    )

    available = df[
        df["status"].map(normalize).eq("available")
        & df["source_daily_rate"].notna()
        & df["source_daily_rate"].ge(0)
    ].copy()

    if available.empty:
        return {
            "success": True,
            "result_type": None,
            "count": 0,
            "message": "No available vehicles found.",
            "recommendations": [],
        }

    category = payload.get("category")
    fuel = payload.get("fuel_type")
    transmission = payload.get("transmission")
    city = payload.get("city")

    category = str(category).strip() if category else None
    fuel = str(fuel).strip() if fuel else None
    transmission = str(transmission).strip() if transmission else None
    city = str(city).strip() if city else None

    desired_features = split_features(
        payload.get("features", "")
    )

    # Mandatory filters: availability, budget, category, year and city.
    base = available[
        available["source_daily_rate"].le(budget)
    ].copy()

    if category:
        base = base[
            base["category"].map(normalize).eq(normalize(category))
        ]

    if min_year is not None:
        base = base[base["vehicle_year"].ge(min_year)]

    if city:
        if "city" in base.columns:
            base = base[
                base["city"].map(normalize).eq(normalize(city))
            ]
        else:
            base = base.iloc[0:0]

    if base.empty:
        return {
            "success": True,
            "result_type": None,
            "count": 0,
            "message": (
                "No available vehicles match the budget "
                "and selected core filters."
            ),
            "recommendations": [],
        }

    # Try to find vehicles satisfying all requested preferences.
    full_matches = base.copy()

    if fuel:
        full_matches = full_matches[
            full_matches["fuel_type"].map(normalize).eq(normalize(fuel))
        ]

    if transmission:
        full_matches = full_matches[
            full_matches["transmission"]
            .map(normalize)
            .eq(normalize(transmission))
        ]

    full_matches = add_feature_scores(
        full_matches, desired_features
    )
    full_matches = add_rating_sort(full_matches)

    if not full_matches.empty:
        full_matches["result_type"] = "Full Match"
        full_matches["differences"] = ""

        results = full_matches.sort_values(
            by=[
                "feature_score",
                "rating_for_sort",
                "source_daily_rate",
            ],
            ascending=[False, False, True],
        )

        result_type = "Full Match"
        message = "Vehicles matching all selected preferences."

    else:
        # Keep core filters; explicitly explain fuel/transmission mismatches.
        alternatives = base.copy()
        alternatives["differences"] = ""
        alternatives["difference_count"] = 0

        if fuel:
            fuel_mismatch = (
                alternatives["fuel_type"]
                .map(normalize)
                .ne(normalize(fuel))
            )

            alternatives.loc[fuel_mismatch, "differences"] += (
                "Fuel: requested "
                + fuel
                + "; found "
                + alternatives["fuel_type"]
                .fillna("Unknown")
                .astype(str)
                + "; "
            )

            alternatives["difference_count"] += (
                fuel_mismatch.astype(int)
            )

        if transmission:
            transmission_mismatch = (
                alternatives["transmission"]
                .map(normalize)
                .ne(normalize(transmission))
            )

            alternatives.loc[
                transmission_mismatch, "differences"
            ] += (
                "Transmission: requested "
                + transmission
                + "; found "
                + alternatives["transmission"]
                .fillna("Unknown")
                .astype(str)
                + "; "
            )

            alternatives["difference_count"] += (
                transmission_mismatch.astype(int)
            )

        alternatives = add_feature_scores(
            alternatives, desired_features
        )
        alternatives = add_rating_sort(alternatives)
        alternatives["result_type"] = (
            "Alternative - Not a Full Match"
        )

        results = alternatives.sort_values(
            by=[
                "difference_count",
                "feature_score",
                "rating_for_sort",
                "source_daily_rate",
            ],
            ascending=[True, False, False, True],
        )

        result_type = "Alternative - Not a Full Match"
        message = (
            "No full matches found. Showing alternatives "
            "that satisfy the budget and core filters."
        )

    recommendations = prepare_recommendations(results, limit)

    return {
        "success": True,
        "result_type": result_type,
        "count": len(recommendations),
        "message": message,
        "recommendations": recommendations,
    }


def get_choice(prompt, values):
    print(f"\n{prompt}")

    for index, value in enumerate(values, start=1):
        print(f"{index}. {value}")

    print("0. Skip")

    while True:
        answer = input("Choose a number: ").strip()

        if answer == "0":
            return None

        if answer.isdigit() and 1 <= int(answer) <= len(values):
            return values[int(answer) - 1]

        print("Invalid choice. Try again.")


def get_number(prompt, minimum=None):
    while True:
        try:
            value = float(input(prompt).strip())

            if minimum is not None and value < minimum:
                print(f"Value must be at least {minimum}.")
                continue

            return value

        except ValueError:
            print("Enter a valid number.")


def main_cli():
    if not DATA_PATH.exists():
        print(f"Dataset not found: {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)

    if "status" not in df.columns:
        print("Dataset is missing the status column.")
        return

    available = df[
        df["status"].map(normalize).eq("available")
    ].copy()

    if available.empty:
        print("No available vehicles found.")
        return

    budget = get_number("\nMaximum daily budget: ", minimum=0)

    category = get_choice(
        "Preferred category:",
        sorted(available["category"].dropna().unique().tolist()),
    )

    fuel = get_choice(
        "Preferred fuel type:",
        sorted(available["fuel_type"].dropna().unique().tolist()),
    )

    transmission = get_choice(
        "Preferred transmission:",
        sorted(available["transmission"].dropna().unique().tolist()),
    )

    city = input(
        "\nPreferred city (press Enter to skip): "
    ).strip()

    year_input = input(
        "Minimum vehicle year (press Enter to skip): "
    ).strip()

    features = input(
        "Desired features separated by commas, "
        "or press Enter to skip: "
    ).strip()

    payload = {
        "budget": budget,
        "category": category,
        "fuel_type": fuel,
        "transmission": transmission,
        "city": city or None,
        "min_year": year_input or None,
        "features": features,
        "limit": 10,
    }

    try:
        response = recommend(payload)

        print(f"\n{response['message']}")
        print(f"Result type: {response['result_type']}")
        print(f"Results: {response['count']}")

        if response["recommendations"]:
            print(
                pd.DataFrame(
                    response["recommendations"]
                ).to_string(index=False)
            )

        OUTPUT_PATH.parent.mkdir(
            parents=True, exist_ok=True
        )

        pd.DataFrame(
            response["recommendations"]
        ).to_csv(
            OUTPUT_PATH,
            index=False,
            encoding="utf-8-sig",
        )

        print(f"\nSaved to: {OUTPUT_PATH}")

    except (ValueError, FileNotFoundError) as error:
        print(f"Error: {error}")


def main():
    if "--json" in sys.argv:
        try:
            payload = json.load(sys.stdin)
            response = recommend(payload)

            print(
                json.dumps(
                    response,
                    ensure_ascii=False,
                    allow_nan=False,
                )
            )

        except Exception as error:
            print(
                json.dumps(
                    {
                        "success": False,
                        "error": str(error),
                        "count": 0,
                        "recommendations": [],
                    },
                    ensure_ascii=False,
                    allow_nan=False,
                )
            )
            sys.exit(1)

    else:
        main_cli()


if __name__ == "__main__":
    main()
