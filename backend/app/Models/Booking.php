<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    /** Statuses that hold a car for their date range. */
    public const BLOCKING_STATUSES = ['pending', 'confirmed', 'active'];

    protected $fillable = [
        'user_id',
        'car_id',
        'pickup_branch_id',
        'dropoff_branch_id',
        'pickup_date',
        'return_date',
        'daily_rate',
        'total_days',
        'subtotal',
        'discount',
        'total_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'pickup_date' => 'date',
        'return_date' => 'date',
        'daily_rate' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'total_days' => 'integer',
    ];

    /**
     * Bookings of the given car that hold any day of [$pickupDate, $returnDate] (inclusive).
     */
    public function scopeOverlapping(Builder $query, int $carId, string $pickupDate, string $returnDate, ?int $ignoreId = null): Builder
    {
        // Normalise so a non-ISO string can never slip past a text comparison.
        $pickupDate = Carbon::parse($pickupDate)->toDateString();
        $returnDate = Carbon::parse($returnDate)->toDateString();

        return $query
            ->where('car_id', $carId)
            ->whereIn('status', self::BLOCKING_STATUSES)
            ->whereDate('pickup_date', '<=', $returnDate)
            ->whereDate('return_date', '>=', $pickupDate)
            ->when($ignoreId, fn (Builder $q) => $q->where('id', '!=', $ignoreId));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function pickupBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'pickup_branch_id');
    }

    public function dropoffBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'dropoff_branch_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function addons(): HasMany
    {
        return $this->hasMany(BookingAddon::class);
    }
}