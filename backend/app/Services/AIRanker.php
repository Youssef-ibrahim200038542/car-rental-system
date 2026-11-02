<?php

namespace App\Services;

use App\Models\Car;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * HTTP client for the Python AI recommendation service (ML/service/app.py).
 *
 * The service ranks the cars we send with KNN retrieval plus a demand model
 * trained in ML/notebooks/drivex_ai_recommender.ipynb. It never sees cars that
 * are unavailable: Laravel applies status and date checks first.
 *
 * Returns null whenever the service is not configured, unreachable, slow or
 * returns something unexpected, so the caller can fall back to rule-based scoring.
 */
class AIRanker
{
    public function isEnabled(): bool
    {
        return trim((string) config('services.ai_recommender.url')) !== '';
    }

    /**
     * @param  array<string, mixed>  $preferences  budget, category, fuel_type, transmission, seats, branch_id
     * @param  Collection<int, array{car: Car}>  $rows
     * @return list<array{id: int, score: float, similarity_score: float, demand_score: float, reasons: string[]}>|null
     */
    public function rank(array $preferences, Collection $rows, int $limit): ?array
    {
        if (! $this->isEnabled() || $rows->isEmpty()) {
            return null;
        }

        $payload = [
            'preferences' => array_filter($preferences, fn ($value) => $value !== null && $value !== ''),
            'cars' => $rows->map(fn (array $row) => [
                'id' => $row['car']->id,
                'brand' => $row['car']->brand,
                'model' => $row['car']->model,
                'year' => (int) $row['car']->year,
                'category' => $row['car']->category?->name,
                'fuel_type' => $row['car']->fuel_type,
                'transmission' => $row['car']->transmission,
                'seats' => (int) $row['car']->seats,
                'daily_rate' => (float) $row['car']->daily_rate,
                'branch_id' => $row['car']->branch_id,
            ])->values()->all(),
            'limit' => $limit,
        ];

        try {
            $response = Http::baseUrl(rtrim((string) config('services.ai_recommender.url'), '/'))
                ->timeout((float) config('services.ai_recommender.timeout', 3))
                ->acceptJson()
                ->post('/rank', $payload);
        } catch (Throwable $e) {
            Log::warning('AI recommender unreachable, using rule-based scoring.', ['error' => $e->getMessage()]);

            return null;
        }

        $ranking = $response->successful() ? $response->json('ranking') : null;

        if (! is_array($ranking) || ! $this->isValid($ranking)) {
            Log::warning('AI recommender returned an unusable response, using rule-based scoring.', [
                'status' => $response->status(),
            ]);

            return null;
        }

        return $ranking;
    }

    private function isValid(array $ranking): bool
    {
        foreach ($ranking as $item) {
            if (! is_array($item)
                || ! isset($item['id'], $item['score'], $item['reasons'])
                || ! is_numeric($item['score'])
                || ! is_array($item['reasons'])) {
                return false;
            }
        }

        return true;
    }
}
