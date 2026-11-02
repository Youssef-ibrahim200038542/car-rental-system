<?php

namespace App\Services;

use App\Models\Car;
use Illuminate\Support\Collection;

/**
 * Content-based "similar cars": each car becomes a feature vector and
 * neighbours are ranked by cosine similarity to the target car.
 *
 * Vector layout:
 *   - one-hot category, one-hot fuel_type, one-hot transmission
 *   - seats, daily_rate and year, each min-max normalised to 0..1 over the
 *     cars being compared (so no single numeric column dominates)
 *
 * Cars in maintenance or inactive are never suggested; the target itself is
 * always excluded.
 */
class SimilarCarsService
{
    public const DEFAULT_LIMIT = 4;

    public const MAX_LIMIT = 8;

    /** Two daily rates within this share of each other count as "similar price". */
    private const SIMILAR_PRICE_TOLERANCE = 0.20;

    /**
     * @return Collection<int, array{car: Car, similarity: float, reasons: string[]}>
     */
    public function similarTo(Car $target, int $limit = self::DEFAULT_LIMIT): Collection
    {
        $limit = max(1, min(self::MAX_LIMIT, $limit));
        $target->loadMissing(['category', 'branch']);

        $candidates = Car::query()
            ->with(['category', 'branch'])
            ->whereKeyNot($target->getKey())
            ->whereNotIn('status', Car::UNBOOKABLE_STATUSES)
            ->get();

        if ($candidates->isEmpty()) {
            return collect();
        }

        $fleet = $candidates->concat([$target]);
        $ranges = [
            'seats' => $this->range($fleet, 'seats'),
            'daily_rate' => $this->range($fleet, 'daily_rate'),
            'year' => $this->range($fleet, 'year'),
        ];
        $vocabulary = [
            'category' => $fleet->pluck('category_id')->unique()->values()->all(),
            'fuel_type' => $fleet->pluck('fuel_type')->unique()->values()->all(),
            'transmission' => $fleet->pluck('transmission')->unique()->values()->all(),
        ];

        $targetVector = $this->vector($target, $vocabulary, $ranges);

        return $candidates
            ->map(fn (Car $car) => [
                'car' => $car,
                'raw' => $this->cosine($targetVector, $this->vector($car, $vocabulary, $ranges)),
                'price_gap' => abs((float) $car->daily_rate - (float) $target->daily_rate),
            ])
            ->sortBy([
                ['raw', 'desc'],
                ['price_gap', 'asc'],
                [fn ($row) => $row['car']->id, 'asc'],
            ])
            ->take($limit)
            ->map(fn ($row) => [
                'car' => $row['car'],
                'similarity' => round($row['raw'], 2),
                'reasons' => $this->reasons($target, $row['car']),
            ])
            ->values();
    }

    /** @return float[] */
    private function vector(Car $car, array $vocabulary, array $ranges): array
    {
        $vector = [];

        foreach ($vocabulary['category'] as $categoryId) {
            $vector[] = (int) $car->category_id === (int) $categoryId ? 1.0 : 0.0;
        }
        foreach ($vocabulary['fuel_type'] as $fuel) {
            $vector[] = $car->fuel_type === $fuel ? 1.0 : 0.0;
        }
        foreach ($vocabulary['transmission'] as $transmission) {
            $vector[] = $car->transmission === $transmission ? 1.0 : 0.0;
        }
        foreach ($ranges as $column => [$min, $max]) {
            $vector[] = $max > $min ? ((float) $car->{$column} - $min) / ($max - $min) : 0.0;
        }

        return $vector;
    }

    /** @return array{0: float, 1: float} */
    private function range(Collection $cars, string $column): array
    {
        $values = $cars->map(fn (Car $car) => (float) $car->{$column});

        return [(float) $values->min(), (float) $values->max()];
    }

    private function cosine(array $a, array $b): float
    {
        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($a as $i => $value) {
            $dot += $value * $b[$i];
            $normA += $value ** 2;
            $normB += $b[$i] ** 2;
        }

        if ($normA === 0.0 || $normB === 0.0) {
            return 0.0;
        }

        return max(0.0, min(1.0, $dot / (sqrt($normA) * sqrt($normB))));
    }

    /** @return string[] */
    private function reasons(Car $target, Car $car): array
    {
        $reasons = [];

        if ((int) $car->category_id === (int) $target->category_id) {
            $reasons[] = 'Same category ('.($car->category?->name ?? 'unknown').')';
        }
        if ($car->transmission === $target->transmission) {
            $reasons[] = "Same transmission ({$car->transmission})";
        }
        if ($car->fuel_type === $target->fuel_type) {
            $reasons[] = "Same fuel type ({$car->fuel_type})";
        }

        $rate = (float) $car->daily_rate;
        $targetRate = (float) $target->daily_rate;
        if ($targetRate > 0 && abs($rate - $targetRate) / $targetRate <= self::SIMILAR_PRICE_TOLERANCE) {
            $reasons[] = sprintf('Similar price (%s vs %s EGP/day)', number_format($rate), number_format($targetRate));
        }

        if ((int) $car->seats === (int) $target->seats) {
            $reasons[] = "Same number of seats ({$car->seats})";
        }

        if ($reasons === []) {
            $reasons[] = "{$car->brand} {$car->model}, {$car->seats} seats, ".number_format($rate).' EGP/day';
        }

        return $reasons;
    }
}
