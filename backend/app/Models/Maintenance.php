<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Maintenance extends Model
{
    protected $table = 'maintenance';

    protected $fillable = [
        'car_id',
        'title',
        'description',
        'cost',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}