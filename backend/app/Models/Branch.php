<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = [
        'name',
        'address',
        'city',
        'phone',
    ];

    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }

    public function pickupBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'pickup_branch_id');
    }

    public function dropoffBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'dropoff_branch_id');
    }
}