<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\CarCategory;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecommendationTest extends TestCase
{
    use RefreshDatabase;

    private Branch $cairo;

    private Branch $giza;

    private CarCategory $economy;

    private CarCategory $suv;

    private User $customer;

    private int $plate = 0;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cairo = Branch::create(['name' => 'Cairo', 'address' => 'Downtown', 'city' => 'Cairo']);
        $this->giza = Branch::create(['name' => 'Giza', 'address' => 'Dokki', 'city' => 'Giza']);
        $this->economy = CarCategory::create(['name' => 'Economy', 'daily_rate' => 500]);
        $this->suv = CarCategory::create(['name' => 'SUV', 'daily_rate' => 1500]);
        $this->customer = User::create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'role' => 'customer',
            'password' => 'password',
        ]);
    }

    public function test_returns_real_cars_in_contract_shape(): void
    {
        $car = $this->makeCar();

        $response = $this->postJson('/api/ml/recommendations', []);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.method', 'rule-based-scoring')
            ->assertJsonPath('data.recommendations.0.car.id', $car->id)
            ->assertJsonPath('data.recommendations.0.car.category.name', 'Economy')
            ->assertJsonPath('data.recommendations.0.car.branch.name', 'Cairo')
            ->assertJsonStructure(['data' => ['recommendations' => [['car', 'score', 'reasons']]]]);

        $score = $response->json('data.recommendations.0.score');
        $this->assertIsInt($score);
        $this->assertGreaterThanOrEqual(0, $score);
        $this->assertLessThanOrEqual(100, $score);
    }

    public function test_excludes_cars_in_maintenance_or_inactive(): void
    {
        $available = $this->makeCar();
        $this->makeCar(['status' => 'maintenance']);
        $this->makeCar(['status' => 'inactive']);

        $ids = $this->recommendedIds([]);

        $this->assertSame([$available->id], $ids);
    }

    public function test_excludes_cars_with_overlapping_active_bookings_only(): void
    {
        $free = $this->makeCar();
        $pending = $this->makeCar();
        $confirmed = $this->makeCar();
        $cancelled = $this->makeCar();
        $outsideWindow = $this->makeCar();

        $this->book($pending, '2026-12-03', '2026-12-06', 'pending');
        $this->book($confirmed, '2026-11-28', '2026-12-01', 'confirmed');
        $this->book($cancelled, '2026-12-01', '2026-12-05', 'cancelled');
        $this->book($outsideWindow, '2026-12-10', '2026-12-12', 'confirmed');

        $ids = $this->recommendedIds(['pickup_date' => '2026-12-01', 'return_date' => '2026-12-05']);

        $this->assertEqualsCanonicalizing([$free->id, $cancelled->id, $outsideWindow->id], $ids);
    }

    public function test_budget_fit_ranks_affordable_car_first(): void
    {
        $expensive = $this->makeCar(['daily_rate' => 3000]);
        $cheap = $this->makeCar(['daily_rate' => 800]);

        $response = $this->postJson('/api/ml/recommendations', ['budget' => 1000])->assertOk();

        $this->assertSame([$cheap->id, $expensive->id], array_column(array_column($response->json('data.recommendations'), 'car'), 'id'));
        $this->assertGreaterThan(
            $response->json('data.recommendations.1.score'),
            $response->json('data.recommendations.0.score'),
        );
        $this->assertStringContainsString('Within your budget', $response->json('data.recommendations.0.reasons.0'));
    }

    public function test_category_is_matched_by_name_case_insensitively(): void
    {
        $this->makeCar(['category_id' => $this->economy->id]);
        $suv = $this->makeCar(['category_id' => $this->suv->id, 'daily_rate' => 2000]);

        $response = $this->postJson('/api/ml/recommendations', ['category' => 'suv'])->assertOk();

        $this->assertSame($suv->id, $response->json('data.recommendations.0.car.id'));
        $this->assertContains('Matches your category (SUV)', $response->json('data.recommendations.0.reasons'));
    }

    public function test_gasoline_is_treated_as_petrol(): void
    {
        $this->makeCar(['fuel_type' => 'electric', 'daily_rate' => 100]);
        $petrol = $this->makeCar(['fuel_type' => 'petrol', 'daily_rate' => 900]);

        $response = $this->postJson('/api/ml/recommendations', ['fuel_type' => 'gasoline'])->assertOk();

        $this->assertSame($petrol->id, $response->json('data.recommendations.0.car.id'));
    }

    public function test_reviews_and_completed_bookings_raise_the_score(): void
    {
        $plain = $this->makeCar();
        $proven = $this->makeCar();
        $booking = $this->book($proven, '2026-01-01', '2026-01-03', 'completed');
        Review::create(['user_id' => $this->customer->id, 'car_id' => $proven->id, 'booking_id' => $booking->id, 'rating' => 5]);

        $response = $this->postJson('/api/ml/recommendations', [])->assertOk();

        $this->assertSame([$proven->id, $plain->id], array_column(array_column($response->json('data.recommendations'), 'car'), 'id'));
    }

    public function test_limit_defaults_to_six_and_is_validated(): void
    {
        foreach (range(1, 8) as $i) {
            $this->makeCar();
        }

        $this->assertCount(6, $this->recommendedIds([]));
        $this->assertCount(3, $this->recommendedIds(['limit' => 3]));
        $this->postJson('/api/ml/recommendations', ['limit' => 21])->assertStatus(422);
    }

    public function test_rejects_invalid_filters(): void
    {
        $this->postJson('/api/ml/recommendations', ['fuel_type' => 'coal'])->assertStatus(422);
        $this->postJson('/api/ml/recommendations', ['transmission' => 'cvt'])->assertStatus(422);
        $this->postJson('/api/ml/recommendations', ['pickup_date' => '2026-12-05'])->assertStatus(422);
        $this->postJson('/api/ml/recommendations', ['pickup_date' => '2026-12-05', 'return_date' => '2026-12-01'])->assertStatus(422);
    }

    public function test_ai_recommend_falls_back_to_keywords_without_gemini_key(): void
    {
        config(['services.gemini.key' => null]);
        $this->makeCar(['category_id' => $this->economy->id]);
        $suv = $this->makeCar(['category_id' => $this->suv->id, 'seats' => 7, 'daily_rate' => 2000]);

        $response = $this->postJson('/api/ai/recommendations', ['message' => 'I need a 4x4 for 6 people for a week']);

        $response->assertOk()
            ->assertJsonPath('data.source', 'keyword')
            ->assertJsonPath('data.preferences.category', 'SUV')
            ->assertJsonPath('data.preferences.seats', 6)
            ->assertJsonPath('data.preferences.duration', 7)
            ->assertJsonPath('data.recommendations.0.car.id', $suv->id);
    }

    private function makeCar(array $overrides = []): Car
    {
        $this->plate++;

        return Car::create(array_merge([
            'category_id' => $this->economy->id,
            'branch_id' => $this->cairo->id,
            'brand' => 'Toyota',
            'model' => 'Corolla',
            'year' => 2024,
            'license_plate' => "TEST-{$this->plate}",
            'vin' => "VIN{$this->plate}",
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 900,
            'status' => 'available',
        ], $overrides));
    }

    private function book(Car $car, string $pickup, string $return, string $status): Booking
    {
        return Booking::create([
            'user_id' => $this->customer->id,
            'car_id' => $car->id,
            'pickup_branch_id' => $this->cairo->id,
            'dropoff_branch_id' => $this->cairo->id,
            'pickup_date' => $pickup,
            'return_date' => $return,
            'daily_rate' => $car->daily_rate,
            'total_days' => 3,
            'subtotal' => 2700,
            'total_amount' => 2700,
            'status' => $status,
        ]);
    }

    private function recommendedIds(array $body): array
    {
        $response = $this->postJson('/api/ml/recommendations', $body)->assertOk();

        return array_column(array_column($response->json('data.recommendations'), 'car'), 'id');
    }
}
