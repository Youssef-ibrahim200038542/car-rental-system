<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Car extends Model
{
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