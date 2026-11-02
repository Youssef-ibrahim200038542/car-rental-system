# DriveX AI recommendations

The recommendation page and both recommendation endpoints are ranked by an **AI
model**: KNN retrieval + a gradient-boosting demand model. The model is built and
evaluated in [`notebooks/drivex_ai_recommender.ipynb`](notebooks/drivex_ai_recommender.ipynb).

## How a request flows

```text
Next.js /recommendations ──► Laravel POST /api/ml/recommendations   (or /api/ai/recommendations for free text)
                               │ 1. RecommendationScorer: only bookable cars (status + no overlapping booking)
                               │ 2. AIRanker ──HTTP──► Python service  POST :8001/rank
                               │                         ├─ hard constraints (budget, category, transmission, seats),
                               │                         │  relaxed step by step with a note when nothing matches
                               │                         ├─ KNN: nearest cars to the request (weighted features)
                               │                         └─ demand model: predicted popularity → final score
                               │ 3. HybridRecommender merges AI order + reasons with live review data
                               ◄── JSON  { method: "ai-knn-demand-hybrid", recommendations: [...] }
```

`score = α · similarity + (1 − α) · predicted_demand`, with **α = 0.4** chosen on
the validation set in the notebook (section 8.1).

**Fallback:** if the Python service is not running, slow (>3 s) or returns
something invalid, Laravel serves its rule-based scoring instead
(`method: "rule-based-scoring"`). The page shows which one was used, so the
site never breaks because of the ML service.

### Using the model on DriveX cars

The demand model was trained on the Cornell Car Rental Dataset (real US
listings, USD prices). `drivex_ranker.py` translates DriveX cars into that
feature space: SUV → `suv`, Minivan/Van → `minivan`, other categories → `car`,
petrol → `gasoline`, and each EGP price → the same **percentile** of the Cornell
price distribution, so no exchange rate is assumed. KNN runs on DriveX's own
columns (category, fuel, transmission, branch, price, seats).

## Files

| Path | What it is |
|---|---|
| `notebooks/drivex_ai_recommender.ipynb` | Full experiment: EDA, training, α tuning, test evaluation, explained outputs |
| `recommendation_system/ai_recommender.py` | Model: KNN retrieval + demand model (`CarRecommender`) |
| `recommendation_system/train.py` | Trains and saves `models/drivex_recommender.joblib` |
| `recommendation_system/drivex_ranker.py` | Applies the model to the live DriveX fleet |
| `service/app.py` | FastAPI service Laravel calls (`/health`, `/rank`) |
| `service/test_app.py` | Service tests |
| `data/raw/cornell/CarRentalDataV1_cleaned.csv` | Training data (Kaggle, CC BY 4.0, Kushlesh Kumar) |
| `eval/parser_golden.jsonl` | Labelled requests for the natural-language parser |
| `prepare_dataset.py` | Builds `data/processed/fleet_clean.csv` for `php artisan fleet:import` |

## Run it

```bash
# from the repository root
pip install -r ML/requirements.txt
python -m uvicorn app:app --app-dir ML/service --port 8001
```

The `.joblib` model is git-ignored. If it is missing, the service trains it on
start (about one second). To retrain by hand: `python ML/recommendation_system/train.py`.

Laravel finds the service through `AI_RECOMMENDER_URL` in `backend/.env`
(default `http://127.0.0.1:8001`; leave it empty to turn AI ranking off).

Tests:

```bash
python -m pytest ML/service          # Python service
cd backend && php artisan test       # includes AIRecommendationRankingTest (service faked)
```

## Natural-language requests

`/api/ai/recommendations` first converts the free-text message into the same
filters (`PreferenceParser.php`). It uses Gemini when `GEMINI_API_KEY` is set and
falls back to a keyword parser otherwise. The filters are then ranked by the AI
model exactly like the form.

### Parser details

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

## Limitations

- The demand model learned from US data from 2020. Its *patterns* (price level,
  make and year preferences) are transferred to DriveX, not its exact numbers.
- Test-set results (notebook section 8.2): NDCG@5 **0.475** vs 0.371 for KNN only,
  while 95.8% of recommendations still match the requested category and fuel.
- DriveX already logs impressions, clicks and bookings (`recommendation_events`).
  Once enough real interactions exist, retrain the demand model on them.
