<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Bookings and payments stay in step: status moves, cancellations, add-ons
 * and back-office payment edits.
 */
class BookingMoneyTest extends TestCase
{
    use RefreshDatabase;

    private function booking(string $status = 'pending', int $fromDays = 2, int $toDays = 5, float $rate = 1000): Booking
    {
        $branch = Branch::factory()->create();

        return Booking::create([
            'user_id' => User::factory()->create()->id,
            'car_id' => Car::factory()->create(['daily_rate' => $rate])->id,
            'pickup_branch_id' => $branch->id,
            'dropoff_branch_id' => $branch->id,
            'pickup_date' => now()->addDays($fromDays)->toDateString(),
            'return_date' => now()->addDays($toDays)->toDateString(),
            'daily_rate' => $rate,
            'total_days' => $toDays - $fromDays,
            'subtotal' => $rate * ($toDays - $fromDays),
            'discount' => 0,
            'total_amount' => $rate * ($toDays - $fromDays),
            'status' => $status,
        ]);
    }

    private function pay(Booking $booking, string $status = 'paid'): Payment
    {
        return Payment::create([
            'booking_id' => $booking->id,
            'amount' => $booking->total_amount,
            'payment_method' => 'card',
            'payment_status' => $status,
            'paid_at' => $status === 'paid' ? now() : null,
        ]);
    }

    private function actAs(string $role): void
    {
        Sanctum::actingAs(User::factory()->role($role)->create());
    }

    // 1: cancelling through PUT settles payments like /cancel.
    public function test_cancelling_through_update_refunds_paid_and_fails_pending_payments(): void
    {
        $booking = $this->booking('confirmed');
        $paid = $this->pay($booking);
        $pending = $this->pay($booking, 'pending');
        $this->actAs('staff');

        $this->putJson("/api/bookings/{$booking->id}", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertSame('refunded', $paid->fresh()->payment_status);
        $this->assertSame('failed', $pending->fresh()->payment_status);
    }

    // 10: status transition map.
    public function test_booking_status_moves_only_forward(): void
    {
        $this->actAs('staff');

        $completed = $this->booking('completed');
        $this->putJson("/api/bookings/{$completed->id}", ['status' => 'pending'])
            ->assertStatus(422)->assertJsonValidationErrors('status');

        $pending = $this->booking('pending');
        $this->putJson("/api/bookings/{$pending->id}", ['status' => 'completed'])->assertStatus(422);
        $this->putJson("/api/bookings/{$pending->id}", ['status' => 'confirmed'])->assertOk();
        $this->putJson("/api/bookings/{$pending->id}", ['status' => 'active'])->assertOk();
        $this->putJson("/api/bookings/{$pending->id}", ['status' => 'completed'])->assertOk();

        $cancelled = $this->booking('cancelled');
        $this->putJson("/api/bookings/{$cancelled->id}", ['status' => 'confirmed'])->assertStatus(422);
        $this->putJson("/api/bookings/{$cancelled->id}", ['notes' => 'same status is fine'])->assertOk();
    }

    // 3: no silent price change once money was taken.
    public function test_price_change_on_a_paid_booking_is_refused(): void
    {
        $booking = $this->booking('confirmed');
        $this->pay($booking);
        $this->actAs('staff');

        $this->putJson("/api/bookings/{$booking->id}", ['discount' => 100])
            ->assertStatus(422)
            ->assertJsonPath('message', 'This booking is already paid. Refund or adjust the payment first.');
        $this->putJson("/api/bookings/{$booking->id}", ['notes' => 'ok'])->assertOk();
    }

    // 6: customers cannot cancel after pickup, nor pay a finished rental.
    public function test_customer_cannot_cancel_after_pickup_but_staff_can(): void
    {
        $booking = $this->booking('confirmed', -2, 3);

        Sanctum::actingAs($booking->user);
        $this->postJson("/api/bookings/{$booking->id}/cancel")->assertStatus(422);

        $this->actAs('staff');
        $this->postJson("/api/bookings/{$booking->id}/cancel")->assertOk();
    }

    public function test_customer_can_cancel_on_the_pickup_day(): void
    {
        $booking = $this->booking('confirmed', 0, 3);

        Sanctum::actingAs($booking->user);
        $this->postJson("/api/bookings/{$booking->id}/cancel")->assertOk();
    }

    public function test_paying_a_booking_that_already_ended_is_refused(): void
    {
        $booking = $this->booking('confirmed', -5, -1);

        Sanctum::actingAs($booking->user);
        $this->postJson("/api/bookings/{$booking->id}/pay", ['payment_method' => 'card'])->assertStatus(422);
        $this->assertSame(0, $booking->payments()->count());
    }

    // 7: add-ons are charged and closed on paid bookings.
    public function test_addons_are_added_to_and_removed_from_the_total(): void
    {
        $booking = $this->booking(); // 3 days x 1000
        $this->actAs('staff');

        $id = $this->postJson('/api/booking-addons', [
            'booking_id' => $booking->id, 'name' => 'Child seat', 'price' => 150, 'quantity' => 2,
        ])->assertCreated()->json('data.id');
        $this->assertEquals(3300, $booking->fresh()->total_amount);

        $this->putJson("/api/booking-addons/{$id}", ['quantity' => 1])->assertOk();
        $this->assertEquals(3150, $booking->fresh()->total_amount);

        $this->deleteJson("/api/booking-addons/{$id}")->assertOk();
        $this->assertEquals(3000, $booking->fresh()->total_amount);
    }

    public function test_addons_count_when_the_booking_is_repriced_and_paid(): void
    {
        $booking = $this->booking();
        $this->actAs('staff');
        $this->postJson('/api/booking-addons', ['booking_id' => $booking->id, 'name' => 'GPS', 'price' => 100])->assertCreated();

        $this->putJson("/api/bookings/{$booking->id}", ['discount' => 50])->assertOk();
        $this->assertEquals(3050, $booking->fresh()->total_amount);

        Sanctum::actingAs($booking->user);
        $this->postJson("/api/bookings/{$booking->id}/pay", ['payment_method' => 'card'])
            ->assertCreated()
            ->assertJsonPath('data.payment.amount', '3050.00');
    }

    public function test_addons_cannot_change_on_paid_or_closed_bookings(): void
    {
        $paid = $this->booking('confirmed');
        $this->pay($paid);
        $cancelled = $this->booking('cancelled');
        $this->actAs('staff');

        foreach ([$paid, $cancelled] as $booking) {
            $this->postJson('/api/booking-addons', ['booking_id' => $booking->id, 'name' => 'GPS', 'price' => 100])
                ->assertStatus(422);
            $this->assertSame(0, $booking->addons()->count());
        }
    }

    // 2: payments back office.
    public function test_only_admin_can_create_or_delete_payments(): void
    {
        $booking = $this->booking();
        $payment = $this->pay($booking, 'pending');
        $body = ['booking_id' => $booking->id, 'payment_method' => 'cash', 'payment_status' => 'pending'];

        $this->actAs('staff');
        $this->postJson('/api/payments', $body)->assertForbidden();
        $this->deleteJson("/api/payments/{$payment->id}")->assertForbidden();

        $this->actAs('admin');
        $this->postJson('/api/payments', $body)->assertCreated();
        $this->deleteJson("/api/payments/{$payment->id}")->assertOk();
    }

    public function test_admin_payment_defaults_amount_and_sets_paid_at_on_the_server(): void
    {
        $booking = $this->booking();
        $this->actAs('admin');

        $response = $this->postJson('/api/payments', [
            'booking_id' => $booking->id, 'payment_method' => 'card', 'payment_status' => 'paid', 'paid_at' => '2000-01-01',
        ])->assertCreated();

        $response->assertJsonPath('data.amount', '3000.00')
            ->assertJsonPath('data.booking.user.name', $booking->user->name)
            ->assertJsonPath('data.booking.car.brand', $booking->car->brand);
        $this->assertTrue(Payment::find($response->json('data.id'))->paid_at->isToday());
    }

    public function test_second_paid_payment_or_paid_on_closed_booking_is_refused(): void
    {
        $booking = $this->booking('confirmed');
        $this->pay($booking);
        $completed = $this->booking('completed');
        $this->actAs('admin');

        $this->postJson('/api/payments', ['booking_id' => $booking->id, 'payment_method' => 'card', 'payment_status' => 'paid'])
            ->assertStatus(422);
        $this->postJson('/api/payments', ['booking_id' => $completed->id, 'payment_method' => 'card', 'payment_status' => 'paid'])
            ->assertStatus(422);
    }

    public function test_payment_status_moves_only_along_allowed_transitions(): void
    {
        $booking = $this->booking('confirmed');
        $payment = $this->pay($booking, 'pending');
        $this->actAs('staff');

        $this->putJson("/api/payments/{$payment->id}", ['payment_status' => 'refunded'])
            ->assertStatus(422)->assertJsonValidationErrors('payment_status');

        $this->putJson("/api/payments/{$payment->id}", ['payment_status' => 'paid'])->assertOk();
        $this->assertNotNull($payment->fresh()->paid_at);

        $this->putJson("/api/payments/{$payment->id}", ['payment_status' => 'pending'])->assertStatus(422);
        $this->putJson("/api/payments/{$payment->id}", ['payment_status' => 'refunded'])->assertOk();
        $this->putJson("/api/payments/{$payment->id}", ['payment_status' => 'paid'])->assertStatus(422);
    }

    public function test_pending_payment_cannot_become_paid_when_another_is_paid(): void
    {
        $booking = $this->booking('confirmed');
        $this->pay($booking);
        $pending = $this->pay($booking, 'pending');
        $this->actAs('staff');

        $this->putJson("/api/payments/{$pending->id}", ['payment_status' => 'paid'])->assertStatus(422);
    }

    public function test_payment_list_includes_customer_and_car(): void
    {
        $booking = $this->booking();
        $this->pay($booking, 'pending');
        $this->actAs('staff');

        $this->getJson('/api/payments')
            ->assertOk()
            ->assertJsonPath('data.0.booking.user.email', $booking->user->email)
            ->assertJsonPath('data.0.booking.car.model', $booking->car->model);
    }
}
