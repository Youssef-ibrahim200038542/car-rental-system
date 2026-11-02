<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HybridRecommender;
use App\Services\PreferenceParser;
use App\Services\RecommendationLogger;
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

    public function recommend(Request $request, PreferenceParser $parser, HybridRecommender $recommender, RecommendationLogger $logger)
    {
        $validated = $request->validate([
            'message' => 'required|string|min:3|max:1000',
        ]);

        $parsed = $parser->parse($validated['message']);
        $result = $recommender->recommend(PreferenceParser::toScorerInput($parsed['preferences']));
        $served = $logger->serve($result['rows'], auth('sanctum')->user());

        return response()->json([
            'success' => true,
            'data' => [
                'method' => $result['method'],
                'request_id' => $served['request_id'],
                'explored' => $served['explored'],
                'source' => $parsed['source'],
                'preferences' => $parsed['preferences'],
                'recommendations' => $served['recommendations'],
            ],
        ]);
    }
}
