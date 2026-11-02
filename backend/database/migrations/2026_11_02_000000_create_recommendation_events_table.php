<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recommendation_events', function (Blueprint $table) {
            $table->id();

            // Groups the impressions of one served list with the clicks / bookings that followed it.
            $table->uuid('request_id');

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->foreignId('car_id')
                ->constrained('cars')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->enum('event', ['impression', 'click', 'book']);

            // 1-based rank the car was shown at.
            $table->unsignedSmallInteger('position')->nullable();

            // Per-criterion scores at serve time; impressions only.
            $table->json('features')->nullable();

            $table->timestamp('created_at')->useCurrent();

            // Leftmost column also serves lookups by request_id alone.
            $table->index(['request_id', 'car_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recommendation_events');
    }
};
