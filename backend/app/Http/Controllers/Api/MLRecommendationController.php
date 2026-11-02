<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RecommendationLogger;
use App\Services\RecommendationScorer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MLRecommendationController extends Controller
{
    public function recommend(Request $request, RecommendationScorer $scorer, RecommendationLogger $logger)
    {
        $request->merge([
            'fuel_type' => RecommendationScorer::normaliseFuelType($request->input('fuel_type')),
        ]);

        $validated = $request->validate([
            // bail + finite check first: JSON like 1e400 decodes to INF, which crashes the min/max rules.
            'budget' => ['bail', 'nullable', 'numeric', function ($attribute, $value, $fail) {
                if (! is_finite((float) $value)) {
                    $fail('The budget must be a finite number.');
                }
            }, 'min:0', 'max:1000000'],
            'category' => ['nullable', 'string', 'max:50'],
            'fuel_type' => ['nullable', Rule::in(RecommendationScorer::FUEL_TYPES)],
            'transmission' => ['nullable', Rule::in(RecommendationScorer::TRANSMISSIONS)],
            'seats' => ['nullable', 'integer', 'min:1', 'max:20'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'pickup_date' => ['nullable', 'date_format:Y-m-d', 'required_with:return_date'],
            'return_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:pickup_date', 'required_with:pickup_date'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:'.RecommendationScorer::MAX_LIMIT],
        ]);

        $served = $logger->serve($scorer->recommend($validated), auth('sanctum')->user());

        return response()->json([
            'success' => true,
            'data' => [
                'method' => 'rule-based-scoring',
                'request_id' => $served['request_id'],
                'explored' => $served['explored'],
                'recommendations' => $served['recommendations'],
            ],
        ]);
    }
}
