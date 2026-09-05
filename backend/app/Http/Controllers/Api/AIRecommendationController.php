<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIRecommendationController extends Controller
{
    private function getGeminiPreferences(string $message, string $apiKey): array
    {
        $prompt = <<<PROMPT
You are an intelligent car rental assistant.

Your job is to understand the user's natural-language car rental request and extract the user's preferences.

The user may use:
- Different sentence structures
- Synonyms
- Casual English
- Short sentences
- Multiple requirements in one sentence
- Different ways of describing duration, budget, passengers, car type, or fuel

DO NOT require the user to follow a specific sentence format.

Extract ONLY these five fields:

1. budget
Maximum total rental budget as a number.
If the user does not mention a budget, return null.

2. seats
Required number of seats/passengers as an integer.
If the user does not mention the number of passengers/seats, return null.

3. duration
Rental duration in days as an integer.
If the user does not mention a duration, return null.

4. fuel_type
Must be exactly one of:
- petrol
- diesel
- hybrid
- electric
- null

5. category
Must be exactly one of:
- economy
- sedan
- suv
- luxury
- null

========================================
DURATION UNDERSTANDING
========================================

Understand all common ways users describe rental duration.

Examples:

"one day" = 1
"a day" = 1
"for a day" = 1
"tomorrow" = 1

"two days" = 2
"for two days" = 2

"three days" = 3
"for three days" = 3

"four days" = 4
"five days" = 5
"six days" = 6

"one week" = 7
"a week" = 7
"for a week" = 7
"seven days" = 7

"two weeks" = 14
"a couple of weeks" = 14

"one month" = 30
"a month" = 30
"for a month" = 30

If the user says:
"for about a week"
"around one week"
"approximately a week"

return 7.

If the user says "for a few days" and no exact number is given, return null.

========================================
PASSENGERS / SEATS
========================================

Understand different ways users describe passengers.

Examples:

"for 2 people" = 2
"2 passengers" = 2
"two people" = 2
"two passengers" = 2
"for myself" = 1
"for me" = 1
"for a couple" = 2
"for two of us" = 2

"family of 4" = 4
"family of five" = 5
"for my family of 5" = 5

If the user explicitly gives a number of people/passengers, use that number.

Do not invent a number if the user only says:
"for my family"
"for a group"
"for friends"

without giving a number.

========================================
CATEGORY UNDERSTANDING
========================================

Map different descriptions to the closest category.

ECONOMY:
- economy
- economical
- cheap
- cheapest
- affordable
- budget car
- inexpensive
- low cost
- small car
- compact car
- fuel efficient car

SEDAN:
- sedan
- saloon
- family sedan
- comfortable sedan
- four-door sedan

SUV:
- SUV
- suv
- sport utility vehicle
- 4x4
- four by four
- jeep
- crossover
- family SUV
- spacious SUV
- large SUV

LUXURY:
- luxury
- luxurious
- premium
- high-end
- executive
- expensive
- prestige

If the user says "comfortable car", do NOT automatically assume luxury.
If no clear category can be determined, return null.

If the user says "family car" without another category, return null unless the request clearly implies an SUV.

========================================
FUEL TYPE
========================================

Map:

petrol:
- petrol
- gasoline
- gas

diesel:
- diesel

hybrid:
- hybrid

electric:
- electric
- EV
- electric vehicle
- fully electric

If the user says:
"any fuel"
"fuel doesn't matter"
"I don't care about fuel"

return null.

========================================
BUDGET
========================================

Extract the maximum total rental budget.

Examples:

"My budget is 15000" = 15000

"I can spend 15000" = 15000

"up to 15000" = 15000

"maximum 15000" = 15000

"no more than 15000" = 15000

"I don't want to spend more than 15000" = 15000

"around 15000" = 15000

"about 15000" = 15000

"approximately 15000" = 15000

If the user says "around", "about", or "approximately", use the numerical value mentioned.

If the user does not mention a budget, return null.

Do not invent a budget.

========================================
IMPORTANT RULES
========================================

1. Understand the meaning of the entire request, not just exact keywords.

2. Users do NOT need to use a specific sentence structure.

3. Understand synonyms and natural English.

4. Never invent information that the user did not provide.

5. If a preference is unclear, return null instead of guessing.

6. Return only the five requested fields.

7. Do not return explanations.

8. Do not return additional fields.

9. Always return valid JSON.

10. Use null when information is missing or unclear.

========================================
EXAMPLES
========================================

User:
"I need a cheap car for a couple for a day."

Return:
{
    "budget": null,
    "seats": 2,
    "duration": 1,
    "fuel_type": null,
    "category": "economy"
}

User:
"Looking for something affordable for 5 people for a week. I can spend up to 15000."

Return:
{
    "budget": 15000,
    "seats": 5,
    "duration": 7,
    "fuel_type": null,
    "category": "economy"
}

User:
"I need a spacious SUV for my family of 6 for two weeks."

Return:
{
    "budget": null,
    "seats": 6,
    "duration": 14,
    "fuel_type": null,
    "category": "suv"
}

User:
"I want a hybrid vehicle for 4 people for 3 days."

Return:
{
    "budget": null,
    "seats": 4,
    "duration": 3,
    "fuel_type": "hybrid",
    "category": null
}

User:
"I need a premium sedan for 3 days."

Return:
{
    "budget": null,
    "seats": null,
    "duration": 3,
    "fuel_type": null,
    "category": "luxury"
}

User:
"Give me an electric car for tomorrow."

Return:
{
    "budget": null,
    "seats": null,
    "duration": 1,
    "fuel_type": "electric",
    "category": null
}

User:
"I don't care about the fuel type. I need a sedan for 4 people."

Return:
{
    "budget": null,
    "seats": 4,
    "duration": null,
    "fuel_type": null,
    "category": "sedan"
}

========================================
OUTPUT FORMAT
========================================

Return ONLY valid JSON in exactly this format:

{
    "budget": null,
    "seats": null,
    "duration": null,
    "fuel_type": null,
    "category": null
}

User request:
$message
PROMPT;

        $response = Http::connectTimeout(5)
            ->timeout(15)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'x-goog-api-key' => $apiKey,
            ])
            ->post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
                [
                    'contents' => [
                        [
                            'parts' => [
                                [
                                    'text' => $prompt,
                                ],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature' => 0.1,
                    ],
                ]
            );

        if (!$response->successful()) {
            throw new \Exception(
                'Gemini API error: ' . $response->body()
            );
        }

        $result = $response->json();

        $text = data_get(
            $result,
            'candidates.0.content.parts.0.text'
        );

        if (!$text) {
            throw new \Exception(
                'Gemini returned an empty response.'
            );
        }

        $preferences = json_decode($text, true);

        if (!is_array($preferences)) {
            throw new \Exception(
                'Invalid JSON returned by Gemini.'
            );
        }

        return [
            'budget' => isset($preferences['budget'])
                && is_numeric($preferences['budget'])
                ? (float) $preferences['budget']
                : null,

            'seats' => isset($preferences['seats'])
                && is_numeric($preferences['seats'])
                ? (int) $preferences['seats']
                : null,

            'duration' => isset($preferences['duration'])
                && is_numeric($preferences['duration'])
                ? (int) $preferences['duration']
                : null,

            'fuel_type' => in_array(
                strtolower((string) ($preferences['fuel_type'] ?? '')),
                ['petrol', 'diesel', 'hybrid', 'electric']
            )
                ? strtolower($preferences['fuel_type'])
                : null,

            'category' => in_array(
                strtolower((string) ($preferences['category'] ?? '')),
                ['economy', 'sedan', 'suv', 'luxury']
            )
                ? strtolower($preferences['category'])
                : null,
        ];
    }


    public function parse(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|min:3|max:1000',
        ]);

        $apiKey = env('GEMINI_API_KEY');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Gemini API key is not configured.',
            ], 500);
        }

        try {

            $preferences = $this->getGeminiPreferences(
                $validated['message'],
                $apiKey
            );

            $categoryMap = [
                'economy' => 1,
                'sedan' => 2,
                'suv' => 3,
                'luxury' => 4,
            ];

            $category = $preferences['category'];

            $preferences['category_id'] = $category
                ? ($categoryMap[strtolower($category)] ?? null)
                : null;

            return response()->json([
                'success' => true,
                'message' => 'Request understood successfully.',
                'data' => $preferences,
            ]);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong while processing your request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function recommend(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|min:3|max:1000',
        ]);

        $apiKey = env('GEMINI_API_KEY');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Gemini API key is not configured.',
            ], 500);
        }

        try {

            // ==========================================
            // 1. Understand user's natural language
            // ==========================================

            $preferences = $this->getGeminiPreferences(
                $validated['message'],
                $apiKey
            );

            // ==========================================
            // 2. Convert category to database ID
            // ==========================================

            $categoryMap = [
                'economy' => 1,
                'sedan' => 2,
                'suv' => 3,
                'luxury' => 4,
            ];

            $category = $preferences['category'];

            $categoryId = $category
                ? ($categoryMap[strtolower($category)] ?? null)
                : null;

            $budget = $preferences['budget'];
            $seats = $preferences['seats'];
            $duration = $preferences['duration'] ?? 1;
            $fuelType = $preferences['fuel_type'];

            // ==========================================
            // 3. Get available cars
            // ==========================================

            $cars = Car::with([
                'category',
                'branch',
            ])
            ->where('status', 'available')
            ->get();

            // ==========================================
            // 4. Calculate recommendation score
            // ==========================================

            $recommendations = $cars->map(function ($car) use (
                $budget,
                $seats,
                $duration,
                $fuelType,
                $categoryId
            ) {

                $score = 0;
                $reasons = [];

                $dailyRate = (float) $car->daily_rate;

                $estimatedTotal = $dailyRate * $duration;

                // ------------------------------
                // Budget
                // ------------------------------

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

                            $reasons[] = 'Above your budget';
                        }
                    }

                } else {

                    $score += 20;
                }

                // ------------------------------
                // Seats
                // ------------------------------

                if ($seats !== null) {

                    if ($car->seats >= $seats) {

                        $score += 25;
                        $reasons[] = 'Enough seats for your group';

                    } else {

                        $score -= 20;
                        $reasons[] = 'Not enough seats for your group';
                    }

                } else {

                    $score += 15;
                }

                // ------------------------------
                // Fuel type
                // ------------------------------

                if ($fuelType !== null) {

                    if (strtolower($car->fuel_type) === $fuelType) {

                        $score += 20;
                        $reasons[] = 'Matches your preferred fuel type';

                    } else {

                        $score -= 10;
                        $reasons[] = 'Different fuel type';
                    }

                } else {

                    $score += 10;
                }

                // ------------------------------
                // Car category
                // ------------------------------

                if ($categoryId !== null) {

                    if ((int) $car->category_id === (int) $categoryId) {

                        $score += 10;
                        $reasons[] = 'Matches your preferred car category';

                    } else {

                        $score -= 5;
                    }

                } else {

                    $score += 5;
                }

                // ------------------------------
                // Long rental bonus
                // ------------------------------

                if ($duration >= 7) {

                    if (in_array(
                        strtolower($car->fuel_type),
                        ['hybrid', 'electric']
                    )) {

                        $score += 5;
                        $reasons[] = 'Good choice for a longer rental';
                    }
                }

                return [
                    'car' => $car,

                    'score' => max(
                        0,
                        min(100, $score)
                    ),

                    'reasons' => $reasons,

                    'estimated_total' => round(
                        $estimatedTotal,
                        2
                    ),

                    'within_budget' => $budget !== null
                        ? $estimatedTotal <= $budget
                        : true,
                ];
            });

            // ==========================================
            // 5. Budget filtering
            // ==========================================

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

                        'message' =>
                            'AI understood your request and found matching cars.',

                        'preferences' => $preferences,

                        'budget_match' => true,

                        'data' => $withinBudget,
                    ]);
                }

                // ==========================================
                // No cars inside budget
                // ==========================================

                $alternatives = $recommendations
                    ->sortBy(function ($recommendation) use ($budget) {

                        return abs(
                            $recommendation['estimated_total']
                            - $budget
                        );
                    })
                    ->values();

                return response()->json([
                    'success' => true,

                    'message' =>
                        'No cars match your budget. Here are the closest alternatives.',

                    'preferences' => $preferences,

                    'budget_match' => false,

                    'data' => $alternatives,
                ]);
            }

            // ==========================================
            // 6. No budget specified
            // ==========================================

            $recommendations = $recommendations
                ->sortByDesc('score')
                ->values();

            return response()->json([
                'success' => true,

                'message' =>
                    'AI understood your request and generated recommendations.',

                'preferences' => $preferences,

                'budget_match' => null,

                'data' => $recommendations,
            ]);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Something went wrong while generating recommendations.',

                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
