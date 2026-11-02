<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecommendationEvent;
use App\Services\RecommendationScorer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RecommendationEventController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'request_id' => ['bail', 'required', 'uuid', Rule::exists('recommendation_events', 'request_id')
                ->where('event', 'impression')],
            'car_id' => ['bail', 'required', 'integer', Rule::exists('recommendation_events', 'car_id')
                ->where('event', 'impression')
                ->where('request_id', (string) $request->input('request_id'))],
            'event' => ['required', Rule::in(RecommendationEvent::CLIENT_EVENTS)],
            'position' => ['nullable', 'integer', 'min:1', 'max:'.RecommendationScorer::MAX_LIMIT],
        ], [
            'request_id.exists' => 'Unknown recommendation request.',
            'car_id.exists' => 'This car was not part of that recommendation request.',
        ]);

        // Default to the position the car was actually shown at.
        $position = $validated['position'] ?? RecommendationEvent::query()
            ->where('request_id', $validated['request_id'])
            ->where('car_id', $validated['car_id'])
            ->where('event', 'impression')
            ->value('position');

        RecommendationEvent::create([
            'request_id' => $validated['request_id'],
            'user_id' => auth('sanctum')->id(),
            'car_id' => $validated['car_id'],
            'event' => $validated['event'],
            'position' => $position,
        ]);

        return response()->json(['success' => true], 201);
    }
}
