<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\RespondsWithErrors;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingAddon;
use App\Services\BookingLifecycle;
use App\Services\BookingPricing;
use Closure;
use DomainException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Add-ons are charged: every change re-totals the booking. Bookings that are
 * paid, cancelled or completed are closed to add-on changes.
 */
class BookingAddonController extends Controller
{
    use RespondsWithErrors;

    public function __construct(
        private readonly BookingPricing $pricing,
        private readonly BookingLifecycle $lifecycle,
    ) {}

    /**
     * Display a listing of booking addons.
     */
    public function index()
    {
        $addons = BookingAddon::with('booking')->get();

        return response()->json([
            'success' => true,
            'data' => $addons,
        ]);
    }

    /**
     * Store a newly created booking addon.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0|max:99999999.99',
            'quantity' => 'nullable|integer|min:1|max:1000',
        ]);

        $addon = $this->changeAddons([(int) $validated['booking_id']], fn () => BookingAddon::create([
            ...$validated,
            'quantity' => $validated['quantity'] ?? 1,
        ]));

        if (is_string($addon)) {
            return $this->unprocessable($addon);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking addon created successfully',
            'data' => $addon->load('booking'),
        ], 201);
    }

    /**
     * Display the specified booking addon.
     */
    public function show(BookingAddon $bookingAddon)
    {
        $bookingAddon->load('booking');

        return response()->json([
            'success' => true,
            'data' => $bookingAddon,
        ]);
    }

    /**
     * Update the specified booking addon.
     */
    public function update(Request $request, BookingAddon $bookingAddon)
    {
        $validated = $request->validate([
            'booking_id' => 'sometimes|required|exists:bookings,id',
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0|max:99999999.99',
            'quantity' => 'sometimes|required|integer|min:1|max:1000',
        ]);

        $bookingIds = array_unique([(int) $bookingAddon->booking_id, (int) ($validated['booking_id'] ?? $bookingAddon->booking_id)]);
        $result = $this->changeAddons($bookingIds, fn () => $bookingAddon->update($validated));

        if (is_string($result)) {
            return $this->unprocessable($result);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking addon updated successfully',
            'data' => $bookingAddon->load('booking'),
        ]);
    }

    /**
     * Remove the specified booking addon.
     */
    public function destroy(BookingAddon $bookingAddon)
    {
        $result = $this->changeAddons([(int) $bookingAddon->booking_id], fn () => $bookingAddon->delete());

        if (is_string($result)) {
            return $this->unprocessable($result);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking addon deleted successfully',
        ]);
    }

    /**
     * Runs the add-on change and re-totals every affected booking in one
     * transaction, or returns why the change is not allowed.
     *
     * @param  int[]  $bookingIds
     */
    private function changeAddons(array $bookingIds, Closure $change): mixed
    {
        try {
            return DB::transaction(function () use ($bookingIds, $change) {
                $bookings = Booking::whereKey($bookingIds)->lockForUpdate()->get();

                foreach ($bookings as $booking) {
                    if ($reason = $this->closedReason($booking)) {
                        return $reason;
                    }
                }

                $result = $change();

                foreach ($bookings as $booking) {
                    $total = $this->pricing->totalWithAddons($booking);

                    if ($total < 0) {
                        // Thrown, not returned, so the add-on change is rolled back.
                        throw new DomainException('The discount cannot exceed the booking subtotal.');
                    }

                    $booking->update(['total_amount' => $total]);
                }

                return $result;
            });
        } catch (DomainException $e) {
            return $e->getMessage();
        }
    }

    private function closedReason(Booking $booking): ?string
    {
        if (in_array($booking->status, ['cancelled', 'completed'], true)) {
            return "Add-ons cannot be changed on a {$booking->status} booking.";
        }

        if ($this->lifecycle->hasPaidPayment($booking)) {
            return 'This booking is already paid. Refund or adjust the payment first.';
        }

        return null;
    }
}
