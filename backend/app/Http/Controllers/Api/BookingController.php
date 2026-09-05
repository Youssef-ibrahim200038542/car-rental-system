<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::with([
            'user',
            'car',
            'pickupBranch',
            'dropoffBranch',
            'payments',
            'review',
            'addons',
        ])->get();

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'car_id' => 'required|exists:cars,id',
            'pickup_branch_id' => 'required|exists:branches,id',
            'dropoff_branch_id' => 'required|exists:branches,id',
            'pickup_date' => 'required|date',
            'return_date' => 'required|date|after_or_equal:pickup_date',
            'daily_rate' => 'required|numeric|min:0',
            'total_days' => 'required|integer|min:1',
            'subtotal' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'nullable|in:pending,confirmed,active,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $car = Car::findOrFail($validated['car_id']);

        if (in_array($car->status, ['maintenance', 'inactive'])) {
            return response()->json([
                'success' => false,
                'message' => 'This car is currently unavailable for booking.',
            ], 422);
        }

        $hasConflict = Booking::where('car_id', $validated['car_id'])
            ->whereIn('status', [
                'pending',
                'confirmed',
                'active',
            ])
            ->where(function ($query) use ($validated) {
                $query
                    ->where('pickup_date', '<=', $validated['return_date'])
                    ->where('return_date', '>=', $validated['pickup_date']);
            })
            ->exists();

        if ($hasConflict) {
            return response()->json([
                'success' => false,
                'message' => 'This car is already booked during the selected dates.',
            ], 422);
        }

        $booking = Booking::create($validated);

        $this->syncCarStatus($booking);

        return response()->json([
            'success' => true,
            'message' => 'Booking created successfully',
            'data' => $booking->load([
                'user',
                'car',
                'pickupBranch',
                'dropoffBranch',
            ]),
        ], 201);
    }

    public function show(Booking $booking)
    {
        $booking->load([
            'user',
            'car',
            'pickupBranch',
            'dropoffBranch',
            'payments',
            'review',
            'addons',
        ]);

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'user_id' => 'sometimes|required|exists:users,id',
            'car_id' => 'sometimes|required|exists:cars,id',
            'pickup_branch_id' => 'sometimes|required|exists:branches,id',
            'dropoff_branch_id' => 'sometimes|required|exists:branches,id',
            'pickup_date' => 'sometimes|required|date',
            'return_date' => 'sometimes|required|date|after_or_equal:pickup_date',
            'daily_rate' => 'sometimes|required|numeric|min:0',
            'total_days' => 'sometimes|required|integer|min:1',
            'subtotal' => 'sometimes|required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'total_amount' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|in:pending,confirmed,active,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $oldCarId = $booking->car_id;

        $carId = $validated['car_id'] ?? $booking->car_id;
        $pickupDate = $validated['pickup_date'] ?? $booking->pickup_date;
        $returnDate = $validated['return_date'] ?? $booking->return_date;
        $status = $validated['status'] ?? $booking->status;

        if (in_array($status, ['pending', 'confirmed', 'active'])) {
            $car = Car::findOrFail($carId);

            if (in_array($car->status, ['maintenance', 'inactive'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'This car is currently unavailable for booking.',
                ], 422);
            }

            $hasConflict = Booking::where('car_id', $carId)
                ->where('id', '!=', $booking->id)
                ->whereIn('status', [
                    'pending',
                    'confirmed',
                    'active',
                ])
                ->where(function ($query) use ($pickupDate, $returnDate) {
                    $query
                        ->where('pickup_date', '<=', $returnDate)
                        ->where('return_date', '>=', $pickupDate);
                })
                ->exists();

            if ($hasConflict) {
                return response()->json([
                    'success' => false,
                    'message' => 'This car is already booked during the selected dates.',
                ], 422);
            }
        }

        $booking->update($validated);

        if ($oldCarId != $booking->car_id) {
            $oldCar = Car::find($oldCarId);

            if ($oldCar && !in_array($oldCar->status, ['maintenance', 'inactive'])) {
                $oldCar->update([
                    'status' => 'available',
                ]);
            }
        }

        $this->syncCarStatus($booking);

        return response()->json([
            'success' => true,
            'message' => 'Booking updated successfully',
            'data' => $booking->load([
                'user',
                'car',
                'pickupBranch',
                'dropoffBranch',
            ]),
        ]);
    }

    public function destroy(Booking $booking)
    {
        $car = $booking->car;

        $booking->delete();

        if ($car && !in_array($car->status, ['maintenance', 'inactive'])) {
            $car->update([
                'status' => 'available',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking deleted successfully',
        ]);
    }

    private function syncCarStatus(Booking $booking)
    {
        $car = $booking->car;

        if (!$car) {
            return;
        }

        if (in_array($car->status, ['maintenance', 'inactive'])) {
            return;
        }

        $newStatus = match ($booking->status) {
            'confirmed' => 'reserved',
            'active' => 'rented',
            'completed', 'cancelled', 'pending' => 'available',
            default => 'available',
        };

        $car->update([
            'status' => $newStatus,
        ]);
    }
}
