<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\RespondsWithErrors;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    use RespondsWithErrors;

    public function index()
    {
        $branches = Branch::with('cars')->get();

        return response()->json([
            'success' => true,
            'data' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
        ]);

        $branch = Branch::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Branch created successfully',
            'data' => $branch,
        ], 201);
    }

    public function show(Branch $branch)
    {
        $branch->load('cars');

        return response()->json([
            'success' => true,
            'data' => $branch,
        ]);
    }

    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'city' => 'sometimes|required|string|max:100',
            'phone' => 'nullable|string|max:20',
        ]);

        $branch->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Branch updated successfully',
            'data' => $branch,
        ]);
    }

    public function destroy(Branch $branch)
    {
        if (
            $branch->cars()->exists() ||
            $branch->pickupBookings()->exists() ||
            $branch->dropoffBookings()->exists()
        ) {
            return $this->unprocessable('Cannot delete this branch because it has cars or bookings.');
        }

        $branch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Branch deleted successfully',
        ]);
    }
}
