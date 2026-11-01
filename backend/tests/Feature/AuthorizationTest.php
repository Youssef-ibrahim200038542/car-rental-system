<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_anonymous_cannot_delete_a_car(): void
    {
        $car = Car::factory()->create();

        $this->deleteJson("/api/cars/{$car->id}")->assertStatus(401);

        $this->assertDatabaseHas('cars', ['id' => $car->id]);
    }

    public function test_anonymous_cannot_read_payments_users_or_bookings(): void
    {
        $this->getJson('/api/payments')->assertStatus(401);
        $this->getJson('/api/users')->assertStatus(401);
        $this->getJson('/api/bookings')->assertStatus(401);
        $this->postJson('/api/bookings', [])->assertStatus(401);
        $this->getJson('/api/admin/stats')->assertStatus(401);
    }

    public function test_public_catalogue_stays_public(): void
    {
        Car::factory()->create();

        $this->getJson('/api/cars')->assertOk();
        $this->getJson('/api/branches')->assertOk();
        $this->getJson('/api/car-categories')->assertOk();
        $this->getJson('/api/reviews')->assertOk();
    }

    public function test_customer_is_forbidden_on_admin_and_staff_routes(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/payments')->assertStatus(403);
        $this->getJson('/api/users')->assertStatus(403);
        $this->getJson('/api/maintenance')->assertStatus(403);
        $this->getJson('/api/admin/stats')->assertStatus(403);
        $this->deleteJson("/api/cars/{$car->id}")->assertStatus(403);
        $this->postJson('/api/branches', ['name' => 'X', 'address' => 'Y', 'city' => 'Z'])->assertStatus(403);
    }

    public function test_staff_can_read_users_but_not_manage_cars(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->role('staff')->create());

        $this->getJson('/api/users')->assertOk();
        $this->getJson('/api/payments')->assertOk();
        $this->deleteJson("/api/cars/{$car->id}")->assertStatus(403);
    }

    public function test_admin_can_manage_cars(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->role('admin')->create());

        $this->deleteJson("/api/cars/{$car->id}")->assertOk();
        $this->assertDatabaseMissing('cars', ['id' => $car->id]);
    }

    public function test_customer_cannot_escalate_own_role(): void
    {
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $this->putJson("/api/users/{$customer->id}", ['role' => 'admin'])->assertStatus(403);

        $this->assertSame('customer', $customer->fresh()->role);
    }

    public function test_admin_cannot_change_own_role(): void
    {
        $admin = User::factory()->role('admin')->create();
        Sanctum::actingAs($admin);

        $this->putJson("/api/users/{$admin->id}", ['role' => 'customer'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');

        $this->assertSame('admin', $admin->fresh()->role);
    }

    public function test_admin_can_change_another_users_role(): void
    {
        $customer = User::factory()->create();
        Sanctum::actingAs(User::factory()->role('admin')->create());

        $this->putJson("/api/users/{$customer->id}", ['role' => 'staff'])->assertOk();

        $this->assertSame('staff', $customer->fresh()->role);
    }

    public function test_deleting_referenced_rows_returns_422(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->role('admin')->create());

        $this->deleteJson("/api/branches/{$car->branch_id}")->assertStatus(422)->assertJsonPath('success', false);
        $this->deleteJson("/api/car-categories/{$car->category_id}")->assertStatus(422);
        $this->assertDatabaseHas('branches', ['id' => $car->branch_id]);
    }

    public function test_deleting_a_booked_car_returns_422(): void
    {
        $customer = User::factory()->create();
        $car = Car::factory()->create();
        $branch = Branch::factory()->create();

        Sanctum::actingAs($customer);
        $this->postJson('/api/bookings', [
            'car_id' => $car->id,
            'pickup_branch_id' => $branch->id,
            'dropoff_branch_id' => $branch->id,
            'pickup_date' => now()->addDay()->toDateString(),
            'return_date' => now()->addDays(2)->toDateString(),
        ])->assertCreated();

        Sanctum::actingAs(User::factory()->role('admin')->create());
        $this->deleteJson("/api/cars/{$car->id}")->assertStatus(422);
        $this->assertDatabaseHas('cars', ['id' => $car->id]);
    }

    public function test_car_year_is_limited_to_the_mysql_year_range(): void
    {
        Sanctum::actingAs(User::factory()->role('admin')->create());
        $car = Car::factory()->create();

        $this->putJson("/api/cars/{$car->id}", ['year' => 1900])->assertStatus(422)->assertJsonValidationErrors('year');
        $this->putJson("/api/cars/{$car->id}", ['year' => (int) date('Y') + 2])->assertStatus(422);
        $this->putJson("/api/cars/{$car->id}", ['year' => (int) date('Y') + 1])->assertOk();
    }

    public function test_login_is_throttled_after_ten_attempts_per_minute(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/login', ['email' => 'nobody@example.com', 'password' => 'wrong'])->assertStatus(401);
        }

        $this->postJson('/api/login', ['email' => 'nobody@example.com', 'password' => 'wrong'])->assertStatus(429);

        // A separate bucket: browsing recommendations is not blocked by failed logins.
        $this->postJson('/api/ml/recommendations', [])->assertOk();
    }
}
