<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CarCategory;
use Illuminate\Http\Request;

class CarCategoryController extends Controller
{
    /**
     * Display a listing of car categories.
     */
    public function index()
    {
        $categories = CarCategory::with('cars')->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Store a newly created car category.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:car_categories,name',
            'description' => 'nullable|string',
            'daily_rate' => 'required|numeric|min:0',
        ]);

        $category = CarCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Car category created successfully',
            'data' => $category,
        ], 201);
    }

    /**
     * Display the specified car category.
     */
    public function show(CarCategory $carCategory)
    {
        $carCategory->load('cars');

        return response()->json([
            'success' => true,
            'data' => $carCategory,
        ]);
    }

    /**
     * Update the specified car category.
     */
    public function update(Request $request, CarCategory $carCategory)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:car_categories,name,' . $carCategory->id,
            'description' => 'nullable|string',
            'daily_rate' => 'sometimes|required|numeric|min:0',
        ]);

        $carCategory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Car category updated successfully',
            'data' => $carCategory,
        ]);
    }

    /**
     * Remove the specified car category.
     */
    public function destroy(CarCategory $carCategory)
    {
        $carCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Car category deleted successfully',
        ]);
    }
}