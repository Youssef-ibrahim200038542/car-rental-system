<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
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

        $this->syncCarStatus($maintenance->car_id);

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

        $oldCarId = $maintenance->car_id;

        $maintenance->update($validated);

        $this->syncCarStatus($maintenance->car_id);

        if ($oldCarId !== $maintenance->car_id) {
            $this->syncCarStatus($oldCarId);
        }

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record updated successfully',
            'data' => $maintenance->load('car'),
        ]);
    }

    public function destroy(Maintenance $maintenance)
    {
        $maintenance->delete();

        $this->syncCarStatus($maintenance->car_id);

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record deleted successfully',
        ]);
    }

    /**
     * Open maintenance puts the car in the workshop; once none is open it is available again.
     * Inactive cars are left alone.
     */
    private function syncCarStatus(int $carId): void
    {
        $car = Car::find($carId);

        if (! $car || $car->status === 'inactive') {
            return;
        }

        $hasOpenMaintenance = $car->maintenanceRecords()
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->exists();

        if ($hasOpenMaintenance) {
            $car->update(['status' => 'maintenance']);
        } elseif ($car->status === 'maintenance') {
            $car->update(['status' => 'available']);
        }
    }
}
