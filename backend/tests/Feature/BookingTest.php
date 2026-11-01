<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    private function payload(Car $car, int $fromDays, int $toDays, array $extra = []): array
    {
        $branch = Branch::factory()->create();

        return [
            'car_id' => $car->id,
            'pickup_branch_id' => $branch->id,
            'dropoff_branch_id' => $branch->id,
            'pickup_date' => now()->addDays($fromDays)->toDateString(),
            'return_date' => now()->addDays($toDays)->toDateString(),
            ...$extra,
        ];
    }

    public function test_price_status_and_owner_are_computed_server_side(): void
    {
        $customer = User::factory()->create();
        $other = User::factory()->create();
        $car = Car::factory()->create(['daily_rate' => 1500]);
        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/bookings', $this->payload($car, 1, 4, [
            'user_id' => $other->id,
            'total_amount' => 0,
            'daily_rate' => 1,
            'status' => 'completed',
        ]))->assertCreated();

        $booking = Booking::findOrFail($response->json('data.id'));
        $this->assertSame($customer->id, $booking->user_id);
        $this->assertSame('pending', $booking->status);
        $this->assertSame(3, $booking->total_days);
        $this->assertEquals(4500, $booking->total_amount);
        $this->assertEquals(1500, $booking->daily_rate);
    }

    public function test_same_day_booking_counts_as_one_day(): void
    {
        $car = Car::factory()->create(['daily_rate' => 800]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/bookings', $this->payload($car, 0, 0))
            ->assertCreated()
            ->assertJsonPath('data.total_days', 1)
            ->assertJsonPath('data.total_amount', '800.00');
    }

    public function test_pickup_in_the_past_is_rejected(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/bookings', $this->payload($car, -2, 1))
            ->assertStatus(422)
            ->assertJsonValidationErrors('pickup_date');
    }

    public function test_overlapping_booking_is_rejected(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/bookings', $this->payload($car, 5, 8))->assertCreated();

        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/bookings', $this->payload($car, 7, 10))->assertStatus(422);
        $this->assertSame(1, Booking::count());
    }

    public function test_future_booking_does_not_block_current_dates_or_car_status(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/bookings', $this->payload($car, 20, 22))->assertCreated();

        $this->assertSame('available', $car->fresh()->status);

        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/bookings', $this->payload($car, 1, 3))->assertCreated();
    }

    public function test_car_in_maintenance_cannot_be_booked(): void
    {
        $car = Car::factory()->create(['status' => 'maintenance']);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/bookings', $this->payload($car, 1, 2))->assertStatus(422);
    }

    public function test_customer_sees_only_own_bookings(): void
    {
        $car = Car::factory()->create();
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $id = $this->postJson('/api/bookings', $this->payload($car, 1, 2))->json('data.id');

        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger);
        $this->getJson('/api/bookings')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/bookings/{$id}")->assertStatus(403);
        $this->putJson("/api/bookings/{$id}", ['status' => 'confirmed'])->assertStatus(403);

        Sanctum::actingAs(User::factory()->role('staff')->create());
        $this->getJson('/api/bookings')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/bookings/{$id}")->assertOk();
    }

    public function test_staff_update_recomputes_price_and_checks_conflicts(): void
    {
        $car = Car::factory()->create(['daily_rate' => 1000]);
        Sanctum::actingAs(User::factory()->create());
        $first = $this->postJson('/api/bookings', $this->payload($car, 1, 3))->json('data.id');
        $second = $this->postJson('/api/bookings', $this->payload($car, 10, 12))->json('data.id');

        Sanctum::actingAs(User::factory()->role('staff')->create());
        $this->putJson("/api/bookings/{$second}", [
            'pickup_date' => now()->addDays(2)->toDateString(),
        ])->assertStatus(422);

        $this->putJson("/api/bookings/{$first}", [
            'return_date' => now()->addDays(5)->toDateString(),
            'status' => 'confirmed',
            'total_amount' => 1,
        ])->assertOk()
            ->assertJsonPath('data.total_days', 4)
            ->assertJsonPath('data.total_amount', '4000.00')
            ->assertJsonPath('data.status', 'confirmed');

        $this->assertSame('available', $car->fresh()->status);
    }

    public function test_owner_can_cancel_pending_booking_and_frees_the_dates(): void
    {
        $car = Car::factory()->create();
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $id = $this->postJson('/api/bookings', $this->payload($car, 1, 2))->json('data.id');

        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/bookings/{$id}/cancel")->assertStatus(403);

        Sanctum::actingAs($owner);
        $this->postJson("/api/bookings/{$id}/cancel")->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->postJson("/api/bookings/{$id}/cancel")->assertStatus(422);

        $this->postJson('/api/bookings', $this->payload($car, 1, 2))->assertCreated();
    }

    public function test_card_payment_marks_booking_paid_and_confirmed(): void
    {
        $car = Car::factory()->create(['daily_rate' => 1200]);
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $id = $this->postJson('/api/bookings', $this->payload($car, 1, 3))->json('data.id');

        $this->postJson("/api/bookings/{$id}/pay", ['payment_method' => 'card'])
            ->assertCreated()
            ->assertJsonPath('data.booking.status', 'confirmed')
            ->assertJsonPath('data.payment.payment_status', 'paid')
            ->assertJsonPath('data.payment.amount', '2400.00')
            ->assertJsonCount(1, 'data.booking.payments');

        $this->postJson("/api/bookings/{$id}/pay", ['payment_method' => 'card'])->assertStatus(422);
        $this->assertSame('available', $car->fresh()->status);
    }

    public function test_cash_payment_stays_pending_and_cannot_be_repeated(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->create());
        $id = $this->postJson('/api/bookings', $this->payload($car, 1, 3))->json('data.id');

        $this->postJson("/api/bookings/{$id}/pay", ['payment_method' => 'cash'])
            ->assertCreated()
            ->assertJsonPath('data.booking.status', 'confirmed')
            ->assertJsonPath('data.payment.payment_status', 'pending');

        $this->postJson("/api/bookings/{$id}/pay", ['payment_method' => 'cash'])->assertStatus(422);
    }

    public function test_only_owner_can_pay_and_method_is_validated(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->create());
        $id = $this->postJson('/api/bookings', $this->payload($car, 1, 3))->json('data.id');

        $this->postJson("/api/bookings/{$id}/pay", ['payment_method' => 'bitcoin'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('payment_method');

        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/bookings/{$id}/pay", ['payment_method' => 'card'])->assertStatus(403);
    }

    public function test_paid_booking_cannot_be_deleted(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->create());
        $id = $this->postJson('/api/bookings', $this->payload($car, 1, 3))->json('data.id');
        $this->postJson("/api/bookings/{$id}/pay", ['payment_method' => 'card'])->assertCreated();

        Sanctum::actingAs(User::factory()->role('admin')->create());
        $this->deleteJson("/api/bookings/{$id}")->assertStatus(422);
    }

    private function bookingFor(User $customer, Car $car, string $status = 'pending'): Booking
    {
        Sanctum::actingAs($customer);
        $id = $this->postJson('/api/bookings', $this->payload($car, 2, 5))->assertCreated()->json('data.id');
        $booking = Booking::findOrFail($id);
        $booking->update(['status' => $status]);

        return $booking->fresh();
    }

    public function test_notes_edit_keeps_the_agreed_price_and_ignores_car_status(): void
    {
        $car = Car::factory()->create(['daily_rate' => 1000]);
        $booking = $this->bookingFor(User::factory()->create(), $car, 'confirmed');

        // Rate changes and the car goes into maintenance after the booking was agreed.
        $car->update(['daily_rate' => 9999, 'status' => 'maintenance']);

        Sanctum::actingAs(User::factory()->role('staff')->create());
        $this->putJson("/api/bookings/{$booking->id}", ['notes' => 'Customer calls on arrival'])
            ->assertOk()
            ->assertJsonPath('data.notes', 'Customer calls on arrival');

        $this->assertEquals(3000, $booking->fresh()->total_amount);
        $this->assertEquals(1000, $booking->fresh()->daily_rate);
    }

    public function test_dates_must_be_iso_format(): void
    {
        $car = Car::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/bookings', $this->payload($car, 1, 2, [
            'pickup_date' => now()->addDay()->format('m/d/Y'),
        ]))->assertUnprocessable()->assertJsonValidationErrors('pickup_date');
    }

    public function test_paying_an_active_booking_keeps_it_active(): void
    {
        $customer = User::factory()->create();
        $booking = $this->bookingFor($customer, Car::factory()->create(), 'active');

        Sanctum::actingAs($customer);
        $this->postJson("/api/bookings/{$booking->id}/pay", ['payment_method' => 'card'])
            ->assertCreated()
            ->assertJsonPath('data.booking.status', 'active');
    }

    public function test_cancelling_a_paid_booking_refunds_the_payment(): void
    {
        $customer = User::factory()->create();
        $booking = $this->bookingFor($customer, Car::factory()->create());

        Sanctum::actingAs($customer);
        $this->postJson("/api/bookings/{$booking->id}/pay", ['payment_method' => 'card'])->assertCreated();
        $this->postJson("/api/bookings/{$booking->id}/cancel")->assertOk();

        $this->assertSame('refunded', $booking->payments()->first()->payment_status);
    }
}
