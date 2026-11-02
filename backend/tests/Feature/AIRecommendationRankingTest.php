<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\CarCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** The Python AI service is faked here; ML/service/test_app.py tests the service itself. */
class AIRecommendationRankingTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch;

    private CarCategory $economy;

    private CarCategory $suv;

    private int $plate = 0;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.ai_recommender.url' => 'http://ai.test']);

        $this->branch = Branch::create(['name' => 'Cairo', 'address' => 'Downtown', 'city' => 'Cairo']);
        $this->economy = CarCategory::create(['name' => 'Economy', 'daily_rate' => 500]);
        $this->suv = CarCategory::create(['name' => 'SUV', 'daily_rate' => 1500]);
    }

    public function test_ai_order_score_and_reasons_are_served(): void
    {
        $cheap = $this->makeCar(['daily_rate' => 700]);
        $suv = $this->makeCar(['category_id' => $this->suv->id, 'daily_rate' => 1800]);

        Http::fake(['ai.test/rank' => Http::response(['ranking' => [
            ['id' => $suv->id, 'score' => 0.91, 'similarity_score' => 1, 'demand_score' => 0.85, 'reasons' => ['Matches your category (SUV)']],
            ['id' => $cheap->id, 'score' => 0.42, 'similarity_score' => 0.3, 'demand_score' => 0.5, 'reasons' => ['Different category (Economy), closest alternative']],
        ]])]);

        $response = $this->postJson('/api/ml/recommendations', ['category' => 'suv'])->assertOk();

        $response->assertJsonPath('data.method', 'ai-knn-demand-hybrid')
            ->assertJsonPath('data.recommendations.0.car.id', $suv->id)
            ->assertJsonPath('data.recommendations.0.score', 91)
            ->assertJsonPath('data.recommendations.0.position', 1)
            ->assertJsonPath('data.recommendations.1.car.id', $cheap->id);

        // AI reasons first, then the live review fact from our own database.
        $this->assertSame('Matches your category (SUV)', $response->json('data.recommendations.0.reasons.0'));
        $this->assertSame('No reviews yet', $response->json('data.recommendations.0.reasons.1'));
    }

    public function test_service_receives_bookable_cars_and_plain_preferences(): void
    {
        $free = $this->makeCar(['brand' => 'Kia', 'model' => 'Sportage', 'category_id' => $this->suv->id]);
        $this->makeCar(['status' => 'maintenance']);
        $booked = $this->makeCar();
        $this->book($booked, '2026-12-01', '2026-12-05');

        Http::fake(['ai.test/rank' => Http::response(['ranking' => []])]);

        $this->postJson('/api/ml/recommendations', [
            'category' => 'SUV', 'fuel_type' => 'gasoline', 'budget' => 2000,
            'pickup_date' => '2026-12-02', 'return_date' => '2026-12-03', 'limit' => 3,
        ])->assertOk();

        Http::assertSent(function (Request $request) use ($free) {
            $ids = array_column($request['cars'], 'id');

            return $ids === [$free->id]
                && $request['cars'][0]['category'] === 'SUV'
                && $request['cars'][0]['brand'] === 'Kia'
                && $request['preferences'] == ['budget' => 2000, 'category' => 'SUV', 'fuel_type' => 'petrol']
                && $request['limit'] === 3;
        });
    }

    public function test_unknown_or_duplicate_ids_from_the_service_are_dropped(): void
    {
        $car = $this->makeCar();

        Http::fake(['ai.test/rank' => Http::response(['ranking' => [
            ['id' => 999999, 'score' => 0.99, 'reasons' => []],
            ['id' => $car->id, 'score' => 0.8, 'reasons' => ['x']],
            ['id' => $car->id, 'score' => 0.7, 'reasons' => ['y']],
        ]])]);

        $response = $this->postJson('/api/ml/recommendations', [])->assertOk();

        $this->assertSame([$car->id], array_column(array_column($response->json('data.recommendations'), 'car'), 'id'));
    }

    public function test_falls_back_to_rules_when_service_errors(): void
    {
        $car = $this->makeCar();
        Http::fake(['ai.test/rank' => Http::response('boom', 500)]);

        $this->postJson('/api/ml/recommendations', [])->assertOk()
            ->assertJsonPath('data.method', 'rule-based-scoring')
            ->assertJsonPath('data.recommendations.0.car.id', $car->id);
    }

    public function test_falls_back_to_rules_when_service_is_down(): void
    {
        $this->makeCar();
        Http::fake(fn () => throw new ConnectionException('Connection refused'));

        $this->postJson('/api/ml/recommendations', [])->assertOk()
            ->assertJsonPath('data.method', 'rule-based-scoring');
    }

    public function test_falls_back_to_rules_on_malformed_response(): void
    {
        $this->makeCar();
        Http::fake(['ai.test/rank' => Http::response(['ranking' => [['id' => 1]]])]);

        $this->postJson('/api/ml/recommendations', [])->assertOk()
            ->assertJsonPath('data.method', 'rule-based-scoring');
    }

    public function test_service_is_not_called_when_disabled_or_fleet_is_empty(): void
    {
        Http::fake();

        $this->postJson('/api/ml/recommendations', [])->assertOk()
            ->assertJsonPath('data.recommendations', []);

        config(['services.ai_recommender.url' => '']);
        $this->makeCar();
        $this->postJson('/api/ml/recommendations', [])->assertOk()
            ->assertJsonPath('data.method', 'rule-based-scoring');

        Http::assertNothingSent();
    }

    public function test_natural_language_endpoint_uses_the_ai_ranking(): void
    {
        $car = $this->makeCar(['category_id' => $this->suv->id]);
        Http::fake(['ai.test/rank' => Http::response(['ranking' => [
            ['id' => $car->id, 'score' => 0.8, 'reasons' => ['Matches your category (SUV)']],
        ]])]);

        $this->postJson('/api/ai/recommendations', ['message' => 'I want an SUV'])->assertOk()
            ->assertJsonPath('data.method', 'ai-knn-demand-hybrid')
            ->assertJsonPath('data.recommendations.0.car.id', $car->id);
    }

    private function makeCar(array $overrides = []): Car
    {
        $this->plate++;

        return Car::create(array_merge([
            'category_id' => $this->economy->id,
            'branch_id' => $this->branch->id,
            'brand' => 'Toyota',
            'model' => 'Corolla',
            'year' => 2024,
            'license_plate' => "AI-{$this->plate}",
            'vin' => "AIVIN{$this->plate}",
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 900,
            'status' => 'available',
        ], $overrides));
    }

    private function book(Car $car, string $pickup, string $return): void
    {
        $user = User::create([
            'name' => 'Booker', 'email' => "booker{$car->id}@example.com", 'role' => 'customer', 'password' => 'password',
        ]);

        Booking::create([
            'user_id' => $user->id,
            'car_id' => $car->id,
            'pickup_branch_id' => $this->branch->id,
            'dropoff_branch_id' => $this->branch->id,
            'pickup_date' => $pickup,
            'return_date' => $return,
            'daily_rate' => $car->daily_rate,
            'total_days' => 4,
            'subtotal' => 3600,
            'total_amount' => 3600,
            'status' => 'confirmed',
        ]);
    }
}
