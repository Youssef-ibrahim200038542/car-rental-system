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
 * failure it falls back to KeywordPreferenceParser, so the endpoint never
 * depends on the external service being up. Gemini output is passed through
 * a whitelist: only known fields, fuel types, transmissions and category
 * names that exist in car_categories survive.
 *
 * The parsed budget is the amount the user stated; budget_period says
 * whether they meant it per day. budgetPlan() decides the daily budget the
 * scorer gets and explains that decision in `notes`.
 */
class PreferenceParser
{
    private const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent';

    /**
     * With no rental length, an amount up to this is read as a daily budget;
     * above it, it is almost certainly a total and cannot be split.
     */
    private const DAILY_BUDGET_CEILING = 10000;

    public function __construct(private readonly KeywordPreferenceParser $keywords) {}

    /**
     * @return array{source: string, preferences: array{budget: ?float, budget_period: ?string, seats: ?int, duration: ?int, fuel_type: ?string, transmission: ?string, category: ?string, notes: string[]}}
     */
    public function parse(string $message): array
    {
        $categories = $this->categoryNames();
        $source = 'keyword';
        $preferences = null;

        if (config('services.gemini.key')) {
            try {
                $preferences = $this->parseWithGemini($message, $categories);
                $source = 'gemini';
            } catch (Throwable $e) {
                report($e);
            }
        }

        $preferences ??= $this->keywords->parse($message, $categories);
        $note = self::budgetPlan($preferences)['note'];

        return [
            'source' => $source,
            'preferences' => $preferences + ['notes' => $note === null ? [] : [$note]],
        ];
    }

    /**
     * Gemini only, no fallback: throws when the key is missing or the call fails.
     *
     * @param  string[]|null  $categories  defaults to the names in car_categories
     */
    public function parseWithGemini(string $message, ?array $categories = null): array
    {
        $apiKey = config('services.gemini.key');

        if (! $apiKey) {
            throw new RuntimeException('GEMINI_API_KEY is not set.');
        }

        $categories ??= $this->categoryNames();

        return $this->whitelist($this->askGemini($message, $apiKey, $categories), $categories);
    }

    /**
     * Converts parsed preferences to scorer input.
     */
    public static function toScorerInput(array $preferences): array
    {
        return [
            'budget' => self::budgetPlan($preferences)['daily'],
            'seats' => $preferences['seats'],
            'fuel_type' => $preferences['fuel_type'],
            'transmission' => $preferences['transmission'] ?? null,
            'category' => $preferences['category'],
        ];
    }

    /**
     * The scorer compares a daily rate, so the stated budget becomes a daily one:
     * per-day as stated; a total split over the duration; with no duration, a
     * plausible daily amount is kept and anything larger is dropped.
     *
     * @return array{daily: ?float, note: ?string}
     */
    public static function budgetPlan(array $preferences): array
    {
        $budget = $preferences['budget'] ?? null;
        $duration = $preferences['duration'] ?? null;

        if ($budget === null) {
            return ['daily' => null, 'note' => null];
        }

        $amount = number_format($budget);

        if (($preferences['budget_period'] ?? null) === 'day') {
            return ['daily' => (float) $budget, 'note' => "Budget of {$amount} EGP read as per day, as you said."];
        }

        if ($duration !== null && $duration > 0) {
            $daily = $budget / $duration;

            return [
                'daily' => $daily,
                'note' => sprintf('Total budget of %s EGP split over %d day(s): about %s EGP/day.', $amount, $duration, number_format($daily)),
            ];
        }

        if ($budget <= self::DAILY_BUDGET_CEILING) {
            return ['daily' => (float) $budget, 'note' => "No rental length given, so {$amount} EGP is read as a daily budget."];
        }

        return [
            'daily' => null,
            'note' => "{$amount} EGP looks like a total budget, but no rental length was given, so budget was not used. Add the number of days to use it.",
        ];
    }

    /** @return string[] */
    private function categoryNames(): array
    {
        return CarCategory::query()->pluck('name')->all();
    }

    private function askGemini(string $message, string $apiKey, array $categories): array
    {
        $response = Http::connectTimeout(5)
            ->timeout(5)
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
        $transmission = is_string($raw['transmission'] ?? null) ? strtolower(trim($raw['transmission'])) : null;
        $category = is_string($raw['category'] ?? null) ? $this->matchCategoryName($raw['category'], $categories) : null;
        $budget = is_numeric($raw['budget'] ?? null) && $raw['budget'] > 0 ? (float) $raw['budget'] : null;

        return [
            'budget' => $budget,
            'budget_period' => $budget === null ? null : (($raw['budget_period'] ?? null) === 'day' ? 'day' : 'total'),
            'seats' => is_numeric($raw['seats'] ?? null) && $raw['seats'] > 0 ? (int) $raw['seats'] : null,
            'duration' => is_numeric($raw['duration'] ?? null) && $raw['duration'] > 0 ? (int) $raw['duration'] : null,
            'fuel_type' => in_array($fuel, RecommendationScorer::FUEL_TYPES, true) ? $fuel : null,
            'transmission' => in_array($transmission, RecommendationScorer::TRANSMISSIONS, true) ? $transmission : null,
            'category' => $category,
        ];
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
You are a car rental assistant in Egypt. Extract the user's preferences from their request.
Users write casually in English, Egyptian Arabic or Franco-Arabic (Arabic in Latin letters
and digits, e.g. "3ayez 3arabeya automatic l 4 afrad"), with synonyms and typos. Never
invent information the user did not give; use null when a field is missing or unclear.

Return ONLY a JSON object with exactly these seven fields:

- "budget": the budget amount as a number, exactly as stated ("up to 15000",
  "around 15k", "15 الف" = 15000), else null. Prices are in EGP.
- "budget_period": "day" if the user said the amount is per day ("1500 a day",
  "1500 في اليوم", "1500 fel yom"), otherwise "total". null when budget is null.
- "seats": number of passengers as an integer ("for a couple" = 2, "family of 5" = 5,
  "for me" = 1, "4 أشخاص" = 4). "for my family" without a number = null.
- "duration": rental length in days ("a day"/"tomorrow" = 1, "a week"/"اسبوع" = 7,
  "two weeks"/"اسبوعين" = 14, "a month"/"شهر" = 30, "a few days" = null).
- "fuel_type": exactly one of "petrol", "diesel", "hybrid", "electric", or null.
  gasoline/gas/benzin/بنزين = petrol; سولار = diesel; EV/كهربا = electric; "any fuel" = null.
- "transmission": exactly "automatic" or "manual", or null.
  auto/اوتوماتيك = automatic; stick/مانيوال/عادي = manual.
- "category": exactly one of these names, or null: {$categoryList}.
  Map synonyms to the closest name (cheap/affordable/compact/اقتصادي -> an economy-type
  category; 4x4/crossover/jeep/جيب -> an SUV-type category; premium/executive/فخمة -> a
  luxury-type category). "comfortable car" or "family car" alone = null.

Example: "Looking for something affordable for 5 people for a week, up to 15000, automatic."
-> {"budget": 15000, "budget_period": "total", "seats": 5, "duration": 7, "fuel_type": null, "transmission": "automatic", "category": "Economy"}

User request:
{$message}
PROMPT;
    }
}
