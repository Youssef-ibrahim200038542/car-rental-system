<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\RespondsWithErrors;
use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CarController extends Controller
{
    use RespondsWithErrors;

    /**
     * Display a listing of cars.
     */
    public function index()
    {
        $cars = Car::with(['category', 'branch'])->get();

        return response()->json([
            'success' => true,
            'data' => $cars,
        ]);
    }

    /**
     * Store a newly created car.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:car_categories,id',
            'branch_id' => 'required|exists:branches,id',
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'year' => 'required|integer|min:1901|max:'.(date('Y') + 1),
            'color' => 'nullable|string|max:100',
            'license_plate' => 'required|string|max:50|unique:cars,license_plate',
            'vin' => 'required|string|max:100|unique:cars,vin',
            'mileage' => 'nullable|integer|min:0|max:4294967295',
            'fuel_type' => 'required|in:petrol,diesel,hybrid,electric',
            'transmission' => 'required|in:manual,automatic',
            'seats' => 'required|integer|min:1|max:20',
            'daily_rate' => 'required|numeric|min:0|max:99999999.99',
            'status' => 'nullable|in:available,maintenance,inactive',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'description' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')
                ->store('cars', 'public');
        }

        // The column is NOT NULL DEFAULT 0, so an explicit null means "no mileage recorded".
        $validated['mileage'] = $validated['mileage'] ?? 0;

        $car = Car::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Car created successfully',
            'data' => $car->load(['category', 'branch']),
        ], 201);
    }

    /**
     * Whether the car can be booked for the given dates.
     */
    public function availability(Request $request, Car $car)
    {
        $validated = $request->validate([
            'pickup_date' => 'required|date_format:Y-m-d',
            'return_date' => 'required|date_format:Y-m-d|after_or_equal:pickup_date',
        ]);

        $reason = $car->unavailabilityReason($validated['pickup_date'], $validated['return_date']);

        return response()->json([
            'success' => true,
            'data' => array_filter([
                'available' => $reason === null,
                'reason' => $reason,
            ], fn ($value) => $value !== null),
        ]);
    }

    /**
     * Display the specified car.
     */
    public function show(Car $car)
    {
        $viewer = auth('sanctum')->user();
        $isStaff = $viewer && in_array($viewer->role, ['admin', 'staff'], true);

        // Public route: reviewer contact details and maintenance costs are staff-only.
        $car->load($isStaff
            ? ['category', 'branch', 'reviews.user', 'maintenanceRecords']
            : ['category', 'branch', 'reviews.user:id,name,avatar']);

        return response()->json([
            'success' => true,
            'data' => $car,
        ]);
    }

    /**
     * Update the specified car.
     */
    public function update(Request $request, Car $car)
    {
        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:car_categories,id',
            'branch_id' => 'sometimes|required|exists:branches,id',
            'brand' => 'sometimes|required|string|max:255',
            'model' => 'sometimes|required|string|max:255',
            'year' => 'sometimes|required|integer|min:1901|max:'.(date('Y') + 1),
            'color' => 'nullable|string|max:100',
            'license_plate' => 'sometimes|required|string|max:50|unique:cars,license_plate,'.$car->id,
            'vin' => 'sometimes|required|string|max:100|unique:cars,vin,'.$car->id,
            'mileage' => 'nullable|integer|min:0|max:4294967295',
            'fuel_type' => 'sometimes|required|in:petrol,diesel,hybrid,electric',
            'transmission' => 'sometimes|required|in:manual,automatic',
            'seats' => 'sometimes|required|integer|min:1|max:20',
            'daily_rate' => 'sometimes|required|numeric|min:0|max:99999999.99',
            'status' => 'sometimes|in:available,maintenance,inactive',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'description' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            if ($car->image) {
                Storage::disk('public')->delete($car->image);
            }

            $validated['image'] = $request->file('image')
                ->store('cars', 'public');
        }

        if (array_key_exists('mileage', $validated)) {
            $validated['mileage'] = $validated['mileage'] ?? 0;
        }

        $car->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Car updated successfully',
            'data' => $car->load(['category', 'branch']),
        ]);
    }

    /**
     * Remove the specified car.
     */
    public function destroy(Car $car)
    {
        if ($car->bookings()->exists() || $car->maintenanceRecords()->exists() || $car->reviews()->exists()) {
            return $this->unprocessable('Cannot delete this car because it has bookings, maintenance records or reviews. Set it to inactive instead.');
        }

        if ($car->image) {
            Storage::disk('public')->delete($car->image);
        }

        $car->delete();

        return response()->json([
            'success' => true,
            'message' => 'Car deleted successfully',
        ]);
    }
}
