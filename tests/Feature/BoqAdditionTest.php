<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoqAdditionTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_add_boq_item_with_material_component()
    {
        $user = User::factory()->create(['role' => 'ADMIN']);
        $client = Client::create(['name' => 'Test Client', 'email' => 'test@example.com']);
        $project = Project::create([
            'name' => 'Test Project',
            'client_id' => $client->id,
            'location' => 'Test Location',
            'budget' => 1000000,
            'status' => 'ACTIVE',
            'project_type' => 'BUILDING'
        ]);

        $payload = [
            'item_description' => 'Test Item',
            'unit' => 'lot',
            'quantity' => 1,
            'material_unit_price' => 100,
            'labor_unit_price' => 50,
            'is_carport' => false,
            'components' => [
                [
                    'resourceType' => 'MATERIAL',
                    'name' => 'CEMENT',
                    'quantityFactor' => 1,
                    'unitRate' => 100,
                    'noOfPersons' => 0, // This is what the wizard sends by default
                    'hours' => 0
                ]
            ]
        ];

        $response = $this->actingAs($user)
            ->post("/projects/{$project->id}/boq", $payload);

        // If this fails with 422, my hypothesis is correct
        $response->assertStatus(302); // Redirect back on success
        $this->assertDatabaseHas('boq_items', ['item_description' => 'Test Item']);
    }
}
