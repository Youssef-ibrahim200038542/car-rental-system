<?php

namespace App\Services;

use App\Models\Car;
use App\Models\RecommendationEvent;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Turns a scored list into a served list: assigns a request_id, optionally
 * explores, numbers the positions and logs one impression per car.
 *
 * Why explore: if we only ever log the scorer's own ranking, every click is
 * confounded with position (people click what is on top). Occasionally swapping
 * one adjacent pair in the top results gives the logs cars seen at positions the
 * scorer would not have chosen, which is what later weight learning needs to
 * separate "good car" from "shown first". The swap is small, so users still get
 * a near-best list.
 */
class RecommendationLogger
{
    /** Exploration only reorders within this many top results. */
    private const EXPLORE_WINDOW = 6;

    /**
     * @param  Collection<int, array{car: Car, score: int, reasons: string[]}>  $rows
     * @return array{request_id: string, explored: bool, recommendations: Collection}
     */
    public function serve(Collection $rows, ?User $user): array
    {
        $requestId = (string) Str::uuid();
        $rows = $rows->values();

        $explored = $rows->count() >= 2 && $this->shouldExplore();
        if ($explored) {
            $rows = $this->swapOneAdjacentPair($rows);
        }

        $served = $rows->map(fn (array $row, int $index) => $row + ['position' => $index + 1]);

        $this->logImpressions($requestId, $served, $user);

        return [
            'request_id' => $requestId,
            'explored' => $explored,
            'recommendations' => $served,
        ];
    }

    private function shouldExplore(): bool
    {
        $rate = (float) config('services.recommendations.explore_rate', 0);

        if ($rate <= 0) {
            return false;
        }

        return $rate >= 1 || mt_rand() / mt_getrandmax() < $rate;
    }

    private function swapOneAdjacentPair(Collection $rows): Collection
    {
        $items = $rows->all();
        $i = random_int(0, min(self::EXPLORE_WINDOW, count($items)) - 2);

        [$items[$i], $items[$i + 1]] = [$items[$i + 1], $items[$i]];

        return collect($items);
    }

    private function logImpressions(string $requestId, Collection $served, ?User $user): void
    {
        if ($served->isEmpty()) {
            return;
        }

        $now = now();

        // insert() bypasses model casts, so features is encoded here.
        RecommendationEvent::insert($served->map(fn (array $row) => [
            'request_id' => $requestId,
            'user_id' => $user?->id,
            'car_id' => $row['car']->id,
            'event' => 'impression',
            'position' => $row['position'],
            'features' => json_encode([
                'score' => $row['score'],
                'criteria' => $row['features'] ?? null,
                'reasons' => $row['reasons'],
            ]),
            'created_at' => $now,
        ])->all());
    }
}
