<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Car;
use App\Models\CarCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SimilarCarsTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch;

    private CarCategory $suv;

    private CarCategory $economy;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::factory()->create();
        $this->suv = CarCategory::factory()->create(['name' => 'SUV']);
        $this->economy = CarCategory::factory()->create(['name' => 'Economy']);
    }

    public function test_returns_contract_shape_and_excludes_self_and_unbookable_cars(): void
    {
        $target = $this->makeCar();
        $available = $this->makeCar();
        $this->makeCar(['status' => 'maintenance']);
        $this->makeCar(['status' => 'inactive']);

        $response = $this->getJson("/api/cars/{$target->id}/similar");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.method', 'content-based-cosine')
            ->assertJsonStructure(['data' => ['similar' => [['car' => ['id', 'category', 'branch'], 'similarity', 'reasons']]]]);

        $this->assertSame([$available->id], array_column(array_column($response->json('data.similar'), 'car'), 'id'));
    }

    public function test_orders_by_similarity_with_reasons(): void
    {
        $target = $this->makeCar(['daily_rate' => 1500, 'seats' => 5, 'year' => 2024]);
        $twin = $this->makeCar(['daily_rate' => 1600, 'seats' => 5, 'year' => 2024]);
        $otherTransmission = $this->makeCar(['transmission' => 'manual', 'daily_rate' => 1500]);
        $farAway = $this->makeCar([
            'category_id' => $this->economy->id,
            'fuel_type' => 'diesel',
            'transmission' => 'manual',
            'seats' => 2,
            'daily_rate' => 400,
            'year' => 2015,
        ]);

        $similar = $this->getJson("/api/cars/{$target->id}/similar")->assertOk()->json('data.similar');

        $this->assertSame(
            [$twin->id, $otherTransmission->id, $farAway->id],
            array_column(array_column($similar, 'car'), 'id'),
        );

        $scores = array_column($similar, 'similarity');
        $this->assertSame($scores, collect($scores)->sortDesc()->values()->all());
        foreach ($scores as $score) {
            $this->assertGreaterThanOrEqual(0, $score);
            $this->assertLessThanOrEqual(1, $score);
        }

        $this->assertContains('Same category (SUV)', $similar[0]['reasons']);
        $this->assertContains('Same transmission (automatic)', $similar[0]['reasons']);
        $this->assertContains('Similar price (1,600 vs 1,500 EGP/day)', $similar[0]['reasons']);
    }

    public function test_limit_defaults_to_four_and_is_bounded(): void
    {
        $target = $this->makeCar();
        for ($i = 0; $i < 10; $i++) {
            $this->makeCar(['daily_rate' => 1000 + $i * 50]);
        }

        $this->getJson("/api/cars/{$target->id}/similar")->assertOk()->assertJsonCount(4, 'data.similar');
        $this->getJson("/api/cars/{$target->id}/similar?limit=8")->assertOk()->assertJsonCount(8, 'data.similar');
        $this->getJson("/api/cars/{$target->id}/similar?limit=1")->assertOk()->assertJsonCount(1, 'data.similar');
        $this->getJson("/api/cars/{$target->id}/similar?limit=9")->assertUnprocessable()->assertJsonValidationErrors('limit');
        $this->getJson("/api/cars/{$target->id}/similar?limit=0")->assertUnprocessable()->assertJsonValidationErrors('limit');
    }

    public function test_empty_list_when_no_other_bookable_car_and_404_for_unknown_car(): void
    {
        $target = $this->makeCar();

        $this->getJson("/api/cars/{$target->id}/similar")->assertOk()->assertJsonCount(0, 'data.similar');
        $this->getJson('/api/cars/999999/similar')->assertNotFound();
    }

    private function makeCar(array $overrides = []): Car
    {
        return Car::factory()->create(array_merge([
            'category_id' => $this->suv->id,
            'branch_id' => $this->branch->id,
        ], $overrides));
    }
}
