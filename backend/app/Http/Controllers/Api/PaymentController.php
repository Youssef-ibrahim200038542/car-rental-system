<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index()
    {
        $payments = Payment::with('booking')->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|max:50',
            'payment_status' => 'required|in:pending,paid,failed,refunded',
            'transaction_reference' => 'nullable|string|max:255',
            'paid_at' => 'nullable|date',
        ]);

        $payment = Payment::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Payment created successfully',
            'data' => $payment->load('booking'),
        ], 201);
    }

    public function show(Payment $payment)
    {
        $payment->load('booking');

        return response()->json([
            'success' => true,
            'data' => $payment,
        ]);
    }

    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'booking_id' => 'sometimes|required|exists:bookings,id',
            'amount' => 'sometimes|required|numeric|min:0',
            'payment_method' => 'sometimes|required|string|max:50',
            'payment_status' => 'sometimes|required|in:pending,paid,failed,refunded',
            'transaction_reference' => 'nullable|string|max:255',
            'paid_at' => 'nullable|date',
        ]);

        $payment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Payment updated successfully',
            'data' => $payment->load('booking'),
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
}