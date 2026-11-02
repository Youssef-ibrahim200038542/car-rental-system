<?php

namespace App\Services;

use App\Models\Car;
use Illuminate\Support\Collection;

/**
 * Entry point for every recommendation request.
 *
 * 1. RecommendationScorer loads the bookable cars (status + date checks) and
 *    gives each a rule-based score.
 * 2. AIRanker sends those same cars to the Python AI service, which re-ranks
 *    them with KNN + the learned demand model.
 * 3. If the AI service is off or fails, the rule-based order is served instead,
 *    so the website never breaks because of the ML service.
 */
class HybridRecommender
{
    public const METHOD_AI = 'ai-knn-demand-hybrid';

    public const METHOD_RULES = 'rule-based-scoring';

    public function __construct(
        private readonly RecommendationScorer $scorer,
        private readonly AIRanker $ai,
    ) {}

    /**
     * @return array{method: string, rows: Collection<int, array{car: Car, score: int, reasons: string[], features: array}>}
     */
    public function recommend(array $preferences): array
    {
        ['criteria' => $criteria, 'rows' => $rows] = $this->scorer->scoreCandidates($preferences);

        $ranking = $this->ai->rank($this->aiPreferences($criteria), $rows, $criteria['limit']);

        if ($ranking === null) {
            return [
                'method' => self::METHOD_RULES,
                'rows' => RecommendationScorer::sortByScore($rows)->take($criteria['limit'])->values(),
            ];
        }

        $byId = $rows->keyBy(fn (array $row) => $row['car']->id);

        $ranked = collect($ranking)
            ->filter(fn (array $item) => $byId->has($item['id']))
            ->unique('id')
            ->take($criteria['limit'])
            ->map(function (array $item) use ($byId, $criteria) {
                $rule = $byId[$item['id']];

                return [
                    'car' => $rule['car'],
                    'score' => (int) round(max(0, min(1, (float) $item['score'])) * 100),
                    'reasons' => $this->reasons($item['reasons'], $rule, $criteria),
                    'features' => ($rule['features'] ?? []) + [
                        'rule_score' => $rule['score'],
                        'ai_similarity' => (float) ($item['similarity_score'] ?? 0),
                        'ai_demand' => (float) ($item['demand_score'] ?? 0),
                    ],
                ];
            })
            ->values();

        return ['method' => self::METHOD_AI, 'rows' => $ranked];
    }

    /** The AI service speaks plain values; the scorer's criteria hold models. */
    private function aiPreferences(array $criteria): array
    {
        return [
            'budget' => $criteria['budget'],
            'category' => $criteria['category']?->name,
            'fuel_type' => $criteria['fuel_type'],
            'transmission' => $criteria['transmission'],
            'seats' => $criteria['seats'],
            'branch_id' => $criteria['branch_id'],
        ];
    }

    /** AI reasons first, then live facts only our database knows (reviews), plus the unknown-category note. */
    private function reasons(array $aiReasons, array $rule, array $criteria): array
    {
        $reasons = array_values(array_filter($aiReasons, 'is_string'));

        if (isset($rule['criterion_reasons']['rating'])) {
            $reasons[] = $rule['criterion_reasons']['rating'];
        }

        if ($criteria['unknown_category'] !== null) {
            $reasons[] = "Category '{$criteria['unknown_category']}' not found — ignored";
        }

        return $reasons;
    }
}
