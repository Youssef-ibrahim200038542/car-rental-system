<?php

namespace Tests\Feature;

use App\Models\CarCategory;
use App\Services\KeywordPreferenceParser;
use App\Services\PreferenceParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PreferenceParserTest extends TestCase
{
    use RefreshDatabase;

    private const CATEGORIES = ['Economy', 'Sedan', 'SUV', 'Luxury'];

    private function keywords(string $message): array
    {
        return (new KeywordPreferenceParser)->parse($message, self::CATEGORIES);
    }

    public function test_reads_english_request(): void
    {
        $this->assertSame([
            'budget' => 1200.0,
            'budget_period' => 'day',
            'seats' => 4,
            'duration' => null,
            'fuel_type' => 'hybrid',
            'transmission' => null,
            'category' => 'Sedan',
        ], $this->keywords('hybrid sedan, 4 passengers, max 1200 a day'));
    }

    public function test_reads_egyptian_arabic_with_arabic_indic_digits_and_alf(): void
    {
        $parsed = $this->keywords('عايز عربية اوتوماتيك لـ ٤ أشخاص ٣ ايام في حدود ١٥ ألف');

        $this->assertSame(15000.0, $parsed['budget']);
        $this->assertSame('total', $parsed['budget_period']);
        $this->assertSame(4, $parsed['seats']);
        $this->assertSame(3, $parsed['duration']);
        $this->assertSame('automatic', $parsed['transmission']);
    }

    public function test_reads_franco_arabic(): void
    {
        $parsed = $this->keywords('e7na 5 w 3ayzeen jeep solar esbo3en mizanyti 2000 fel yom');

        $this->assertSame(5, $parsed['seats']);
        $this->assertSame(14, $parsed['duration']);
        $this->assertSame('diesel', $parsed['fuel_type']);
        $this->assertSame('SUV', $parsed['category']);
        $this->assertSame(2000.0, $parsed['budget']);
        $this->assertSame('day', $parsed['budget_period']);
    }

    public function test_maps_arabic_fuel_transmission_and_category_words(): void
    {
        $this->assertSame('petrol', $this->keywords('عربية بنزين')['fuel_type']);
        $this->assertSame('diesel', $this->keywords('عربية سولار')['fuel_type']);
        $this->assertSame('electric', $this->keywords('عربية كهربا')['fuel_type']);
        $this->assertSame('manual', $this->keywords('عربية مانيوال')['transmission']);
        $this->assertSame('Economy', $this->keywords('عربية رخيصة')['category']);
        $this->assertSame('Luxury', $this->keywords('عربية فخمة')['category']);
    }

    public function test_budget_number_is_not_read_as_seats_or_days(): void
    {
        $parsed = $this->keywords('for 4 days, budget 5000 egp');

        $this->assertSame(5000.0, $parsed['budget']);
        $this->assertSame(4, $parsed['duration']);
        $this->assertNull($parsed['seats']);
    }

    public function test_family_without_a_number_sets_no_seats(): void
    {
        $this->assertNull($this->keywords('Need a big car for my family')['seats']);
    }

    public function test_budget_plan_follows_the_daily_vs_total_rule(): void
    {
        $base = ['budget' => 9000.0, 'budget_period' => 'total', 'duration' => 3];

        $this->assertSame(3000.0, PreferenceParser::budgetPlan($base)['daily']);
        $this->assertSame(9000.0, PreferenceParser::budgetPlan(['duration' => null] + $base)['daily']);
        $this->assertNull(PreferenceParser::budgetPlan(['budget' => 20000.0, 'duration' => null] + $base)['daily']);
        $this->assertSame(9000.0, PreferenceParser::budgetPlan(['budget_period' => 'day'] + $base)['daily']);
        $this->assertSame(['daily' => null, 'note' => null], PreferenceParser::budgetPlan(['budget' => null]));
    }

    public function test_gemini_output_is_whitelisted_including_transmission(): void
    {
        config(['services.gemini.key' => 'test-key']);
        CarCategory::create(['name' => 'SUV', 'daily_rate' => 1500]);
        Http::fake(['*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => json_encode([
            'budget' => 1500, 'budget_period' => 'day', 'seats' => 5, 'duration' => 7,
            'fuel_type' => 'gasoline', 'transmission' => 'Automatic', 'category' => 'suv', 'extra' => 'dropped',
        ])]]]]]])]);

        $parsed = app(PreferenceParser::class)->parse('anything');

        $this->assertSame('gemini', $parsed['source']);
        $this->assertSame('automatic', $parsed['preferences']['transmission']);
        $this->assertSame('petrol', $parsed['preferences']['fuel_type']);
        $this->assertSame('SUV', $parsed['preferences']['category']);
        $this->assertArrayNotHasKey('extra', $parsed['preferences']);
        $this->assertSame(['Budget of 1,500 EGP read as per day, as you said.'], $parsed['preferences']['notes']);
    }

    public function test_gemini_failure_falls_back_to_keywords(): void
    {
        config(['services.gemini.key' => 'test-key']);
        Http::fake(['*' => Http::response('boom', 500)]);

        $parsed = app(PreferenceParser::class)->parse('manual car for 2 days');

        $this->assertSame('keyword', $parsed['source']);
        $this->assertSame('manual', $parsed['preferences']['transmission']);
    }

    public function test_eval_command_scores_the_golden_set(): void
    {
        CarCategory::create(['name' => 'Economy', 'daily_rate' => 500]);
        $golden = tempnam(sys_get_temp_dir(), 'golden');
        file_put_contents($golden, implode("\n", [
            json_encode(['id' => 'a', 'lang' => 'en', 'text' => 'cheap car for 3 days', 'expected' => ['duration' => 3, 'category' => 'Economy']]),
            json_encode(['id' => 'b', 'lang' => 'ar', 'text' => 'عربية ٣ ايام', 'expected' => ['duration' => 3, 'seats' => 2]]),
        ]));

        $this->artisan('recommendations:eval-parser', ['--golden' => $golden])
            ->expectsOutputToContain('keyword parser: 2 cases, exact match 50.0%')
            ->assertSuccessful();

        unlink($golden);
    }
}
