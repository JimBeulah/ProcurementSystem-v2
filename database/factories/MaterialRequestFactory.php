<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MaterialRequest>
 */
class MaterialRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'mrf_no' => 'MRF-' . date('Y') . '-' . str_pad(fake()->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'project_id' => Project::factory(),
            'warehouse_id' => Warehouse::factory(),
            'requested_by' => User::factory(),
            'date_needed' => fake()->dateTimeBetween('now', '+30 days'),
            'remarks' => fake()->sentence(),
            'status' => 'PENDING',
        ];
    }
}
