<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CarController extends Controller
{
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
            'year' => 'required|integer|min:1900|max:' . date('Y'),
            'color' => 'nullable|string|max:100',
            'license_plate' => 'required|string|max:50|unique:cars,license_plate',
            'vin' => 'required|string|max:100|unique:cars,vin',
            'mileage' => 'nullable|integer|min:0',
            'fuel_type' => 'required|in:petrol,diesel,hybrid,electric',
            'transmission' => 'required|in:manual,automatic',
            'seats' => 'required|integer|min:1|max:20',
            'daily_rate' => 'required|numeric|min:0',
            'status' => 'nullable|in:available,reserved,rented,maintenance,inactive',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'description' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')
                ->store('cars', 'public');
        }

        $car = Car::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Car created successfully',
            'data' => $car->load(['category', 'branch']),
        ], 201);
    }

    /**
     * Display the specified car.
     */
    public function show(Car $car)
    {
        $car->load([
            'category',
            'branch',
            'reviews.user',
            'maintenanceRecords',
        ]);

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
            'year' => 'sometimes|required|integer|min:1900|max:' . date('Y'),
            'color' => 'nullable|string|max:100',
            'license_plate' => 'sometimes|required|string|max:50|unique:cars,license_plate,' . $car->id,
            'vin' => 'sometimes|required|string|max:100|unique:cars,vin,' . $car->id,
            'mileage' => 'nullable|integer|min:0',
            'fuel_type' => 'sometimes|required|in:petrol,diesel,hybrid,electric',
            'transmission' => 'sometimes|required|in:manual,automatic',
            'seats' => 'sometimes|required|integer|min:1|max:20',
            'daily_rate' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|in:available,reserved,rented,maintenance,inactive',
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
