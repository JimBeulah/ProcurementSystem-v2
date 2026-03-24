<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Material>
 */
class MaterialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('MAT-####'),
            'name' => fake()->word(),
            'description' => fake()->sentence(),
            'unit' => fake()->word(),
            'category' => fake()->word(),
        ];
    }
}
