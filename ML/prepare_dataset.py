
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = DATA_DIR / "processed"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_csv(filename):
    path = DATA_DIR / filename

    if not path.exists():
        raise FileNotFoundError(f"Missing dataset file: {path}")

    return pd.read_csv(path, low_memory=False)


def main():
    print("Loading source datasets...")

    vehicles = load_csv("vehicles.csv")
    models = load_csv("models.csv")
    manufacturers = load_csv("manufacturers.csv")
    categories = load_csv("categories.csv")
    fuels = load_csv("fuels.csv")
    transmissions = load_csv("transmissions.csv")
    statuses = load_csv("statuses.csv")
    locations = load_csv("locations.csv")
    rates = load_csv("rates.csv")
    features = load_csv("features.csv")
    vehicle_features = load_csv("vehicle_features.csv")
    reviews = load_csv("reviews.csv")

    bookings = load_csv("bookings.csv")
    customers = load_csv("customers.csv")
    memberships = load_csv("memberships.csv")
    discounts = load_csv("discounts.csv")

    print("Preparing vehicle reference tables...")

    model_data = models.rename(
        columns={
            "id": "model_ref_id",
            "name": "model_name",
        }
    )

    manufacturer_data = manufacturers.rename(
        columns={
            "id": "manufacturer_ref_id",
            "name": "manufacturer",
        }
    )

    category_data = categories.rename(
        columns={
            "id": "category_ref_id",
            "name": "category",
        }
    )

    fuel_data = fuels.rename(
        columns={
            "id": "fuel_ref_id",
            "type": "fuel_type",
        }
    )

    transmission_data = transmissions.rename(
        columns={
            "id": "transmission_ref_id",
            "type": "transmission",
        }
    )

    status_data = statuses.rename(
        columns={
            "id": "status_ref_id",
            "name": "status",
        }
    )

    location_data = locations.rename(
        columns={
            "id": "location_ref_id",
            "name": "branch_name",
        }
    )

    rate_data = rates.rename(
        columns={
            "id": "rate_ref_id",
            "daily_rate": "source_daily_rate",
            "hourly_rate": "source_hourly_rate",
            "weekly_rate": "source_weekly_rate",
        }
    )

    # Aggregate vehicle features into one row per vehicle.
    feature_data = vehicle_features.merge(
        features[["id", "name"]].rename(
            columns={
                "id": "feature_id",
                "name": "feature_name",
            }
        ),
        on="feature_id",
        how="left",
        validate="many_to_one",
    )

    feature_data = (
        feature_data.groupby("vehicle_id")["feature_name"]
        .agg(
            lambda values: ", ".join(
                sorted(set(values.dropna().astype(str)))
            )
        )
        .rename("features")
        .reset_index()
    )

    # Calculate vehicle review statistics.
    review_data = reviews.groupby("vehicle_id").agg(
        average_rating=("rating", "mean"),
        review_count=("rating", "count"),
    ).reset_index()

    # Build the fleet table.
    fleet = vehicles.rename(
        columns={
            "id": "vehicle_id",
            "year": "vehicle_year",
            "mileage": "vehicle_mileage",
            "color": "vehicle_color",
        }
    )

    fleet = fleet.merge(
        model_data[
            [
                "model_ref_id",
                "category_id",
                "manufacturer_id",
                "model_name",
            ]
        ],
        left_on="model_id",
        right_on="model_ref_id",
        how="left",
        validate="many_to_one",
    )

    fleet = fleet.merge(
        manufacturer_data[["manufacturer_ref_id", "manufacturer"]],
        left_on="manufacturer_id",
        right_on="manufacturer_ref_id",
        how="left",
        validate="many_to_one",
    )

    fleet = fleet.merge(
        category_data[["category_ref_id", "category"]],
        left_on="category_id",
        right_on="category_ref_id",
        how="left",
        validate="many_to_one",
    )

    fleet = fleet.merge(
        fuel_data[["fuel_ref_id", "fuel_type"]],
        left_on="fuel_id",
        right_on="fuel_ref_id",
        how="left",
        validate="many_to_one",
    )

    fleet = fleet.merge(
        transmission_data[
            ["transmission_ref_id", "transmission"]
        ],
        left_on="transmission_id",
        right_on="transmission_ref_id",
        how="left",
        validate="many_to_one",
    )

    fleet = fleet.merge(
        status_data[["status_ref_id", "status"]],
        left_on="status_id",
        right_on="status_ref_id",
        how="left",
        validate="many_to_one",
    )

    fleet = fleet.merge(
        location_data[
            ["location_ref_id", "branch_name", "city", "state"]
        ],
        left_on="location_id",
        right_on="location_ref_id",
        how="left",
        validate="many_to_one",
    )

    fleet = fleet.merge(
        rate_data[
            [
                "category_id",
                "source_daily_rate",
                "source_hourly_rate",
                "source_weekly_rate",
            ]
        ],
        on="category_id",
        how="left",
        validate="many_to_one",
    )

    fleet = fleet.merge(
        feature_data,
        on="vehicle_id",
        how="left",
        validate="one_to_one",
    )

    fleet = fleet.merge(
        review_data,
        on="vehicle_id",
        how="left",
        validate="one_to_one",
    )

    # Do not export VINs, license plates, or customer information.
    fleet_columns = [
        "vehicle_id",
        "manufacturer",
        "model_name",
        "category",
        "vehicle_year",
        "vehicle_color",
        "fuel_type",
        "transmission",
        "vehicle_mileage",
        "status",
        "branch_name",
        "city",
        "state",
        "source_daily_rate",
        "source_hourly_rate",
        "source_weekly_rate",
        "features",
        "average_rating",
        "review_count",
    ]

    fleet = fleet[fleet_columns].copy()

    fleet["features"] = fleet["features"].fillna("")
    fleet["review_count"] = fleet["review_count"].fillna(0).astype(int)

    fleet_path = OUTPUT_DIR / "fleet_clean.csv"
    fleet.to_csv(fleet_path, index=False)

    print(f"Fleet saved: {fleet_path}")
    print(f"Fleet rows: {len(fleet)}")

    print("Preparing booking history...")

    booking_data = bookings.copy()

    for column in [
        "booking_date",
        "pickup_date",
        "dropoff_date",
    ]:
        booking_data[column] = pd.to_datetime(
            booking_data[column],
            errors="coerce",
        )

    # Calculate rental duration using calendar days.
    booking_data["duration_days"] = (
        booking_data["dropoff_date"].dt.normalize()
        - booking_data["pickup_date"].dt.normalize()
    ).dt.days

    # Time between reservation creation and pickup.
    booking_data["booking_lead_hours"] = (
        booking_data["pickup_date"] - booking_data["booking_date"]
    ).dt.total_seconds() / 3600

    booking_data.loc[
        booking_data["booking_lead_hours"] < 0,
        "booking_lead_hours",
    ] = float("nan")

    booking_data = booking_data.merge(
        fleet,
        left_on="vehicle_id",
        right_on="vehicle_id",
        how="left",
        validate="many_to_one",
        suffixes=("", "_vehicle"),
    )

    membership_data = memberships.rename(
        columns={
            "id": "membership_ref_id",
            "tier": "membership_tier",
            "discount_percent": "membership_discount_percent",
        }
    )

    customer_data = customers[
        ["id", "membership_id"]
    ].rename(
        columns={"id": "customer_ref_id"}
    )

    booking_data = booking_data.merge(
        customer_data,
        left_on="customer_id",
        right_on="customer_ref_id",
        how="left",
        validate="many_to_one",
    )

    booking_data = booking_data.merge(
        membership_data[
            [
                "membership_ref_id",
                "membership_tier",
                "membership_discount_percent",
            ]
        ],
        left_on="membership_id",
        right_on="membership_ref_id",
        how="left",
        validate="many_to_one",
    )

    discount_data = discounts.rename(
        columns={
            "id": "discount_ref_id",
            "percent": "booking_discount_percent",
        }
    )

    booking_data = booking_data.merge(
        discount_data[
            ["discount_ref_id", "booking_discount_percent"]
        ],
        left_on="discount_id",
        right_on="discount_ref_id",
        how="left",
        validate="many_to_one",
    )

    pickup_locations = location_data[
        ["location_ref_id", "city"]
    ].rename(
        columns={
            "location_ref_id": "pickup_location_id",
            "city": "pickup_city",
        }
    )

    dropoff_locations = location_data[
        ["location_ref_id", "city"]
    ].rename(
        columns={
            "location_ref_id": "dropoff_location_id",
            "city": "dropoff_city",
        }
    )

    booking_data = booking_data.merge(
        pickup_locations,
        on="pickup_location_id",
        how="left",
        validate="many_to_one",
    )

    booking_data = booking_data.merge(
        dropoff_locations,
        on="dropoff_location_id",
        how="left",
        validate="many_to_one",
    )

    # Exclude invalid records without silently inventing labels.
    valid_bookings = booking_data[
        booking_data["pickup_date"].notna()
        & booking_data["dropoff_date"].notna()
        & (booking_data["dropoff_date"] > booking_data["pickup_date"])
        & booking_data["vehicle_id"].notna()
        & booking_data["category"].notna()
    ].copy()

    history_columns = [
        "id",
        "customer_id",
        "vehicle_id",
        "booking_date",
        "pickup_date",
        "dropoff_date",
        "duration_days",
        "booking_lead_hours",
        "pickup_location_id",
        "dropoff_location_id",
        "pickup_city",
        "dropoff_city",
        "manufacturer",
        "model_name",
        "category",
        "vehicle_year",
        "fuel_type",
        "transmission",
        "vehicle_mileage",
        "source_daily_rate",
        "average_rating",
        "membership_tier",
        "membership_discount_percent",
        "booking_discount_percent",
    ]

    history = valid_bookings[history_columns].copy()

    history_path = OUTPUT_DIR / "booking_history_clean.csv"
    history.to_csv(history_path, index=False)

    print(f"Booking history saved: {history_path}")
    print(f"Original bookings: {len(bookings)}")
    print(f"Valid booking records: {len(history)}")
    print(f"Excluded booking records: {len(bookings) - len(history)}")

    # Create a summary for the next modeling step.
    summary = [
        "DRIVEX DATA PREPARATION SUMMARY",
        "=" * 40,
        f"Source vehicles: {len(vehicles)}",
        f"Cleaned fleet rows: {len(fleet)}",
        f"Source bookings: {len(bookings)}",
        f"Valid booking history rows: {len(history)}",
        f"Excluded booking rows: {len(bookings) - len(history)}",
        "",
        "Fleet missing values:",
        fleet.isna().sum().to_string(),
        "",
        "Booking history missing values:",
        history.isna().sum().to_string(),
        "",
        "Fleet status counts:",
        fleet["status"].value_counts(dropna=False).to_string(),
        "",
        "Categories:",
        fleet["category"].value_counts(dropna=False).to_string(),
        "",
        "Fuel types:",
        fleet["fuel_type"].value_counts(dropna=False).to_string(),
    ]

    summary_path = OUTPUT_DIR / "preparation_summary.txt"
    summary_path.write_text("\n".join(summary), encoding="utf-8")

    print(f"Summary saved: {summary_path}")
    print("\nData preparation completed successfully.")


if __name__ == "__main__":
    main()
