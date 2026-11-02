<?php

namespace App\Services;

use Throwable;

/**
 * Scores a preference parser against labelled requests (slot-filling metrics).
 *
 * Per field: a correct non-null prediction is a true positive; a wrong value
 * counts as both a false positive and a false negative; a missed value is a
 * false negative; a value the user never gave is a false positive. A case is
 * an exact match when all fields agree, with missing and null treated alike.
 */
class ParserEvaluator
{
    public const FIELDS = ['budget', 'seats', 'duration', 'fuel_type', 'transmission', 'category'];

    /**
     * @param  array<int, array{id: string, lang: string, text: string, expected: array}>  $cases
     * @param  callable(string): array  $predict  returns the parsed preferences; may throw
     */
    public function evaluate(array $cases, callable $predict): array
    {
        $groups = ['all' => $this->emptyTally()];
        $failures = [];

        foreach ($cases as $case) {
            try {
                $predicted = $predict($case['text']);
                $error = null;
            } catch (Throwable $e) {
                $predicted = [];
                $error = $e->getMessage();
            }

            $mismatches = $this->mismatches($case['expected'], $predicted);

            foreach (['all', $case['lang']] as $group) {
                $groups[$group] ??= $this->emptyTally();
                $this->tally($groups[$group], $case['expected'], $predicted, $mismatches === [], $error !== null);
            }

            if ($mismatches !== [] || $error !== null) {
                $failures[] = array_filter([
                    'id' => $case['id'],
                    'text' => $case['text'],
                    'mismatches' => $mismatches,
                    'error' => $error,
                ], fn ($value) => $value !== null && $value !== []);
            }
        }

        $report = array_map(fn (array $tally) => $this->summarise($tally), $groups);

        return ['overall' => $report['all'], 'by_language' => array_diff_key($report, ['all' => true]), 'failures' => $failures];
    }

    private function emptyTally(): array
    {
        return [
            'cases' => 0,
            'exact' => 0,
            'errors' => 0,
            'fields' => array_fill_keys(self::FIELDS, ['tp' => 0, 'fp' => 0, 'fn' => 0]),
        ];
    }

    private function tally(array &$tally, array $expected, array $predicted, bool $exact, bool $errored): void
    {
        $tally['cases']++;
        $tally['exact'] += $exact ? 1 : 0;
        $tally['errors'] += $errored ? 1 : 0;

        foreach (self::FIELDS as $field) {
            $want = $expected[$field] ?? null;
            $got = $predicted[$field] ?? null;
            $counts = &$tally['fields'][$field];

            if ($want !== null && $got !== null && $this->same($field, $want, $got)) {
                $counts['tp']++;
            } else {
                $counts['fp'] += $got !== null ? 1 : 0;
                $counts['fn'] += $want !== null ? 1 : 0;
            }
            unset($counts);
        }
    }

    /** @return array<string, array{expected: mixed, predicted: mixed}> */
    private function mismatches(array $expected, array $predicted): array
    {
        $out = [];

        foreach (self::FIELDS as $field) {
            $want = $expected[$field] ?? null;
            $got = $predicted[$field] ?? null;

            if (! ($want === null && $got === null) && ($want === null || $got === null || ! $this->same($field, $want, $got))) {
                $out[$field] = ['expected' => $want, 'predicted' => $got];
            }
        }

        return $out;
    }

    private function same(string $field, mixed $want, mixed $got): bool
    {
        return match ($field) {
            'budget', 'seats', 'duration' => abs((float) $want - (float) $got) < 0.01,
            default => strcasecmp((string) $want, (string) $got) === 0,
        };
    }

    private function summarise(array $tally): array
    {
        $fields = [];
        $micro = ['tp' => 0, 'fp' => 0, 'fn' => 0];

        foreach ($tally['fields'] as $field => $counts) {
            $fields[$field] = $this->prf($counts) + ['support' => $counts['tp'] + $counts['fn']];
            foreach ($micro as $key => $value) {
                $micro[$key] = $value + $counts[$key];
            }
        }

        return [
            'cases' => $tally['cases'],
            'exact_match' => $tally['cases'] ? round($tally['exact'] / $tally['cases'], 3) : 0.0,
            'errors' => $tally['errors'],
            'micro' => $this->prf($micro),
            'fields' => $fields,
        ];
    }

    /** @return array{precision: float, recall: float, f1: float} */
    private function prf(array $counts): array
    {
        $precision = $counts['tp'] + $counts['fp'] ? $counts['tp'] / ($counts['tp'] + $counts['fp']) : 0.0;
        $recall = $counts['tp'] + $counts['fn'] ? $counts['tp'] / ($counts['tp'] + $counts['fn']) : 0.0;
        $f1 = $precision + $recall ? 2 * $precision * $recall / ($precision + $recall) : 0.0;

        return ['precision' => round($precision, 3), 'recall' => round($recall, 3), 'f1' => round($f1, 3)];
    }
}
