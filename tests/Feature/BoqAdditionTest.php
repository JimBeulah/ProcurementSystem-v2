<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoqAdditionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
    }

    private function giveUserBoqPermissions(User $user): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
        $user->assignRole('admin');
    }

    public function test_can_add_boq_item_with_material_component()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $client = Client::factory()->create(['name' => 'Test Client']);
        $project = Project::factory()->create([
            'name' => 'Test Project',
            'client_id' => $client->id,
            'status' => 'ACTIVE',
        ]);

        $this->giveUserBoqPermissions($user);

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
                    'name' => 'Cement',
                    'quantityFactor' => 5,
                    'unitRate' => 100,  // Used for StoreBoqItemRequest validation
                    'clientUnitRate' => 100,  // Used when creating the component record
                    'altapilUnitRate' => 80,
                    'noOfPersons' => 0,
                    'hours' => 0,
                ],
            ],
        ];

        $response = $this->actingAs($user)
            ->post("/projects/{$project->id}/boq", $payload);

        $response->assertStatus(302);
        $this->assertDatabaseHas('boq_items', ['item_description' => 'Test Item']);
        $this->assertDatabaseHas('boq_item_components', ['name' => 'Cement', 'client_unit_rate' => 100]);
    }
}
