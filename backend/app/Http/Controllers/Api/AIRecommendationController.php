<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PreferenceParser;
use App\Services\RecommendationLogger;
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

    public function recommend(Request $request, PreferenceParser $parser, RecommendationScorer $scorer, RecommendationLogger $logger)
    {
        $validated = $request->validate([
            'message' => 'required|string|min:3|max:1000',
        ]);

        $parsed = $parser->parse($validated['message']);
        $served = $logger->serve(
            $scorer->recommend(PreferenceParser::toScorerInput($parsed['preferences'])),
            auth('sanctum')->user(),
        );

        return response()->json([
            'success' => true,
            'data' => [
                'method' => 'rule-based-scoring',
                'request_id' => $served['request_id'],
                'explored' => $served['explored'],
                'source' => $parsed['source'],
                'preferences' => $parsed['preferences'],
                'recommendations' => $served['recommendations'],
            ],
        ]);
    }
}
