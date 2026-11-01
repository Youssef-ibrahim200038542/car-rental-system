<?php

namespace Database\Factories;

use App\Models\CarCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CarCategory>
 */
class CarCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'description' => fake()->sentence(),
            'daily_rate' => 1000,
        ];
    }
}
