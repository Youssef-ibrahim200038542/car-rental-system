<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Services\SimilarCarsService;
use Illuminate\Http\Request;

class SimilarCarsController extends Controller
{
    public function __invoke(Request $request, Car $car, SimilarCarsService $similarCars)
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:'.SimilarCarsService::MAX_LIMIT],
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'method' => 'content-based-cosine',
                'similar' => $similarCars->similarTo($car, (int) ($validated['limit'] ?? SimilarCarsService::DEFAULT_LIMIT)),
            ],
        ]);
    }
}
