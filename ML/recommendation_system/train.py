"""Trains the AI recommender and saves it to ML/models/drivex_recommender.joblib.

Same data, split and hyper-parameters as ML/notebooks/drivex_ai_recommender.ipynb.
ALPHA is the blend weight the notebook selected on the validation set (section 8.1);
re-run the notebook to re-select it.

    python ML/recommendation_system/train.py
"""
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

from ai_recommender import RANDOM_STATE, CarRecommender, clean_cars

ML_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = ML_DIR / "data" / "raw" / "cornell" / "CarRentalDataV1_cleaned.csv"
MODEL_PATH = ML_DIR / "models" / "drivex_recommender.joblib"
ALPHA = 0.4


def train(path: Path = MODEL_PATH) -> CarRecommender:
    cars = clean_cars(pd.read_csv(DATA_PATH))
    train_ids, _ = train_test_split(cars["car_id"], test_size=0.30, random_state=RANDOM_STATE)
    model = CarRecommender(alpha=ALPHA).fit(cars, train_ids=train_ids)
    model.save(path)
    return model


if __name__ == "__main__":
    train()
    print(f"Saved {MODEL_PATH}")
