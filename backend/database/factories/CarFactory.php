<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Car;
use App\Models\CarCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Car>
 */
class CarFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => CarCategory::factory(),
            'branch_id' => Branch::factory(),
            'brand' => fake()->randomElement(['Toyota', 'Hyundai', 'Kia', 'Nissan']),
            'model' => fake()->word(),
            'year' => 2024,
            'color' => fake()->safeColorName(),
            'license_plate' => fake()->unique()->bothify('???-####'),
            'vin' => fake()->unique()->bothify('#################'),
            'mileage' => 10000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1000,
            'status' => 'available',
        ];
    }
}
