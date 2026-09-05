<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Maintenance;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function index()
    {
        $maintenance = Maintenance::with('car')->get();

        return response()->json([
            'success' => true,
            'data' => $maintenance,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'car_id' => 'required|exists:cars,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cost' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
        ]);

        $maintenance = Maintenance::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record created successfully',
            'data' => $maintenance->load('car'),
        ], 201);
    }

    public function show(Maintenance $maintenance)
    {
        $maintenance->load('car');

        return response()->json([
            'success' => true,
            'data' => $maintenance,
        ]);
    }

    public function update(Request $request, Maintenance $maintenance)
    {
        $validated = $request->validate([
            'car_id' => 'sometimes|required|exists:cars,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'cost' => 'sometimes|required|numeric|min:0',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'nullable|date',
            'status' => 'sometimes|required|in:scheduled,in_progress,completed,cancelled',
        ]);

        $maintenance->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record updated successfully',
            'data' => $maintenance->load('car'),
        ]);
    }

    public function destroy(Maintenance $maintenance)
    {
        $maintenance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record deleted successfully',
        ]);
    }
}