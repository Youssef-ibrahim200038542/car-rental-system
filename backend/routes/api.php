<?php

use App\Http\Controllers\Api\AdminStatsController;
use App\Http\Controllers\Api\AIRecommendationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingAddonController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\CarCategoryController;
use App\Http\Controllers\Api\CarController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\MLRecommendationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

Route::apiResource('cars', CarController::class)->only(['index', 'show']);
Route::get('/cars/{car}/availability', [CarController::class, 'availability']);
Route::apiResource('car-categories', CarCategoryController::class)->only(['index', 'show']);
Route::apiResource('branches', BranchController::class)->only(['index', 'show']);
Route::apiResource('reviews', ReviewController::class)->only(['index', 'show']);

// Each throttle has its own key prefix (3rd arg) so the buckets do not share one per-IP counter.
Route::middleware('throttle:10,1,auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('throttle:10,1,ai')->group(function () {
    Route::post('/ai/recommendations/parse', [AIRecommendationController::class, 'parse']);
    Route::post('/ai/recommendations', [AIRecommendationController::class, 'recommend']);
});

Route::post('/ml/recommendations', [MLRecommendationController::class, 'recommend'])
    ->middleware('throttle:30,1,ml');

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', function (Request $request) {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user(),
            ],
        ]);
    });

    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

    Route::apiResource('bookings', BookingController::class)->only(['index', 'show', 'store']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
    Route::post('/bookings/{booking}/pay', [BookingController::class, 'pay']);

    /*
    | Admin + staff
    */
    Route::middleware('role:admin,staff')->group(function () {
        Route::apiResource('bookings', BookingController::class)->only(['update', 'destroy']);
        Route::apiResource('payments', PaymentController::class);
        Route::apiResource('maintenance', MaintenanceController::class);
        Route::apiResource('booking-addons', BookingAddonController::class);
        Route::apiResource('users', UserController::class)->only(['index', 'show']);
        Route::get('/admin/stats', [AdminStatsController::class, 'index']);
    });

    /*
    | Admin only
    */
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('cars', CarController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('car-categories', CarCategoryController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('branches', BranchController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('users', UserController::class)->only(['update', 'destroy']);
    });
});
