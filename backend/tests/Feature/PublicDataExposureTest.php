<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regression tests for the security audit: public endpoints must not leak
 * customer contact details, booking finances or non-ISO date tricks.
 */
class PublicDataExposureTest extends TestCase
{
    use RefreshDatabase;

    private function reviewedCar(): array
    {
        $customer = User::factory()->create(['phone' => '01000000000']);
        $car = Car::factory()->create();
        $branch = Branch::factory()->create();

        $booking = Booking::create([
            'user_id' => $customer->id,
            'car_id' => $car->id,
            'pickup_branch_id' => $branch->id,
            'dropoff_branch_id' => $branch->id,
            'pickup_date' => now()->subDays(5)->toDateString(),
            'return_date' => now()->subDays(2)->toDateString(),
            'daily_rate' => 1000,
            'total_days' => 3,
            'subtotal' => 3000,
            'discount' => 0,
            'total_amount' => 3000,
            'status' => 'completed',
        ]);

        $review = Review::create([
            'user_id' => $customer->id,
            'car_id' => $car->id,
            'booking_id' => $booking->id,
            'rating' => 5,
            'comment' => 'Great',
        ]);

        return [$customer, $car, $review];
    }

    public function test_guests_do_not_see_reviewer_contact_or_booking(): void
    {
        [$customer, $car, $review] = $this->reviewedCar();

        $this->getJson('/api/reviews')
            ->assertOk()
            ->assertJsonPath('data.0.user.name', $customer->name)
            ->assertJsonMissingPath('data.0.user.email')
            ->assertJsonMissingPath('data.0.user.phone')
            ->assertJsonMissingPath('data.0.booking');

        $this->getJson("/api/reviews/{$review->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.user.email')
            ->assertJsonMissingPath('data.booking');

        $this->getJson("/api/cars/{$car->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.reviews.0.user.email')
            ->assertJsonMissingPath('data.maintenance_records');
    }

    public function test_staff_still_see_review_details_for_moderation(): void
    {
        [$customer] = $this->reviewedCar();
        Sanctum::actingAs(User::factory()->role('staff')->create());

        $this->getJson('/api/reviews')
            ->assertOk()
            ->assertJsonPath('data.0.user.email', $customer->email)
            ->assertJsonPath('data.0.booking.status', 'completed');
    }

    public function test_non_iso_dates_cannot_bypass_the_overlap_check(): void
    {
        $car = Car::factory()->create();
        $branch = Branch::factory()->create();
        $pickup = now()->addDays(10);

        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/bookings', [
            'car_id' => $car->id,
            'pickup_branch_id' => $branch->id,
            'dropoff_branch_id' => $branch->id,
            'pickup_date' => $pickup->toDateString(),
            'return_date' => $pickup->copy()->addDays(2)->toDateString(),
        ])->assertCreated();

        $slashed = $pickup->copy()->addDay()->format('Y/m/d');

        $this->postJson('/api/bookings', [
            'car_id' => $car->id,
            'pickup_branch_id' => $branch->id,
            'dropoff_branch_id' => $branch->id,
            'pickup_date' => $slashed,
            'return_date' => $slashed,
        ])->assertUnprocessable();

        $this->getJson("/api/cars/{$car->id}/availability?pickup_date={$slashed}&return_date={$slashed}")
            ->assertUnprocessable();

        $this->assertSame(1, Booking::count());
    }

    public function test_huge_numbers_are_rejected_instead_of_crashing(): void
    {
        $this->postJson('/api/ml/recommendations', ['budget' => 1e30])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('budget');

        // Raw JSON 1e400 decodes to INF in PHP; it must be a 422, not a 500.
        $this->call('POST', '/api/ml/recommendations', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], '{"budget":1e400}')->assertUnprocessable();
    }
}
