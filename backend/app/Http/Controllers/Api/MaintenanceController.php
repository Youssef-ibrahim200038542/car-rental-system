<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\RespondsWithErrors;
use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Maintenance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MaintenanceController extends Controller
{
    use RespondsWithErrors;

    private const OPEN_STATUSES = ['scheduled', 'in_progress'];

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
            'cost' => 'required|numeric|min:0|max:99999999.99',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
        ]);

        $maintenance = DB::transaction(function () use ($validated) {
            $maintenance = Maintenance::create($validated);

            $this->syncCarStatus((int) $maintenance->car_id);

            return $maintenance;
        });

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
            'cost' => 'sometimes|required|numeric|min:0|max:99999999.99',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'nullable|date',
            'status' => 'sometimes|required|in:scheduled,in_progress,completed,cancelled',
        ]);

        // A partial update may move only one end of the range, so check it against the stored other end.
        $startDate = $validated['start_date'] ?? $maintenance->start_date;
        $endDate = array_key_exists('end_date', $validated) ? $validated['end_date'] : $maintenance->end_date;

        if ($endDate !== null && Carbon::parse($endDate)->startOfDay()->lt(Carbon::parse($startDate)->startOfDay())) {
            return $this->unprocessable('The end date must be on or after the start date.', [
                'end_date' => ['The end date must be on or after the start date.'],
            ]);
        }

        $oldCarId = (int) $maintenance->car_id;

        DB::transaction(function () use ($maintenance, $validated, $oldCarId) {
            $maintenance->update($validated);

            $newCarId = (int) $maintenance->car_id;
            $this->syncCarStatus($newCarId);

            if ($oldCarId !== $newCarId) {
                $this->syncCarStatus($oldCarId);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record updated successfully',
            'data' => $maintenance->load('car'),
        ]);
    }

    public function destroy(Maintenance $maintenance)
    {
        DB::transaction(function () use ($maintenance) {
            $maintenance->delete();

            $this->syncCarStatus((int) $maintenance->car_id);
        });

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record deleted successfully',
        ]);
    }

    /**
     * Open maintenance puts the car in the workshop. Once none is open, a car
     * still marked maintenance goes back to available; any other status
     * (inactive, or one set by hand) is left alone.
     */
    private function syncCarStatus(int $carId): void
    {
        $car = Car::find($carId);

        if (! $car || $car->status === 'inactive') {
            return;
        }

        $hasOpenMaintenance = $car->maintenanceRecords()
            ->whereIn('status', self::OPEN_STATUSES)
            ->exists();

        if ($hasOpenMaintenance) {
            $car->update(['status' => 'maintenance']);
        } elseif ($car->status === 'maintenance') {
            $car->update(['status' => 'available']);
        }
    }
}
