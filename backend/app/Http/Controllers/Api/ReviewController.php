<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Booking;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index()
    {
        $reviews = Review::with([
            'user',
            'car',
            'booking',
        ])->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $reviews,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $booking = Booking::with('car')->findOrFail($validated['booking_id']);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only review your own bookings.',
            ], 403);
        }

        if ($booking->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'You can only review a completed booking.',
            ], 422);
        }

        if ($booking->review()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'You have already reviewed this booking.',
            ], 422);
        }

        $review = Review::create([
            'user_id' => $booking->user_id,
            'car_id' => $booking->car_id,
            'booking_id' => $booking->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review created successfully',
            'data' => $review->load([
                'user',
                'car',
                'booking',
            ]),
        ], 201);
    }

    public function show(Review $review)
    {
        $review->load([
            'user',
            'car',
            'booking',
        ]);

        return response()->json([
            'success' => true,
            'data' => $review,
        ]);
    }

    public function update(Request $request, Review $review)
    {
        $validated = $request->validate([
            'rating' => 'sometimes|required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        if ($review->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update your own review.',
            ], 403);
        }

        $review->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Review updated successfully',
            'data' => $review->load([
                'user',
                'car',
                'booking',
            ]),
        ]);
    }

    public function destroy(Request $request, Review $review)
    {
        $user = $request->user();

        if (
            $review->user_id !== $user->id &&
            $user->role !== 'admin'
        ) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this review.',
            ], 403);
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully',
        ]);
    }
}
