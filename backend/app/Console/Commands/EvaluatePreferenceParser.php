<?php

namespace App\Console\Commands;

use App\Models\CarCategory;
use App\Services\KeywordPreferenceParser;
use App\Services\ParserEvaluator;
use App\Services\PreferenceParser;
use Illuminate\Console\Command;

class EvaluatePreferenceParser extends Command
{
    protected $signature = 'recommendations:eval-parser
        {--parser=keyword : keyword, gemini or both}
        {--json : print the full report as JSON}
        {--golden= : path to the golden JSONL file (default ML/eval/parser_golden.jsonl)}';

    protected $description = 'Score the natural-language preference parser against the labelled golden set';

    public function handle(ParserEvaluator $evaluator, KeywordPreferenceParser $keywords, PreferenceParser $parser): int
    {
        $choice = $this->option('parser');
        if (! in_array($choice, ['keyword', 'gemini', 'both'], true)) {
            $this->error('--parser must be keyword, gemini or both.');

            return self::INVALID;
        }

        $path = $this->option('golden') ?: base_path('../ML/eval/parser_golden.jsonl');
        $cases = $this->loadCases($path);
        $categories = CarCategory::query()->pluck('name')->all();

        if ($cases === null || $categories === []) {
            $this->error($cases === null ? "Golden set not found or invalid: {$path}" : 'No car categories in the database; run the seeder first.');

            return self::FAILURE;
        }

        $report = ['golden_set' => basename($path), 'cases' => count($cases), 'categories' => $categories, 'parsers' => [], 'notes' => []];

        if ($choice !== 'gemini') {
            $report['parsers']['keyword'] = $evaluator->evaluate($cases, fn (string $text) => $keywords->parse($text, $categories));
        }

        if ($choice !== 'keyword') {
            if (config('services.gemini.key')) {
                $report['model'] = config('services.gemini.model');
                $report['parsers']['gemini'] = $evaluator->evaluate($cases, fn (string $text) => $parser->parseWithGemini($text, $categories));
            } else {
                $report['notes'][] = 'Gemini skipped: GEMINI_API_KEY is not set.';
            }
        }

        $this->option('json')
            ? $this->line(json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))
            : $this->printReport($report);

        return self::SUCCESS;
    }

    /** @return array<int, array{id: string, lang: string, text: string, expected: array}>|null */
    private function loadCases(string $path): ?array
    {
        if (! is_file($path)) {
            return null;
        }

        $cases = [];
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $case = json_decode($line, true);

            if (! is_array($case) || ! isset($case['id'], $case['lang'], $case['text']) || ! is_array($case['expected'] ?? null)) {
                return null;
            }
            $cases[] = $case;
        }

        return $cases;
    }

    private function printReport(array $report): void
    {
        foreach ($report['notes'] as $note) {
            $this->warn($note);
        }

        foreach ($report['parsers'] as $name => $result) {
            $overall = $result['overall'];
            $this->info(sprintf(
                '%s parser: %d cases, exact match %.1f%%, micro F1 %.3f, errors %d',
                $name, $overall['cases'], $overall['exact_match'] * 100, $overall['micro']['f1'], $overall['errors'],
            ));

            $this->table(
                ['Field', 'Precision', 'Recall', 'F1', 'Support'],
                collect($overall['fields'])->map(fn ($m, $field) => [$field, $m['precision'], $m['recall'], $m['f1'], $m['support']])->values(),
            );

            $this->table(
                ['Language', 'Cases', 'Exact match', 'Micro P', 'Micro R', 'Micro F1'],
                collect($result['by_language'])->map(fn ($m, $lang) => [
                    $lang, $m['cases'], sprintf('%.1f%%', $m['exact_match'] * 100), $m['micro']['precision'], $m['micro']['recall'], $m['micro']['f1'],
                ])->values(),
            );
        }
    }
}
