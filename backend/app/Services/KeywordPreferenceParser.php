<?php

namespace App\Services;

use App\Services\PreferenceLexicon as Lex;

/**
 * Deterministic fallback parser for English, Egyptian Arabic and
 * Franco-Arabic rental requests. No network, no randomness: the same text
 * always gives the same preferences.
 *
 * Flow: normalise the text, take the budget phrase out (so its number is not
 * read as seats or days), then read seats, duration, fuel, transmission and
 * category from what is left.
 */
class KeywordPreferenceParser
{
    /** A smaller amount is not a car-rental budget (it is a typo or a count). */
    private const MIN_BUDGET = 50;

    private const MAX_SEATS = 20;

    /**
     * @param  string[]  $categories  category names that exist in car_categories
     * @return array{budget: ?float, budget_period: ?string, seats: ?int, duration: ?int, fuel_type: ?string, transmission: ?string, category: ?string}
     */
    public function parse(string $message, array $categories): array
    {
        $text = ' '.self::normalise($message).' ';

        [$budget, $period, $text] = $this->extractBudget($text);

        return [
            'budget' => $budget,
            'budget_period' => $budget === null ? null : $period,
            'seats' => $this->parseSeats($text),
            'duration' => $this->parseDuration($text),
            'fuel_type' => $this->firstKey($text, Lex::FUEL),
            'transmission' => $this->firstKey($text, Lex::TRANSMISSION),
            'category' => $this->parseCategory($text, $categories),
        ];
    }

    /**
     * Lower-case, ASCII digits, one spelling per Arabic letter, plain numbers
     * ("15,000" / "15k" / "15 الف" → "15000", "تلات" → "3").
     */
    public static function normalise(string $message): string
    {
        $text = strtr(mb_strtolower($message), [
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
            '٫' => '.', '٬' => ',', '،' => ' , ', '؟' => ' ? ',
            'أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ة' => 'ه', 'ى' => 'ي', 'ـ' => '',
        ]);
        $text = preg_replace('/[\x{064B}-\x{065F}\x{0670}]/u', '', $text);

        // Thousands separators: "15,000" and "15.000" (but not "1.5k").
        $text = preg_replace('/(?<=\d),(?=\d{3}(?!\d))/u', '', $text);
        $text = preg_replace('/(?<=\d)\.(?=\d{3}(?![\d.])(?!\s*(?:k|thousand|الف|alf)))/u', '', $text);

        foreach (Lex::NUMBER_WORDS as $word => $number) {
            $text = preg_replace('/(?<![\p{L}\p{N}])'.preg_quote($word, '/').'(?![\p{L}\p{N}])/u', (string) $number, $text);
        }

        $text = preg_replace_callback(
            '/(\d+(?:\.\d+)?)\s*(?:'.self::alternation(Lex::THOUSAND).')/u',
            fn (array $m) => (string) (int) round((float) $m[1] * 1000),
            $text,
        );

        // A bare "الف" / "alf" is one thousand.
        return preg_replace('/(?<![\p{L}\p{N}])(?:الف|alf)(?![\p{L}])/u', '1000', $text);
    }

    /**
     * @return array{0: ?float, 1: string, 2: string} [amount, 'day'|'total', text with the budget phrase removed]
     */
    private function extractBudget(string $text): array
    {
        $number = '(?<![a-z\d.])(?<num>\d+(?:\.\d+)?)';
        $notCount = '(?!\s*(?:'.self::alternation([...Lex::SEAT_UNITS, ...Lex::DAY_UNITS, ...Lex::WEEK_UNITS, ...Lex::MONTH_UNITS]).'))';
        $currency = '(?:\s*(?:'.self::alternation(Lex::CURRENCY).'))';
        $perDay = '(?<day>\s*(?:'.self::alternation(Lex::PER_DAY).'))';
        $end = '(?![a-z\d])';

        $patterns = [
            '/(?<cue>'.self::alternation(Lex::BUDGET_CUES).')(?<gap>[^\d\n]{0,20}?)'.$number.$notCount.$currency.'?'.$perDay.'?'.$end.'/u',
            '/'.$number.$currency.$perDay.'?'.$end.'/u',
            '/'.$number.$currency.'?'.$perDay.$end.'/u',
            '/'.$number.$currency.'?\s*(?:'.self::alternation(Lex::TOTAL).')'.$end.'/u',
            '/(?<![\p{L}])(?:'.self::alternation(Lex::PRICE_PREFIXES).')\s*'.$number.$notCount.$currency.'?'.$perDay.'?'.$end.'/u',
        ];

        foreach ($patterns as $pattern) {
            if (! preg_match($pattern, $text, $m, PREG_OFFSET_CAPTURE)) {
                continue;
            }

            $amount = (float) $m['num'][0];
            if ($amount < self::MIN_BUDGET) {
                continue;
            }

            $cueText = ($m['cue'][0] ?? '').($m['gap'][0] ?? '');
            $isDaily = ($m['day'][0] ?? '') !== ''
                || preg_match('/'.self::alternation(Lex::PER_DAY).'/u', $cueText) === 1;

            $remaining = substr_replace($text, ' ', $m[0][1], strlen($m[0][0]));

            return [$amount, $isDaily ? 'day' : 'total', $remaining];
        }

        return [null, 'total', $text];
    }

    private function parseSeats(string $text): ?int
    {
        $durationUnits = self::alternation([...Lex::DAY_UNITS, ...Lex::WEEK_UNITS, ...Lex::MONTH_UNITS, ...Lex::CURRENCY]);
        $count = '(?<![a-z\d.])(\d{1,2})';

        $patterns = [
            '/'.$count.'\s*(?:'.self::alternation(Lex::SEAT_UNITS).')/u',
            '/(?:'.self::alternation(Lex::GROUP_CUES).')\s*'.$count.'(?!\s*(?:'.$durationUnits.'))(?![a-z\d])/u',
            '/(?:'.self::alternation(Lex::FOR_CUES).')\s*'.$count.'(?!\s*(?:'.$durationUnits.'))(?![a-z\d.])/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m) && (int) $m[1] >= 1 && (int) $m[1] <= self::MAX_SEATS) {
                return (int) $m[1];
            }
        }

        return match (true) {
            $this->contains($text, Lex::COUPLE) => 2,
            $this->contains($text, Lex::SOLO) => 1,
            default => null,
        };
    }

    private function parseDuration(string $text): ?int
    {
        $count = '(?<![a-z\d.])(\d{1,3})\s*';
        $multipliers = [1 => Lex::DAY_UNITS, 7 => Lex::WEEK_UNITS, 30 => Lex::MONTH_UNITS];

        foreach ($multipliers as $days => $units) {
            if (preg_match('/'.$count.'(?:'.self::alternation($units).')/u', $text, $m) && (int) $m[1] > 0) {
                return (int) $m[1] * $days;
            }
        }

        foreach (Lex::DURATION_PHRASES as $days => $phrases) {
            if ($this->contains($text, $phrases)) {
                return $days;
            }
        }

        return null;
    }

    private function parseCategory(string $text, array $categories): ?string
    {
        foreach (Lex::CATEGORY as $key => $aliases) {
            $name = $this->categoryNamed($key, $categories);

            if ($name !== null && $this->contains($text, $aliases)) {
                return $name;
            }
        }

        // Categories added later without aliases still match by their own name.
        foreach ($categories as $name) {
            if ($this->contains($text, [mb_strtolower($name)])) {
                return $name;
            }
        }

        return null;
    }

    private function categoryNamed(string $key, array $categories): ?string
    {
        foreach ($categories as $name) {
            if (mb_strtolower($name) === $key) {
                return $name;
            }
        }

        return null;
    }

    /** @param  array<string, string[]>  $keywordsByValue */
    private function firstKey(string $text, array $keywordsByValue): ?string
    {
        foreach ($keywordsByValue as $value => $keywords) {
            if ($this->contains($text, $keywords)) {
                return $value;
            }
        }

        return null;
    }

    /** @param  string[]  $keywords */
    private function contains(string $text, array $keywords): bool
    {
        return preg_match('/'.self::alternation($keywords).'/u', $text) === 1;
    }

    /**
     * Regex alternation, longest first. Latin words must stand alone
     * ("ev" must not match "every"); Arabic words may carry prefixes.
     *
     * @param  string[]  $words
     */
    private static function alternation(array $words): string
    {
        usort($words, fn (string $a, string $b) => mb_strlen($b) <=> mb_strlen($a));

        return implode('|', array_map(function (string $word) {
            $quoted = preg_quote($word, '/');

            return preg_match('/\p{Arabic}/u', $word) ? $quoted : '(?<![a-z])'.$quoted.'(?![a-z])';
        }, $words));
    }
}
