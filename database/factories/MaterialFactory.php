<?php

namespace Database\Factories;

use App\Models\Material;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('MAT-####'),
            'name' => fake()->words(2, true),
            'description' => fake()->sentence(),
            'unit' => fake()->randomElement(['pcs', 'kg', 'm', 'set', 'roll', 'bag']),
            'category' => fake()->randomElement(['Structural', 'Electrical', 'Plumbing', 'Finishing', 'HVAC']),
        ];
    }
}
