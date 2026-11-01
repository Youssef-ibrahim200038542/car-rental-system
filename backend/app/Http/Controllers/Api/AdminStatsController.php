<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\Payment;
use App\Models\Review;
use App\Models\User;

class AdminStatsController extends Controller
{
    private const CAR_STATUSES = ['available', 'reserved', 'rented', 'maintenance', 'inactive'];

    private const BOOKING_STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];

    public function index()
    {
        $carCounts = Car::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $bookingCounts = Booking::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'success' => true,
            'data' => [
                'cars' => $this->withTotal($carCounts, self::CAR_STATUSES),
                'bookings' => $this->withTotal($bookingCounts, self::BOOKING_STATUSES),
                'revenue' => [
                    'paid_total' => round((float) Payment::where('payment_status', 'paid')->sum('amount'), 2),
                ],
                'users' => [
                    'total' => User::count(),
                    'customers' => User::where('role', 'customer')->count(),
                ],
                'branches' => [
                    'total' => Branch::count(),
                ],
                'reviews' => [
                    'total' => Review::count(),
                    'average_rating' => round((float) Review::avg('rating'), 2),
                ],
            ],
        ]);
    }

    private function withTotal($counts, array $statuses): array
    {
        $result = ['total' => (int) $counts->sum()];

        foreach ($statuses as $status) {
            $result[$status] = (int) ($counts[$status] ?? 0);
        }

        return $result;
    }
}
