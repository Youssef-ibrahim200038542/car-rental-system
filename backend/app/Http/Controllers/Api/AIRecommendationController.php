<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PreferenceParser;
use App\Services\RecommendationScorer;
use Illuminate\Http\Request;

class AIRecommendationController extends Controller
{
    public function parse(Request $request, PreferenceParser $parser)
    {
        $validated = $request->validate([
            'message' => 'required|string|min:3|max:1000',
        ]);

        $parsed = $parser->parse($validated['message']);

        return response()->json([
            'success' => true,
            'message' => 'Request understood successfully.',
            'data' => [
                'source' => $parsed['source'],
                'preferences' => $parsed['preferences'],
            ],
        ]);
    }

    public function recommend(Request $request, PreferenceParser $parser, RecommendationScorer $scorer)
    {
        $validated = $request->validate([
            'message' => 'required|string|min:3|max:1000',
        ]);

        $parsed = $parser->parse($validated['message']);

        return response()->json([
            'success' => true,
            'data' => [
                'method' => 'rule-based-scoring',
                'source' => $parsed['source'],
                'preferences' => $parsed['preferences'],
                'recommendations' => $scorer->recommend(PreferenceParser::toScorerInput($parsed['preferences'])),
            ],
        ]);
    }
}
