<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'budget' => 'nullable|numeric|min:0',
            'seats' => 'nullable|integer|min:1',
            'fuel_type' => 'nullable|in:petrol,diesel,hybrid,electric',
            'duration' => 'nullable|integer|min:1',
            'category_id' => 'nullable|exists:car_categories,id',
        ]);

        $cars = Car::with([
            'category',
            'branch',
        ])
        ->where('status', 'available')
        ->get();

        $duration = $validated['duration'] ?? 1;
        $budget = isset($validated['budget'])
            ? (float) $validated['budget']
            : null;

        $recommendations = $cars->map(function ($car) use ($validated, $duration, $budget) {

            $score = 0;
            $reasons = [];

            $dailyRate = (float) $car->daily_rate;
            $estimatedTotal = $dailyRate * $duration;

            /*
            |--------------------------------------------------------------------------
            | Budget
            |--------------------------------------------------------------------------
            */

            if ($budget !== null) {

                if ($estimatedTotal <= $budget) {

                    $score += 40;
                    $reasons[] = 'Fits your budget';

                } else {

                    $difference = $estimatedTotal - $budget;

                    $differencePercentage = $budget > 0
                        ? ($difference / $budget) * 100
                        : 100;

                    if ($differencePercentage <= 10) {
                        $score += 20;
                        $reasons[] = 'Slightly above your budget';
                    } elseif ($differencePercentage <= 25) {
                        $score += 10;
                        $reasons[] = 'Close to your budget';
                    } else {
                        $score += 0;
                        $reasons[] = 'Above your budget';
                    }
                }
            } else {
                $score += 20;
            }

            /*
            |--------------------------------------------------------------------------
            | Seats
            |--------------------------------------------------------------------------
            */

            if (isset($validated['seats'])) {

                if ($car->seats >= $validated['seats']) {

                    $score += 25;
                    $reasons[] = 'Enough seats for your group';

                } else {

                    $score -= 20;
                    $reasons[] = 'Not enough seats for your group';
                }
            } else {
                $score += 15;
            }

            /*
            |--------------------------------------------------------------------------
            | Fuel Type
            |--------------------------------------------------------------------------
            */

            if (isset($validated['fuel_type'])) {

                if ($car->fuel_type === $validated['fuel_type']) {

                    $score += 20;
                    $reasons[] = 'Matches your preferred fuel type';
                }
            } else {
                $score += 10;
            }

            /*
            |--------------------------------------------------------------------------
            | Category
            |--------------------------------------------------------------------------
            */

            if (isset($validated['category_id'])) {

                if ($car->category_id == $validated['category_id']) {

                    $score += 10;
                    $reasons[] = 'Matches your preferred car category';
                }
            } else {
                $score += 5;
            }

            /*
            |--------------------------------------------------------------------------
            | Rental Duration
            |--------------------------------------------------------------------------
            */

            if ($duration >= 7) {

                if (in_array($car->fuel_type, ['hybrid', 'electric'])) {

                    $score += 5;
                    $reasons[] = 'Good choice for a longer rental';
                }
            }

            return [
                'car' => $car,
                'score' => max(0, min(100, $score)),
                'reasons' => $reasons,
                'estimated_total' => round($estimatedTotal, 2),
                'within_budget' => $budget !== null
                    ? $estimatedTotal <= $budget
                    : true,
            ];
        });

        /*
        |--------------------------------------------------------------------------
        | Separate cars within budget from alternatives
        |--------------------------------------------------------------------------
        */

        if ($budget !== null) {

            $withinBudget = $recommendations
                ->filter(function ($recommendation) {
                    return $recommendation['within_budget'];
                })
                ->sortByDesc('score')
                ->values();

            if ($withinBudget->isNotEmpty()) {

                return response()->json([
                    'success' => true,
                    'message' => 'Cars matching your requirements',
                    'budget_match' => true,
                    'data' => $withinBudget,
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | No cars within budget
            |--------------------------------------------------------------------------
            */

            $alternatives = $recommendations
                ->sortBy(function ($recommendation) use ($budget) {
                    return abs($recommendation['estimated_total'] - $budget);
                })
                ->values();

            return response()->json([
                'success' => true,
                'message' => 'No cars match your budget. Here are the closest alternatives.',
                'budget_match' => false,
                'data' => $alternatives,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | No budget provided
        |--------------------------------------------------------------------------
        */

        $recommendations = $recommendations
            ->sortByDesc('score')
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Car recommendations generated successfully',
            'budget_match' => null,
            'data' => $recommendations,
        ]);
    }
}
