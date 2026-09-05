<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookingAddon;
use Illuminate\Http\Request;

class BookingAddonController extends Controller
{
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
            'price' => 'required|numeric|min:0',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $addon = BookingAddon::create($validated);

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
            'price' => 'sometimes|required|numeric|min:0',
            'quantity' => 'sometimes|required|integer|min:1',
        ]);

        $bookingAddon->update($validated);

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
        $bookingAddon->delete();

        return response()->json([
            'success' => true,
            'message' => 'Booking addon deleted successfully',
        ]);
    }
}