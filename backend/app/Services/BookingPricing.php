<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Car;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Server-side booking price: daily rate x days, plus add-ons, minus discount.
 * subtotal is the rental alone; total_amount is what the customer pays.
 */
class BookingPricing
{
    /**
     * Price snapshot for a car and date range. Same-day rentals count as one day.
     *
     * @return array{daily_rate: float, total_days: int, subtotal: float, discount: float, total_amount: float}
     */
    public function quote(Car $car, string $pickupDate, string $returnDate, float $discount, float $addonsTotal = 0.0): array
    {
        $days = max(1, (int) Carbon::parse($pickupDate)->diffInDays(Carbon::parse($returnDate)));
        $rate = (float) $car->daily_rate;
        $subtotal = round($rate * $days, 2);

        return [
            'daily_rate' => $rate,
            'total_days' => $days,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total_amount' => round($subtotal + $addonsTotal - $discount, 2),
        ];
    }

    public function addonsTotal(Booking $booking): float
    {
        return round((float) $booking->addons()->sum(DB::raw('price * quantity')), 2);
    }

    /** The booking's total after its add-ons changed; the rental price itself is kept. */
    public function totalWithAddons(Booking $booking): float
    {
        return round((float) $booking->subtotal + $this->addonsTotal($booking) - (float) $booking->discount, 2);
    }
}
