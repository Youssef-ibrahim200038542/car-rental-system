<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per thing a user saw or did with a served recommendation list:
 * an impression per car shown, then any click / book against the same request_id.
 * Append-only, so there is no updated_at.
 */
class RecommendationEvent extends Model
{
    public const UPDATED_AT = null;

    public const EVENTS = ['impression', 'click', 'book'];

    /** Events the client may report; impressions are only written by the server. */
    public const CLIENT_EVENTS = ['click', 'book'];

    protected $fillable = [
        'request_id',
        'user_id',
        'car_id',
        'event',
        'position',
        'features',
    ];

    protected $casts = [
        'position' => 'integer',
        'features' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}
