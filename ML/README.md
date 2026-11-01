# DriveX recommendations: live system and offline research

This folder (together with `ML_old_backup/`) holds the **offline research**
behind DriveX recommendations. None of the Python here runs when a user asks
for a recommendation.

## What the app actually uses

`POST /api/ml/recommendations` and `POST /api/ai/recommendations` are both
served by **rule-based scoring in PHP** over the live `cars` table
(`backend/app/Services/RecommendationScorer.php`). Every recommended car is a
real row and can be booked.

- **Hard filters.** Cars in `maintenance` or `inactive` are never returned.
  When pickup and return dates are given, cars with an overlapping
  `pending`, `confirmed` or `active` booking are left out too.
- **Weighted score from 0 to 100.** The weights are budget fit 25,
  category 20, fuel 10, transmission 10, seats 10, branch 10, average review
  rating 10 and popularity (completed rentals) 5. A preference the user leaves
  empty doesn't count, so the score is the share of the applicable weight the
  car earned. Each criterion adds a readable entry to `reasons[]`.
- **Natural-language requests.** `/api/ai/recommendations` first converts the
  free-text message into the same filters (`PreferenceParser.php`). It uses
  Gemini when `GEMINI_API_KEY` is set and falls back to a keyword parser
  otherwise. The ranking is still done by the rule-based scorer.

No trained model is used in production. The research below explains why.

## Offline research

All runs use the Kaggle dataset **"Car Rental Sample Database 100k v2"**. It
was originally committed as `ML/car-rental-sample-database-100k-v2-csv.zip`
and is no longer tracked in git. It is synthetic US-style data, so its
vehicles, categories, fuel names (`gasoline`) and prices (currency
unconfirmed) do not match the DriveX fleet.

### 1. Booking ranker (`ML_old_backup/train_recommender.py`)

This task asks whether a model can rank the vehicle a customer actually
booked above vehicles they didn't book.

- The 100,000 bookings are split chronologically 70 / 15 / 15
  (train / validation / test), so the model never sees the future.
- Each booking is a candidate group: the booked vehicle plus sampled
  non-booked vehicles (3 per booking in training, 19 in validation, 49 in
  test).
- Model selection runs on validation recall@5. A random forest reached 0.639
  and logistic regression 0.295, so the random forest was selected.

Test results (`ML_old_backup/reports/training_metrics_v2.json`):

| Ranker | recall@5 | MRR | nDCG@5 |
|---|---|---|---|
| Random forest (selected) | **0.375** | 0.240 | 0.234 |
| Popularity baseline | 0.293 | 0.186 | 0.180 |
| Random ordering (expected) | 0.100 | n/a | n/a |

The random row is not stored in the metrics file. It is the expected value
for 1 positive among 50 candidates (5/50).

The model beats popularity by about 8 points of recall@5. That is a real but
modest gain, measured on sampled negatives (not confirmed rejections) over a
fleet that doesn't exist in DriveX. That is why it isn't deployed. The
earlier v1 run (`training_metrics.json`, SGD classifier with 80/20 split and
9 negatives) is kept for history.

### 2. Rating regressor: a negative result

This was a random forest that predicts a vehicle's average review rating
from its attributes (`ML_old_backup/reports/car_rating_metrics.json`). The
test set has 200 vehicles. MAE is 0.92 and RMSE 1.13, and **R² = -0.17**,
which is worse than predicting the mean rating. Vehicle attributes carry no
usable signal for ratings in this dataset. The script that trained it is not
in the repository; only its metrics remain.

### 3. Rule filter prototype (`ML/recommendation_system/recommend.py`)

This was a pandas filter over `fleet_clean.csv`. The API used to call it via
`Process`. That stopped because its vehicles are dataset rows, not DriveX
cars, so users couldn't book them. It is kept for reference only.

## Reproducing the research

```bash
cd ML
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 1. Download "Car Rental Sample Database 100k v2" from Kaggle and unzip
#    its CSVs into ML/data/ (bookings.csv, vehicles.csv, reviews.csv, ...)
python inspect_dataset.py      # writes data/dataset_report.txt
python prepare_dataset.py      # writes data/processed/{fleet_clean,booking_history_clean}.csv

# 2. train_recommender.py reads ML_old_backup/data/processed/, so copy the outputs there
mkdir -p ../ML_old_backup/data/processed
cp data/processed/*.csv ../ML_old_backup/data/processed/
python ../ML_old_backup/train_recommender.py   # writes models/*.joblib + reports/training_metrics_v2.json
```

## What is tracked in git

The scripts, `requirements.txt`, the small text reports
(`data/dataset_report.txt`, `data/processed/preparation_summary.txt`) and the
metrics JSON files are tracked. The raw and processed CSVs, the dataset zip,
`*.joblib` models and prediction CSVs are ignored (see the root
`.gitignore`). Regenerate them with the steps above.
