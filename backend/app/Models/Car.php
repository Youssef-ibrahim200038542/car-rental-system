<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Car extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'branch_id',
        'brand',
        'model',
        'year',
        'color',
        'license_plate',
        'vin',
        'mileage',
        'fuel_type',
        'transmission',
        'seats',
        'daily_rate',
        'status',
        'image',
        'description',
    ];

    protected $casts = [
        'year' => 'integer',
        'mileage' => 'integer',
        'seats' => 'integer',
        'daily_rate' => 'decimal:2',
    ];

    /** Fleet states in which a car cannot be booked at all. */
    public const UNBOOKABLE_STATUSES = ['maintenance', 'inactive'];

    /**
     * Why this car cannot be booked for the given dates, or null when it is free.
     */
    public function unavailabilityReason(string $pickupDate, string $returnDate, ?int $ignoreBookingId = null): ?string
    {
        if (in_array($this->status, self::UNBOOKABLE_STATUSES, true)) {
            return 'This car is currently unavailable for booking.';
        }

        $overlaps = Booking::overlapping($this->id, $pickupDate, $returnDate, $ignoreBookingId)->exists();

        return $overlaps ? 'This car is already booked during the selected dates.' : null;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CarCategory::class, 'category_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(Maintenance::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}