<?php

namespace App\Services;

use App\Models\Car;
use App\Models\CarCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Rule-based recommender over the live fleet.
 *
 * Hard filters (a car is never returned if it fails one):
 *   - status is maintenance or inactive
 *   - pickup/return dates given and the car has an overlapping
 *     pending / confirmed / active booking
 *
 * Every other preference is soft: it adds to the score when it matches and
 * produces a reason either way. The score is the share of applicable weight
 * a car earned, scaled to 0-100. Preferences the user left empty are not
 * applicable, so they neither help nor hurt.
 */
class RecommendationScorer
{
    public const DEFAULT_LIMIT = 6;

    public const MAX_LIMIT = 20;

    public const FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'];

    public const TRANSMISSIONS = ['manual', 'automatic'];

    private const WEIGHTS = [
        'budget' => 25,
        'category' => 20,
        'fuel_type' => 10,
        'transmission' => 20,
        'seats' => 10,
        'branch' => 10,
        'rating' => 10,
        'popularity' => 5,
    ];

    private const FUEL_SYNONYMS = [
        'gasoline' => 'petrol',
        'gas' => 'petrol',
        'benzine' => 'petrol',
        'ev' => 'electric',
    ];

    public static function normaliseFuelType(?string $fuelType): ?string
    {
        if ($fuelType === null || trim($fuelType) === '') {
            return null;
        }

        $value = strtolower(trim($fuelType));

        return self::FUEL_SYNONYMS[$value] ?? $value;
    }

    public static function findCategoryByName(?string $name): ?CarCategory
    {
        if ($name === null || trim($name) === '') {
            return null;
        }

        return CarCategory::query()
            ->whereRaw('LOWER(name) = ?', [strtolower(trim($name))])
            ->first();
    }

    /**
     * @param  array{budget?: float|int|null, category?: string|null, fuel_type?: string|null,
     *               transmission?: string|null, seats?: int|null, branch_id?: int|null,
     *               pickup_date?: string|null, return_date?: string|null, limit?: int|null}  $preferences
     * @return Collection<int, array{car: Car, score: int, reasons: string[], features: array<string, float>}> features: the fraction of each applicable criterion's weight the car earned
     */
    public function recommend(array $preferences): Collection
    {
        ['criteria' => $criteria, 'rows' => $rows] = $this->scoreCandidates($preferences);

        return self::sortByScore($rows)->take($criteria['limit'])->values();
    }

    /**
     * Every bookable car with its rule-based score, unsorted, plus the normalised criteria.
     * The AI ranker re-orders these same rows, so both rankers see exactly the same candidates.
     *
     * @return array{criteria: array<string, mixed>, rows: Collection<int, array>}
     */
    public function scoreCandidates(array $preferences): array
    {
        $criteria = $this->normalise($preferences);

        $cars = $this->candidateCars($criteria);
        $maxCompleted = max(1, (int) $cars->max('completed_bookings_count'));

        return [
            'criteria' => $criteria,
            'rows' => $cars->map(fn (Car $car) => $this->score($car, $criteria, $maxCompleted))->values(),
        ];
    }

    public static function sortByScore(Collection $rows): Collection
    {
        return $rows->sortBy([
            ['score', 'desc'],
            [fn ($row) => (float) $row['car']->daily_rate, 'asc'],
        ])->values();
    }

    private function normalise(array $preferences): array
    {
        $limit = (int) ($preferences['limit'] ?? self::DEFAULT_LIMIT);

        $categoryName = isset($preferences['category']) ? trim($preferences['category']) : '';
        $category = self::findCategoryByName($categoryName);

        return [
            'budget' => isset($preferences['budget']) ? (float) $preferences['budget'] : null,
            'category' => $category,
            'unknown_category' => $category === null && $categoryName !== '' ? $categoryName : null,
            'fuel_type' => self::normaliseFuelType($preferences['fuel_type'] ?? null),
            'transmission' => isset($preferences['transmission'])
                ? strtolower($preferences['transmission'])
                : null,
            'seats' => isset($preferences['seats']) ? (int) $preferences['seats'] : null,
            'branch_id' => isset($preferences['branch_id']) ? (int) $preferences['branch_id'] : null,
            'pickup_date' => $preferences['pickup_date'] ?? null,
            'return_date' => $preferences['return_date'] ?? null,
            'limit' => max(1, min(self::MAX_LIMIT, $limit)),
        ];
    }

    private function candidateCars(array $criteria): Collection
    {
        $query = Car::query()
            ->with(['category', 'branch'])
            ->withAvg('reviews', 'rating')
            ->withCount([
                'reviews',
                'bookings as completed_bookings_count' => fn (Builder $q) => $q->where('status', 'completed'),
            ])
            ->whereNotIn('status', Car::UNBOOKABLE_STATUSES);

        if ($criteria['pickup_date'] && $criteria['return_date']) {
            $query->whereDoesntHave('bookings', fn (Builder $q) => $q->blocking($criteria['pickup_date'], $criteria['return_date']));
        }

        return $query->get();
    }

    private function score(Car $car, array $criteria, int $maxCompleted): array
    {
        $results = array_filter([
            'budget' => $this->scoreBudget($car, $criteria['budget']),
            'category' => $this->scoreCategory($car, $criteria['category']),
            'fuel_type' => $this->scoreExact('fuel type', $car->fuel_type, $criteria['fuel_type']),
            'transmission' => $this->scoreExact('transmission', $car->transmission, $criteria['transmission']),
            'seats' => $this->scoreSeats($car, $criteria['seats']),
            'branch' => $this->scoreBranch($car, $criteria['branch_id']),
            'rating' => $this->scoreRating($car),
            'popularity' => $this->scorePopularity($car, $maxCompleted),
        ]);

        $earned = 0.0;
        $applicable = 0;
        $reasons = [];
        $features = [];
        $criterionReasons = [];

        foreach ($results as $criterion => [$fraction, $reason]) {
            $earned += self::WEIGHTS[$criterion] * $fraction;
            $applicable += self::WEIGHTS[$criterion];
            $reasons[] = $reason;
            $features[$criterion] = round($fraction, 4);
            $criterionReasons[$criterion] = $reason;
        }

        // An unknown category is reported rather than silently dropped; it carries no weight.
        if ($criteria['unknown_category'] !== null) {
            $reasons[] = "Category '{$criteria['unknown_category']}' not found — ignored";
        }

        return [
            'car' => $car,
            'score' => (int) round($earned / $applicable * 100),
            'reasons' => $reasons,
            'features' => $features,
            'criterion_reasons' => $criterionReasons,
        ];
    }

    /** @return array{0: float, 1: string}|null  [fraction of the weight earned, reason], or null when not applicable */
    private function scoreBudget(Car $car, ?float $budget): ?array
    {
        if ($budget === null) {
            return null;
        }

        $rate = (float) $car->daily_rate;

        if ($rate <= $budget) {
            return [1.0, sprintf('Within your budget (%s EGP/day)', number_format($rate))];
        }

        $over = $budget > 0 ? ($rate - $budget) / $budget : 1.0;
        $fraction = match (true) {
            $over <= 0.10 => 0.5,
            $over <= 0.25 => 0.25,
            default => 0.0,
        };

        return [$fraction, sprintf('%d%% over your budget (%s EGP/day)', (int) ceil($over * 100), number_format($rate))];
    }

    private function scoreCategory(Car $car, ?CarCategory $category): ?array
    {
        if ($category === null) {
            return null;
        }

        return (int) $car->category_id === $category->id
            ? [1.0, "Matches your category ({$category->name})"]
            : [0.0, 'Different category ('.($car->category?->name ?? 'unknown').')'];
    }

    private function scoreExact(string $label, ?string $actual, ?string $wanted): ?array
    {
        if ($wanted === null) {
            return null;
        }

        return strtolower((string) $actual) === $wanted
            ? [1.0, ucfirst($label).": {$actual}, as requested"]
            : [0.0, ucfirst($label).": {$actual}, not {$wanted}"];
    }

    private function scoreSeats(Car $car, ?int $seats): ?array
    {
        if ($seats === null) {
            return null;
        }

        return $car->seats >= $seats
            ? [1.0, "Seats {$car->seats} (you need {$seats})"]
            : [0.0, "Only {$car->seats} seats (you need {$seats})"];
    }

    private function scoreBranch(Car $car, ?int $branchId): ?array
    {
        if ($branchId === null) {
            return null;
        }

        $branchName = $car->branch?->name ?? 'another branch';

        return (int) $car->branch_id === $branchId
            ? [1.0, "At your chosen branch ({$branchName})"]
            : [0.0, "Located at {$branchName}"];
    }

    private function scoreRating(Car $car): array
    {
        if ((int) $car->reviews_count === 0) {
            return [0.5, 'No reviews yet'];
        }

        $average = (float) $car->reviews_avg_rating;

        return [$average / 5, sprintf('Rated %.1f/5 from %d review(s)', $average, $car->reviews_count)];
    }

    private function scorePopularity(Car $car, int $maxCompleted): array
    {
        $completed = (int) $car->completed_bookings_count;

        return [$completed / $maxCompleted, "{$completed} completed rental(s)"];
    }
}
