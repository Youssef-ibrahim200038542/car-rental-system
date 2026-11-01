<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    private const RELATIONS = [
        'user',
        'car',
        'pickupBranch',
        'dropoffBranch',
        'payments',
        'review',
        'addons',
    ];

    public function index(Request $request)
    {
        $bookings = Booking::with(self::RELATIONS)
            ->when(
                ! $this->isStaff($request),
                fn ($query) => $query->where('user_id', $request->user()->id)
            )
            ->get();

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'car_id' => 'required|exists:cars,id',
            'pickup_branch_id' => 'required|exists:branches,id',
            'dropoff_branch_id' => 'required|exists:branches,id',
            'pickup_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'return_date' => 'required|date_format:Y-m-d|after_or_equal:pickup_date',
            'notes' => 'nullable|string',
        ]);

        $result = DB::transaction(function () use ($validated, $request) {
            $car = Car::whereKey($validated['car_id'])->lockForUpdate()->firstOrFail();

            $reason = $car->unavailabilityReason($validated['pickup_date'], $validated['return_date']);

            if ($reason) {
                return $reason;
            }

            return Booking::create([
                ...$validated,
                ...$this->pricing($car, $validated['pickup_date'], $validated['return_date'], 0),
                'user_id' => $request->user()->id,
                'status' => 'pending',
            ]);
        });

        if (is_string($result)) {
            return $this->unprocessable($result);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking created successfully',
            'data' => $result->load(self::RELATIONS),
        ], 201);
    }

    public function show(Request $request, Booking $booking)
    {
        if (! $this->canAccess($request, $booking)) {
            return $this->forbidden('You can only view your own bookings.');
        }

        return response()->json([
            'success' => true,
            'data' => $booking->load(self::RELATIONS),
        ]);
    }

    /**
     * Admin/staff update. Prices are recomputed server-side only when the car,
     * dates or discount change, so a notes/status edit keeps the agreed price.
     */
    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'car_id' => 'sometimes|required|exists:cars,id',
            'pickup_branch_id' => 'sometimes|required|exists:branches,id',
            'dropoff_branch_id' => 'sometimes|required|exists:branches,id',
            'pickup_date' => 'sometimes|required|date_format:Y-m-d',
            'return_date' => 'sometimes|required|date_format:Y-m-d',
            'discount' => 'sometimes|nullable|numeric|min:0|max:1000000',
            'status' => 'sometimes|required|in:pending,confirmed,active,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $carId = $validated['car_id'] ?? $booking->car_id;
        $pickupDate = $validated['pickup_date'] ?? $booking->pickup_date->toDateString();
        $returnDate = $validated['return_date'] ?? $booking->return_date->toDateString();
        $status = $validated['status'] ?? $booking->status;
        $discount = (float) ($validated['discount'] ?? $booking->discount);

        if ($returnDate < $pickupDate) {
            return $this->unprocessable('The return date must be on or after the pickup date.', [
                'return_date' => ['The return date must be on or after the pickup date.'],
            ]);
        }

        $scheduleChanged = array_intersect_key($validated, array_flip(['car_id', 'pickup_date', 'return_date'])) !== [];
        $priceChanged = $scheduleChanged || array_key_exists('discount', $validated);
        $reactivating = in_array($status, Booking::BLOCKING_STATUSES, true)
            && ! in_array($booking->status, Booking::BLOCKING_STATUSES, true);

        $result = DB::transaction(function () use ($booking, $validated, $carId, $pickupDate, $returnDate, $status, $discount, $scheduleChanged, $priceChanged, $reactivating) {
            $car = Car::whereKey($carId)->lockForUpdate()->firstOrFail();

            $needsAvailabilityCheck = in_array($status, Booking::BLOCKING_STATUSES, true)
                && ($scheduleChanged || $reactivating);

            if ($needsAvailabilityCheck) {
                $reason = $car->unavailabilityReason($pickupDate, $returnDate, $booking->id);

                if ($reason) {
                    return $reason;
                }
            }

            $pricing = [];

            if ($priceChanged) {
                $pricing = $this->pricing($car, $pickupDate, $returnDate, $discount);

                if ($pricing['total_amount'] < 0) {
                    return 'The discount cannot exceed the booking subtotal.';
                }
            }

            $booking->update([...$validated, ...$pricing]);

            return $booking;
        });

        if (is_string($result)) {
            return $this->unprocessable($result);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking updated successfully',
            'data' => $result->load(self::RELATIONS),
        ]);
    }

    public function cancel(Request $request, Booking $booking)
    {
        $isStaff = $this->isStaff($request);

        if (! $isStaff && $booking->user_id !== $request->user()->id) {
            return $this->forbidden('You can only cancel your own bookings.');
        }

        $cancellable = $isStaff
            ? ['pending', 'confirmed', 'active']
            : ['pending', 'confirmed'];

        if (! in_array($booking->status, $cancellable, true)) {
            return $this->unprocessable("A {$booking->status} booking cannot be cancelled.");
        }

        DB::transaction(function () use ($booking) {
            $booking->update(['status' => 'cancelled']);

            // Keep revenue honest: a cancelled booking's money is refunded / never collected.
            $booking->payments()->where('payment_status', 'paid')->update(['payment_status' => 'refunded']);
            $booking->payments()->where('payment_status', 'pending')->update(['payment_status' => 'failed']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Booking cancelled successfully',
            'data' => $booking->load(self::RELATIONS),
        ]);
    }

    /**
     * Simulated payment: card/online are marked paid immediately, cash stays pending until pickup.
     */
    public function pay(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            return $this->forbidden('You can only pay for your own bookings.');
        }

        $validated = $request->validate([
            'payment_method' => 'required|in:cash,card,online',
        ]);

        $result = DB::transaction(function () use ($booking, $validated) {
            $booking = Booking::whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if (in_array($booking->status, ['cancelled', 'completed'], true)) {
                return "A {$booking->status} booking cannot be paid.";
            }

            if ($booking->payments()->where('payment_status', 'paid')->exists()) {
                return 'This booking has already been paid.';
            }

            if ($booking->payments()->where('payment_status', 'pending')->where('payment_method', 'cash')->exists()) {
                return 'A cash payment is already pending for this booking.';
            }

            $isCash = $validated['payment_method'] === 'cash';

            $payment = Payment::create([
                'booking_id' => $booking->id,
                'amount' => $booking->total_amount,
                'payment_method' => $validated['payment_method'],
                'payment_status' => $isCash ? 'pending' : 'paid',
                'transaction_reference' => 'TXN-'.Str::upper(Str::random(10)),
                'paid_at' => $isCash ? null : now(),
            ]);

            // Paying confirms a pending booking; an active rental stays active.
            if ($booking->status === 'pending') {
                $booking->update(['status' => 'confirmed']);
            }

            return compact('booking', 'payment');
        });

        if (is_string($result)) {
            return $this->unprocessable($result);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'data' => [
                'booking' => $result['booking']->load(self::RELATIONS),
                'payment' => $result['payment'],
            ],
        ], 201);
    }

    public function destroy(Booking $booking)
    {
        if ($booking->payments()->exists() || $booking->review()->exists() || $booking->addons()->exists()) {
            return $this->unprocessable('Cannot delete this booking because it has payments, a review or add-ons. Cancel it instead.');
        }

        $booking->delete();

        return response()->json([
            'success' => true,
            'message' => 'Booking deleted successfully',
        ]);
    }

    /**
     * Server-side price snapshot. Same-day rentals count as one day.
     */
    private function pricing(Car $car, string $pickupDate, string $returnDate, float $discount): array
    {
        $days = max(1, (int) Carbon::parse($pickupDate)->diffInDays(Carbon::parse($returnDate)));
        $rate = (float) $car->daily_rate;
        $subtotal = round($rate * $days, 2);

        return [
            'daily_rate' => $rate,
            'total_days' => $days,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total_amount' => round($subtotal - $discount, 2),
        ];
    }

    private function isStaff(Request $request): bool
    {
        return in_array($request->user()->role, ['admin', 'staff'], true);
    }

    private function canAccess(Request $request, Booking $booking): bool
    {
        return $this->isStaff($request) || $booking->user_id === $request->user()->id;
    }

    private function forbidden(string $message)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 403);
    }

    private function unprocessable(string $message, array $errors = [])
    {
        return response()->json(array_filter([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], fn ($value) => $value !== []), 422);
    }
}
