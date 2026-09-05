<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();

            // Relationships
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('car_id')
                ->constrained('cars')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('pickup_branch_id')
                ->constrained('branches')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('dropoff_branch_id')
                ->constrained('branches')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Rental dates
            $table->date('pickup_date');
            $table->date('return_date');

            // Pricing snapshot
            $table->decimal('daily_rate', 10, 2);
            $table->unsignedInteger('total_days');

            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);

            // Booking status
            $table->enum('status', [
                'pending',
                'confirmed',
                'active',
                'completed',
                'cancelled'
            ])->default('pending');

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};