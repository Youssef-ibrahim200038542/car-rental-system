<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Car;
use App\Models\CarCategory;
use App\Models\RecommendationEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RecommendationEventTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch;

    private CarCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.recommendations.explore_rate' => 0]);

        $this->branch = Branch::factory()->create();
        $this->category = CarCategory::factory()->create(['name' => 'Economy']);
    }

    public function test_ml_response_has_request_id_positions_and_logs_impressions(): void
    {
        // Distinct budget fractions (within, <=10% over, way over) so the order does not hang on tie-breaks.
        $cheap = $this->makeCar(['daily_rate' => 500]);
        $mid = $this->makeCar(['daily_rate' => 1080]);
        $pricey = $this->makeCar(['daily_rate' => 3000]);

        $response = $this->postJson('/api/ml/recommendations', ['budget' => 1000])->assertOk();

        $requestId = $response->json('data.request_id');
        $this->assertTrue(Str::isUuid($requestId));
        $response->assertJsonPath('data.explored', false);

        $served = $response->json('data.recommendations');
        $this->assertSame([1, 2, 3], array_column($served, 'position'));
        $this->assertSame([$cheap->id, $mid->id, $pricey->id], array_column(array_column($served, 'car'), 'id'));

        $impressions = RecommendationEvent::where('request_id', $requestId)->orderBy('position')->get();
        $this->assertCount(3, $impressions);
        $this->assertSame(['impression'], $impressions->pluck('event')->unique()->values()->all());
        $this->assertSame([$cheap->id, $mid->id, $pricey->id], $impressions->pluck('car_id')->all());
        $this->assertSame([1, 2, 3], $impressions->pluck('position')->all());
        $this->assertNull($impressions[0]->user_id);
        $this->assertSame($served[0]['score'], $impressions[0]->features['score']);
        $this->assertSame($served[0]['reasons'], $impressions[0]->features['reasons']);
        $this->assertSame($served[0]['features'] ?? null, $impressions[0]->features['criteria']);
    }

    public function test_explore_rate_zero_is_deterministic(): void
    {
        $this->makeCar(['daily_rate' => 500]);
        $this->makeCar(['daily_rate' => 800]);
        $this->makeCar(['daily_rate' => 1200]);

        $orders = collect(range(1, 5))->map(fn () => array_column(array_column(
            $this->postJson('/api/ml/recommendations', ['budget' => 1000])->assertJsonPath('data.explored', false)
                ->json('data.recommendations'),
            'car',
        ), 'id'));

        $this->assertCount(1, $orders->unique());
    }

    public function test_explore_rate_one_swaps_one_adjacent_pair_and_logs_served_order(): void
    {
        $this->makeCar(['daily_rate' => 500]);
        $this->makeCar(['daily_rate' => 1080]);
        $this->makeCar(['daily_rate' => 1200]);
        $ids = array_column(array_column(
            $this->postJson('/api/ml/recommendations', ['budget' => 1000])->json('data.recommendations'),
            'car',
        ), 'id');

        config(['services.recommendations.explore_rate' => 1]);

        $response = $this->postJson('/api/ml/recommendations', ['budget' => 1000])
            ->assertOk()
            ->assertJsonPath('data.explored', true);

        $served = array_column(array_column($response->json('data.recommendations'), 'car'), 'id');
        $this->assertNotSame($ids, $served);
        $this->assertEqualsCanonicalizing($ids, $served);
        $this->assertSame(1, collect($ids)->zip($served)->filter(fn ($pair) => $pair[0] !== $pair[1])->count() / 2);
        $this->assertSame([1, 2, 3], array_column($response->json('data.recommendations'), 'position'));

        $logged = RecommendationEvent::where('request_id', $response->json('data.request_id'))
            ->orderBy('position')->pluck('car_id')->all();
        $this->assertSame($served, $logged);
    }

    public function test_ai_response_has_request_id_positions_and_logs_impressions(): void
    {
        config(['services.gemini.key' => null]);
        $this->makeCar();
        $this->makeCar(['daily_rate' => 900]);

        $response = $this->postJson('/api/ai/recommendations', ['message' => 'cheap car please'])->assertOk();

        $requestId = $response->json('data.request_id');
        $this->assertTrue(Str::isUuid($requestId));
        $response->assertJsonPath('data.explored', false);
        $this->assertSame([1, 2], array_column($response->json('data.recommendations'), 'position'));
        $this->assertSame(2, RecommendationEvent::where('request_id', $requestId)->where('event', 'impression')->count());
    }

    public function test_impressions_capture_user_when_token_sent(): void
    {
        $user = User::factory()->create();
        $this->makeCar();

        $requestId = $this->withToken($user->createToken('test')->plainTextToken)
            ->postJson('/api/ml/recommendations', [])
            ->json('data.request_id');

        $this->assertSame($user->id, RecommendationEvent::where('request_id', $requestId)->value('user_id'));
    }

    public function test_click_and_book_events_are_stored(): void
    {
        $car = $this->makeCar();
        $requestId = $this->postJson('/api/ml/recommendations', [])->json('data.request_id');

        $this->postJson('/api/recommendation-events', [
            'request_id' => $requestId,
            'car_id' => $car->id,
            'event' => 'click',
        ])->assertCreated()->assertExactJson(['success' => true]);

        $this->postJson('/api/recommendation-events', [
            'request_id' => $requestId,
            'car_id' => $car->id,
            'event' => 'book',
            'position' => 1,
        ])->assertCreated();

        $click = RecommendationEvent::where('request_id', $requestId)->where('event', 'click')->sole();
        $this->assertSame(1, $click->position, 'position defaults to the impression position');
        $this->assertNull($click->user_id);
        $this->assertNull($click->features);
        $this->assertSame(1, RecommendationEvent::where('request_id', $requestId)->where('event', 'book')->count());
    }

    public function test_event_captures_user_when_token_sent(): void
    {
        $user = User::factory()->create();
        $car = $this->makeCar();
        $requestId = $this->postJson('/api/ml/recommendations', [])->json('data.request_id');

        $this->withToken($user->createToken('test')->plainTextToken)
            ->postJson('/api/recommendation-events', [
                'request_id' => $requestId,
                'car_id' => $car->id,
                'event' => 'click',
            ])->assertCreated();

        $this->assertSame($user->id, RecommendationEvent::where('event', 'click')->value('user_id'));
    }

    public function test_unknown_request_id_is_rejected(): void
    {
        $car = $this->makeCar();

        $this->postJson('/api/recommendation-events', [
            'request_id' => (string) Str::uuid(),
            'car_id' => $car->id,
            'event' => 'click',
        ])->assertUnprocessable()->assertJsonValidationErrors('request_id');

        $this->postJson('/api/recommendation-events', [
            'request_id' => 'not-a-uuid',
            'car_id' => $car->id,
            'event' => 'click',
        ])->assertUnprocessable()->assertJsonValidationErrors('request_id');
    }

    public function test_car_not_in_that_request_is_rejected(): void
    {
        $this->makeCar();
        $requestId = $this->postJson('/api/ml/recommendations', ['limit' => 1])->json('data.request_id');
        $notShown = $this->makeCar();

        $this->postJson('/api/recommendation-events', [
            'request_id' => $requestId,
            'car_id' => $notShown->id,
            'event' => 'click',
        ])->assertUnprocessable()->assertJsonValidationErrors('car_id');
    }

    public function test_invalid_event_is_rejected(): void
    {
        $car = $this->makeCar();
        $requestId = $this->postJson('/api/ml/recommendations', [])->json('data.request_id');

        foreach (['impression', 'view', ''] as $event) {
            $this->postJson('/api/recommendation-events', [
                'request_id' => $requestId,
                'car_id' => $car->id,
                'event' => $event,
            ])->assertUnprocessable()->assertJsonValidationErrors('event');
        }

        $this->postJson('/api/recommendation-events', [
            'request_id' => $requestId,
            'car_id' => $car->id,
            'event' => 'click',
            'position' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('position');
    }

    private function makeCar(array $overrides = []): Car
    {
        return Car::factory()->create(array_merge([
            'category_id' => $this->category->id,
            'branch_id' => $this->branch->id,
        ], $overrides));
    }
}
