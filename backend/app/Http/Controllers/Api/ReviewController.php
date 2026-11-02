<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\RespondsWithErrors;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    use RespondsWithErrors;

    public function index()
    {
        $reviews = Review::with(self::publicRelations())->latest()->get();

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
            return $this->forbidden('You can only review your own bookings.');
        }

        if ($booking->status !== 'completed') {
            return $this->unprocessable('You can only review a completed booking.');
        }

        if ($booking->review()->exists()) {
            return $this->unprocessable('You have already reviewed this booking.');
        }

        try {
            $review = Review::create([
                'user_id' => $booking->user_id,
                'car_id' => $booking->car_id,
                'booking_id' => $booking->id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);
        } catch (UniqueConstraintViolationException) {
            // A parallel request won the race past the exists() check above.
            return $this->unprocessable('You have already reviewed this booking.');
        }

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
        $review->load(self::publicRelations());

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
            return $this->forbidden('You can only update your own review.');
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
            return $this->forbidden('You are not authorized to delete this review.');
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully',
        ]);
    }

    /**
     * Review listing is public: guests only get the reviewer's name, while
     * admin/staff (token sent optionally) also see contact details and the booking.
     */
    private static function publicRelations(): array
    {
        $viewer = auth('sanctum')->user();

        if ($viewer && in_array($viewer->role, ['admin', 'staff'], true)) {
            return ['user', 'car', 'booking'];
        }

        return ['user:id,name,avatar', 'car'];
    }
}
