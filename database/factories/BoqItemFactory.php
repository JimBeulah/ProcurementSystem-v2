<?php

namespace Database\Factories;

use App\Models\BoqItem;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BoqItem>
 */
class BoqItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'item_description' => fake()->sentence(3),
            'unit' => fake()->randomElement(['pcs', 'kg', 'm', 'set', 'roll', 'bag']),
            'material_unit_price' => fake()->randomFloat(2, 100, 5000),
            'labor_unit_price' => fake()->randomFloat(2, 50, 2000),
            'quantity' => fake()->randomFloat(2, 1, 100),
            'is_carport' => false,
        ];
    }
}
