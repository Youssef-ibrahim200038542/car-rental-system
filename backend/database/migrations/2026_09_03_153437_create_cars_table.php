<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->id();

            // Relationships
            $table->foreignId('category_id')
                ->constrained('car_categories')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Car information
            $table->string('brand');
            $table->string('model');
            $table->year('year');
            $table->string('color')->nullable();

            // Identification
            $table->string('license_plate')->unique();
            $table->string('vin')->unique();

            // Specifications
            $table->unsignedInteger('mileage')->default(0);
            $table->enum('fuel_type', [
                'petrol',
                'diesel',
                'hybrid',
                'electric'
            ]);

            $table->enum('transmission', [
                'manual',
                'automatic'
            ]);

            $table->unsignedTinyInteger('seats');

            // Rental
            $table->decimal('daily_rate', 10, 2);

            $table->enum('status', [
                'available',
                'reserved',
                'rented',
                'maintenance',
                'inactive'
            ])->default('available');

            // Media & description
            $table->string('image')->nullable();
            $table->text('description')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};