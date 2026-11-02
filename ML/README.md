# DriveX recommendations: live system and offline research

This folder holds the **offline research** behind DriveX recommendations.
The evaluation results of the trained models are kept in `ML/research/`. None of the Python here runs when a user asks
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
  category 20, transmission 20, fuel 10, seats 10, branch 10, average review
  rating 10 and popularity (completed rentals) 5. Transmission weighs as much
  as category because many renters can only drive one kind. An unknown
  category name is ignored and reported in `reasons[]`. A preference the user leaves
  empty doesn't count, so the score is the share of the applicable weight the
  car earned. Each criterion adds a readable entry to `reasons[]`.
- **Natural-language requests.** `/api/ai/recommendations` first converts the
  free-text message into the same filters (`PreferenceParser.php`). It uses
  Gemini when `GEMINI_API_KEY` is set and falls back to a keyword parser
  otherwise. The ranking is still done by the rule-based scorer.

### Natural-language parsing

The keyword fallback (`KeywordPreferenceParser.php`, word lists in
`PreferenceLexicon.php`) reads English, Egyptian Arabic and Franco-Arabic:
Arabic-Indic digits, "ألف"/"alf"/"k" thousands, head counts ("4 أشخاص",
"4 afrad", "for 4"), durations ("3 ايام", "esbo3", "a week"), fuel,
transmission and category words. Gemini is asked for the same fields and its
answer is whitelisted; the call times out after 5 seconds and falls back to
keywords. The model is `GEMINI_MODEL` (see `backend/.env.example`).

The parsed `budget` is the amount the user stated; `budget_period` is `day`
when they said "per day" / "في اليوم" / "fel yom", else `total`. The scorer
compares daily rates, so the API turns it into a daily budget and explains
the choice in `preferences.notes`:

- per day: used as is;
- total with a known duration: divided by the number of days;
- total with no duration: used as a daily budget if it is 10,000 EGP or less,
  otherwise ignored (it is almost certainly a whole-trip total).

### Parser evaluation

`ML/eval/parser_golden.jsonl` holds 105 labelled requests (42 English, 37
Egyptian Arabic, 26 Franco-Arabic), including requests with no budget,
per-day vs total budgets, "for my family" with no number and typos. Run:

```bash
cd backend
php artisan recommendations:eval-parser --parser=keyword   # or gemini / both; add --json for the full report
```

It reports per-field precision/recall/F1 (a wrong value counts as both a
false positive and a false negative) and the exact-match rate (every field
right) overall and per language. Gemini is only scored when
`GEMINI_API_KEY` is set. Keyword parser, against the seeded categories
(`ML/research/parser_eval_keyword.json`):

| Field | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| budget | 1.000 | 0.889 | 0.941 | 36 |
| seats | 1.000 | 0.971 | 0.985 | 34 |
| duration | 1.000 | 1.000 | 1.000 | 57 |
| fuel_type | 1.000 | 1.000 | 1.000 | 26 |
| transmission | 0.917 | 0.917 | 0.917 | 24 |
| category | 1.000 | 0.981 | 0.990 | 52 |

| Language | Cases | Exact match | Micro F1 |
|---|---|---|---|
| English | 42 | 92.9% | 0.985 |
| Egyptian Arabic | 37 | 89.2% | 0.965 |
| Franco-Arabic | 26 | 96.2% | 0.981 |
| **All** | 105 | **92.4%** | 0.978 |

Read these numbers with care: the golden set was written by the same people
who wrote the keyword lists, so it is optimistic. The 8 misses are the
expected kind: a bare amount with no budget word ("what can I rent for
5000?"), a misspelt category ("luxery"), negation ("عادي مش اوتوماتيك" is
read as automatic), the dual form "لشخصين" and amounts glued to a prefix
("باجمالي ٦٠٠٠", "١٢ الف لاسبوع"). Add new real requests to the golden set
before changing the word lists.

No trained model is used in production. The research below explains why.

## Offline research

All runs use the Kaggle dataset **"Car Rental Sample Database 100k v2"**. It
was originally committed as `ML/car-rental-sample-database-100k-v2-csv.zip`
and is no longer tracked in git. It is synthetic US-style data, so its
vehicles, categories, fuel names (`gasoline`) and prices (currency
unconfirmed) do not match the DriveX fleet.

### 1. Booking ranker (`train_recommender.py`)

This task asks whether a model can rank the vehicle a customer actually
booked above vehicles they didn't book.

- The 100,000 bookings are split chronologically 70 / 15 / 15
  (train / validation / test), so the model never sees the future.
- Each booking is a candidate group: the booked vehicle plus sampled
  non-booked vehicles (3 per booking in training, 19 in validation, 49 in
  test).
- Model selection runs on validation recall@5. A random forest reached 0.639
  and logistic regression 0.295, so the random forest was selected.

Test results (`ML/research/training_metrics_v2.json`):

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
from its attributes (`ML/research/car_rating_metrics.json`). The
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

# 2. The training script was removed from the working tree with the old
#    ML_old_backup/ folder; restore it from git history to re-run training.
#    It reads ML_old_backup/data/processed/, so recreate that path for it.
git show caf051a:ML_old_backup/train_recommender.py > train_recommender.py
mkdir -p ../ML_old_backup/data/processed
cp data/processed/*.csv ../ML_old_backup/data/processed/
python train_recommender.py   # writes models/*.joblib + reports/training_metrics_v2.json
```

The original v1/v2 metrics this produced are saved in `ML/research/`
(`training_metrics.json`, `training_metrics_v2.json`, `car_rating_metrics.json`).

## What is tracked in git

The scripts, `requirements.txt`, the small text reports
(`data/dataset_report.txt`, `data/processed/preparation_summary.txt`) and the
metrics JSON files in `ML/research/` are tracked. The raw and processed CSVs, the dataset zip,
`*.joblib` models and prediction CSVs are ignored (see the root
`.gitignore`). Regenerate them with the steps above.
