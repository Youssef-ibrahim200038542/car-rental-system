<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FleetTest extends TestCase
{
    use RefreshDatabase;

    private function bookCar(Car $car, int $fromDays, int $toDays): void
    {
        $branch = Branch::factory()->create();

        Booking::create([
            'user_id' => User::factory()->create()->id,
            'car_id' => $car->id,
            'pickup_branch_id' => $branch->id,
            'dropoff_branch_id' => $branch->id,
            'pickup_date' => now()->addDays($fromDays)->toDateString(),
            'return_date' => now()->addDays($toDays)->toDateString(),
            'daily_rate' => 1000,
            'total_days' => 1,
            'subtotal' => 1000,
            'total_amount' => 1000,
            'status' => 'confirmed',
        ]);
    }

    public function test_availability_endpoint_reports_free_and_booked_dates(): void
    {
        $car = Car::factory()->create();
        $this->bookCar($car, 5, 7);

        $this->getJson("/api/cars/{$car->id}/availability?".http_build_query([
            'pickup_date' => now()->addDays(1)->toDateString(),
            'return_date' => now()->addDays(3)->toDateString(),
        ]))->assertOk()->assertExactJson(['success' => true, 'data' => ['available' => true]]);

        $this->getJson("/api/cars/{$car->id}/availability?".http_build_query([
            'pickup_date' => now()->addDays(6)->toDateString(),
            'return_date' => now()->addDays(9)->toDateString(),
        ]))->assertOk()
            ->assertJsonPath('data.available', false)
            ->assertJsonStructure(['data' => ['available', 'reason']]);
    }

    public function test_availability_requires_dates(): void
    {
        $car = Car::factory()->create();

        $this->getJson("/api/cars/{$car->id}/availability")->assertStatus(422);
    }

    public function test_admin_stats_shape(): void
    {
        Car::factory()->create();
        Car::factory()->create(['status' => 'maintenance']);
        Sanctum::actingAs(User::factory()->role('staff')->create());

        $this->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'cars' => ['total', 'available', 'reserved', 'rented', 'maintenance', 'inactive'],
                'bookings' => ['total', 'pending', 'confirmed', 'active', 'completed', 'cancelled'],
                'revenue' => ['paid_total'],
                'users' => ['total', 'customers'],
                'branches' => ['total'],
                'reviews' => ['total', 'average_rating'],
            ]])
            ->assertJsonPath('data.cars.total', 2)
            ->assertJsonPath('data.cars.maintenance', 1);
    }

    public function test_admin_payment_with_invalid_method_returns_422(): void
    {
        $car = Car::factory()->create();
        $this->bookCar($car, 1, 2);
        Sanctum::actingAs(User::factory()->role('admin')->create());

        $this->postJson('/api/payments', [
            'booking_id' => Booking::first()->id,
            'amount' => 100,
            'payment_method' => 'bitcoin',
            'payment_status' => 'paid',
        ])->assertStatus(422)->assertJsonValidationErrors('payment_method');
    }

    public function test_open_maintenance_moves_car_to_maintenance_and_back(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->role('staff')->create());

        $id = $this->postJson('/api/maintenance', [
            'car_id' => $car->id,
            'title' => 'Oil change',
            'cost' => 500,
            'start_date' => now()->toDateString(),
            'status' => 'scheduled',
        ])->assertCreated()->json('data.id');

        $this->assertSame('maintenance', $car->fresh()->status);

        $this->putJson("/api/maintenance/{$id}", ['status' => 'completed'])->assertOk();

        $this->assertSame('available', $car->fresh()->status);
    }

    public function test_maintenance_update_rejects_end_date_before_stored_start_date(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->role('staff')->create());

        $id = $this->postJson('/api/maintenance', [
            'car_id' => $car->id,
            'title' => 'Brakes',
            'cost' => 800,
            'start_date' => '2026-12-10',
            'status' => 'scheduled',
        ])->assertCreated()->json('data.id');

        $this->putJson("/api/maintenance/{$id}", ['end_date' => '2026-12-05'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('end_date');

        $this->putJson("/api/maintenance/{$id}", ['start_date' => '2026-12-01', 'end_date' => '2026-12-05'])->assertOk();
    }

    public function test_closing_maintenance_leaves_a_manually_set_status_alone(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->role('staff')->create());

        $id = $this->postJson('/api/maintenance', [
            'car_id' => $car->id,
            'title' => 'Tyres',
            'cost' => 300,
            'start_date' => now()->toDateString(),
            'status' => 'in_progress',
        ])->assertCreated()->json('data.id');

        $car->update(['status' => 'inactive']);
        $this->putJson("/api/maintenance/{$id}", ['status' => 'completed'])->assertOk();

        $this->assertSame('inactive', $car->fresh()->status);
    }

    public function test_moving_maintenance_to_another_car_releases_the_first(): void
    {
        $first = Car::factory()->create();
        $second = Car::factory()->create();
        Sanctum::actingAs(User::factory()->role('staff')->create());

        $id = $this->postJson('/api/maintenance', [
            'car_id' => $first->id,
            'title' => 'Service',
            'cost' => 300,
            'start_date' => now()->toDateString(),
            'status' => 'scheduled',
        ])->assertCreated()->json('data.id');

        $this->putJson("/api/maintenance/{$id}", ['car_id' => (string) $second->id])->assertOk();

        $this->assertSame('available', $first->fresh()->status);
        $this->assertSame('maintenance', $second->fresh()->status);
    }
}
