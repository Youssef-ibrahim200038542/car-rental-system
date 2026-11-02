<?php

namespace App\Services;

use App\Models\Booking;

/**
 * Which status a booking may move to, and what cancelling does to its money.
 */
class BookingLifecycle
{
    /** Allowed next statuses; completed and cancelled are final. */
    private const TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['active', 'cancelled'],
        'active' => ['completed', 'cancelled'],
    ];

    public function canMove(string $from, string $to): bool
    {
        return $from === $to || in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    /**
     * Cancels the booking and keeps revenue honest: paid money is refunded and
     * pending money is never collected. Call inside a transaction.
     */
    public function cancel(Booking $booking): void
    {
        $booking->update(['status' => 'cancelled']);

        $booking->payments()->where('payment_status', 'paid')->update(['payment_status' => 'refunded']);
        $booking->payments()->where('payment_status', 'pending')->update(['payment_status' => 'failed']);
    }

    public function hasPaidPayment(Booking $booking): bool
    {
        return $booking->payments()->where('payment_status', 'paid')->exists();
    }
}
