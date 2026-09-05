<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CarCategory extends Model
{
    protected $fillable = [
        'name',
        'description',
        'daily_rate',
    ];

    public function cars(): HasMany
    {
        return $this->hasMany(Car::class, 'category_id');
    }
}