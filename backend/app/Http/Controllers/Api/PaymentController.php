<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\RespondsWithErrors;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingLifecycle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Back-office payment records. Creating and deleting is admin-only (see
 * routes); staff may only move a payment along STATUS_TRANSITIONS. paid_at
 * is always set by the server.
 */
class PaymentController extends Controller
{
    use RespondsWithErrors;

    private const RELATIONS = ['booking.user:id,name,email', 'booking.car:id,brand,model,license_plate'];

    private const STATUS_TRANSITIONS = [
        'pending' => ['paid', 'failed'],
        'paid' => ['refunded'],
    ];

    public function __construct(private readonly BookingLifecycle $lifecycle) {}

    public function index()
    {
        $payments = Payment::with(self::RELATIONS)->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'nullable|numeric|min:0|max:1000000',
            'payment_method' => 'required|in:cash,card,online',
            'payment_status' => 'required|in:pending,paid,failed,refunded',
            'transaction_reference' => 'nullable|string|max:255',
        ]);

        $result = DB::transaction(function () use ($validated) {
            $booking = Booking::whereKey($validated['booking_id'])->lockForUpdate()->firstOrFail();

            if ($validated['payment_status'] === 'paid' && $reason = $this->cannotTakePayment($booking)) {
                return $reason;
            }

            return Payment::create([
                ...$validated,
                'amount' => $validated['amount'] ?? $booking->total_amount,
                'paid_at' => $validated['payment_status'] === 'paid' ? now() : null,
            ]);
        });

        if (is_string($result)) {
            return $this->unprocessable($result);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment created successfully',
            'data' => $result->load(self::RELATIONS),
        ], 201);
    }

    public function show(Payment $payment)
    {
        $payment->load(self::RELATIONS);

        return response()->json([
            'success' => true,
            'data' => $payment,
        ]);
    }

    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'amount' => 'sometimes|required|numeric|min:0|max:1000000',
            'payment_method' => 'sometimes|required|in:cash,card,online',
            'payment_status' => 'sometimes|required|in:pending,paid,failed,refunded',
            'transaction_reference' => 'nullable|string|max:255',
        ]);

        $from = $payment->payment_status;
        $to = $validated['payment_status'] ?? $from;

        if ($from !== $to && ! in_array($to, self::STATUS_TRANSITIONS[$from] ?? [], true)) {
            return $this->unprocessable("A {$from} payment cannot be changed to {$to}.", [
                'payment_status' => ["A {$from} payment cannot be changed to {$to}."],
            ]);
        }

        $result = DB::transaction(function () use ($payment, $validated, $from, $to) {
            $booking = Booking::whereKey($payment->booking_id)->lockForUpdate()->firstOrFail();
            $becomesPaid = $from !== 'paid' && $to === 'paid';

            if ($becomesPaid && $reason = $this->cannotTakePayment($booking)) {
                return $reason;
            }

            $payment->update([...$validated, ...($becomesPaid ? ['paid_at' => now()] : [])]);

            return $payment;
        });

        if (is_string($result)) {
            return $this->unprocessable($result);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment updated successfully',
            'data' => $result->load(self::RELATIONS),
        ]);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment deleted successfully',
        ]);
    }

    /** Why the booking cannot get a(nother) paid payment, or null when it can. */
    private function cannotTakePayment(Booking $booking): ?string
    {
        if (in_array($booking->status, ['cancelled', 'completed'], true)) {
            return "A {$booking->status} booking cannot be marked as paid.";
        }

        if ($this->lifecycle->hasPaidPayment($booking)) {
            return 'This booking already has a paid payment.';
        }

        return null;
    }
}
