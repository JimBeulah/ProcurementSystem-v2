<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Warehouse>
 */
class WarehouseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->city().' Warehouse',
            'location' => fake()->address(),
            'type' => fake()->randomElement(['MAIN', 'SITE', 'TEMP']),
        ];
    }
}
