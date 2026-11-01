<?php

namespace App\Services;

use App\Models\CarCategory;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * Turns a free-text rental request into RecommendationScorer preferences.
 *
 * Uses Gemini when a key is configured; on a missing key or any Gemini
 * failure it falls back to a deterministic keyword parser, so the endpoint
 * never depends on the external service being up. Gemini output is passed
 * through a whitelist: only known fields, known fuel types and category
 * names that exist in car_categories survive.
 */
class PreferenceParser
{
    private const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent';

    private const CATEGORY_ALIASES = [
        'economy' => ['economy', 'economical', 'cheap', 'cheapest', 'affordable', 'budget car', 'small car', 'compact'],
        'sedan' => ['sedan', 'saloon', 'four-door'],
        'suv' => ['suv', '4x4', 'four by four', 'jeep', 'crossover', 'sport utility'],
        'luxury' => ['luxury', 'luxurious', 'premium', 'high-end', 'executive', 'prestige'],
    ];

    private const FUEL_KEYWORDS = [
        'electric' => ['electric', ' ev ', 'ev.', 'ev,'],
        'hybrid' => ['hybrid'],
        'diesel' => ['diesel'],
        'petrol' => ['petrol', 'gasoline', 'benzine'],
    ];

    /**
     * @return array{source: string, preferences: array{budget: ?float, seats: ?int, duration: ?int, fuel_type: ?string, category: ?string}}
     */
    public function parse(string $message): array
    {
        $categories = CarCategory::query()->pluck('name')->all();
        $apiKey = config('services.gemini.key');

        if ($apiKey) {
            try {
                return [
                    'source' => 'gemini',
                    'preferences' => $this->whitelist($this->askGemini($message, $apiKey, $categories), $categories),
                ];
            } catch (Throwable $e) {
                report($e);
            }
        }

        return [
            'source' => 'keyword',
            'preferences' => $this->parseKeywords($message, $categories),
        ];
    }

    /**
     * Converts parsed preferences to scorer input. The user states a total
     * budget; the scorer compares against a daily rate.
     */
    public static function toScorerInput(array $preferences): array
    {
        $duration = max(1, (int) ($preferences['duration'] ?? 1));

        return [
            'budget' => $preferences['budget'] !== null ? $preferences['budget'] / $duration : null,
            'seats' => $preferences['seats'],
            'fuel_type' => $preferences['fuel_type'],
            'category' => $preferences['category'],
        ];
    }

    private function askGemini(string $message, string $apiKey, array $categories): array
    {
        $response = Http::connectTimeout(5)
            ->timeout(15)
            ->withHeaders(['x-goog-api-key' => $apiKey])
            ->post(sprintf(self::GEMINI_URL, config('services.gemini.model')), [
                'contents' => [['parts' => [['text' => $this->prompt($message, $categories)]]]],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.1,
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException("Gemini request failed with HTTP {$response->status()}.");
        }

        $decoded = json_decode((string) data_get($response->json(), 'candidates.0.content.parts.0.text'), true);

        if (! is_array($decoded)) {
            throw new RuntimeException('Gemini returned a non-JSON or empty response.');
        }

        return $decoded;
    }

    private function whitelist(array $raw, array $categories): array
    {
        $fuel = RecommendationScorer::normaliseFuelType(is_string($raw['fuel_type'] ?? null) ? $raw['fuel_type'] : null);
        $category = is_string($raw['category'] ?? null) ? $this->matchCategoryName($raw['category'], $categories) : null;

        return [
            'budget' => is_numeric($raw['budget'] ?? null) && $raw['budget'] > 0 ? (float) $raw['budget'] : null,
            'seats' => is_numeric($raw['seats'] ?? null) && $raw['seats'] > 0 ? (int) $raw['seats'] : null,
            'duration' => is_numeric($raw['duration'] ?? null) && $raw['duration'] > 0 ? (int) $raw['duration'] : null,
            'fuel_type' => in_array($fuel, RecommendationScorer::FUEL_TYPES, true) ? $fuel : null,
            'category' => $category,
        ];
    }

    private function parseKeywords(string $message, array $categories): array
    {
        $text = ' '.strtolower($message).' ';

        return [
            'budget' => $this->firstNumber($text, '/(?:budget|spend|up to|max(?:imum)?|under|less than|no more than)\D{0,15}([\d,]+(?:\.\d+)?)/'),
            'seats' => ($seats = $this->firstNumber($text, '/(?:family of|group of)\s*(\d+)|(\d+)\s*(?:people|persons|passengers|seats)/')) ? (int) $seats : null,
            'duration' => $this->parseDuration($text),
            'fuel_type' => $this->firstKeywordMatch($text, self::FUEL_KEYWORDS),
            'category' => $this->matchCategoryInText($text, $categories),
        ];
    }

    private function parseDuration(string $text): ?int
    {
        if ($days = $this->firstNumber($text, '/(\d+)\s*days?/')) {
            return (int) $days;
        }
        if ($weeks = $this->firstNumber($text, '/(\d+)\s*weeks?/')) {
            return (int) $weeks * 7;
        }

        return match (true) {
            str_contains($text, 'month') => 30,
            str_contains($text, 'week') => 7,
            str_contains($text, 'a day') || str_contains($text, 'tomorrow') => 1,
            default => null,
        };
    }

    private function firstNumber(string $text, string $pattern): ?float
    {
        if (! preg_match($pattern, $text, $matches)) {
            return null;
        }

        $captured = array_values(array_filter(array_slice($matches, 1), fn ($group) => $group !== ''));

        return $captured ? (float) str_replace(',', '', $captured[0]) : null;
    }

    private function firstKeywordMatch(string $text, array $keywordsByValue): ?string
    {
        foreach ($keywordsByValue as $value => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    return $value;
                }
            }
        }

        return null;
    }

    private function matchCategoryInText(string $text, array $categories): ?string
    {
        foreach ($categories as $name) {
            $aliases = self::CATEGORY_ALIASES[strtolower($name)] ?? [strtolower($name)];

            if ($this->firstKeywordMatch($text, [$name => $aliases]) !== null) {
                return $name;
            }
        }

        return null;
    }

    private function matchCategoryName(string $candidate, array $categories): ?string
    {
        foreach ($categories as $name) {
            if (strcasecmp($name, trim($candidate)) === 0) {
                return $name;
            }
        }

        return null;
    }

    private function prompt(string $message, array $categories): string
    {
        $categoryList = implode(', ', $categories);

        return <<<PROMPT
You are a car rental assistant. Extract the user's preferences from their request.
Users write casually, with synonyms and in any sentence structure. Never invent
information the user did not give; use null when a field is missing or unclear.

Return ONLY a JSON object with exactly these five fields:

- "budget": maximum TOTAL rental budget as a number ("up to 15000", "around 15000" = 15000), else null.
- "seats": number of passengers as an integer ("for a couple" = 2, "family of 5" = 5,
  "for me" = 1). "for my family" without a number = null.
- "duration": rental length in days ("a day"/"tomorrow" = 1, "a week" = 7,
  "two weeks" = 14, "a month" = 30, "a few days" = null).
- "fuel_type": exactly one of "petrol", "diesel", "hybrid", "electric", or null.
  gasoline/gas = petrol; EV = electric; "any fuel" = null.
- "category": exactly one of these names, or null: {$categoryList}.
  Map synonyms to the closest name (cheap/affordable/compact -> an economy-type
  category; 4x4/crossover/jeep -> an SUV-type category; premium/executive -> a
  luxury-type category). "comfortable car" or "family car" alone = null.

Example: "Looking for something affordable for 5 people for a week, up to 15000."
-> {"budget": 15000, "seats": 5, "duration": 7, "fuel_type": null, "category": "Economy"}

User request:
{$message}
PROMPT;
    }
}
