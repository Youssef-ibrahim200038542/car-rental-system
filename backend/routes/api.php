<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AIRecommendationController;

use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingAddonController;
use App\Http\Controllers\Api\CarController;
use App\Http\Controllers\Api\CarCategoryController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\MaintenanceController;

Route::apiResource('cars', CarController::class);

Route::apiResource('car-categories', CarCategoryController::class);

Route::apiResource('branches', BranchController::class);

Route::apiResource('bookings', BookingController::class);

Route::apiResource('payments', PaymentController::class);

Route::apiResource('maintenance', MaintenanceController::class);

Route::apiResource('booking-addons', BookingAddonController::class);

Route::post('/register', [AuthController::class, 'register']);

Route::post('/login', [AuthController::class, 'login']);

Route::get('/recommendations', [RecommendationController::class, 'index']);

Route::apiResource('reviews', ReviewController::class)->only([
    'index',
    'show',
]);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/reviews', [ReviewController::class, 'store']);

    Route::put('/reviews/{review}', [ReviewController::class, 'update']);

    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

    Route::apiResource('users', UserController::class)->only([
        'index',
        'show',
        'update',
        'destroy',
    ]);
});

Route::post('/ai/recommendations/parse', [AIRecommendationController::class, 'parse']);

Route::post('/ai/recommendations', [AIRecommendationController::class, 'recommend']);

