<?php

namespace Tests\Feature;

use App\Models\BoqItem;
use App\Models\BoqItemComponent;
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaterialRequestNewResourceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function makeProjectAndEngineer(): array
    {
        $user = User::factory()->create(['role' => 'site_engineer']);
        $user->assignRole('site_engineer');

        $client = Client::factory()->create();
        $project = Project::factory()->create([
            'client_id' => $client->id,
            'status' => 'ACTIVE',
            'site_engineer_id' => $user->id,
        ]);

        $boqItem = BoqItem::create([
            'project_id' => $project->id,
            'item_description' => 'Electrical Works',
            'quantity' => 10,
            'unit' => 'lot',
            'material_unit_price' => 1000,
            'labor_unit_price' => 500,
            'is_carport' => false,
        ]);

        return [$user, $project, $boqItem];
    }

    public function test_new_resource_creates_boq_component_and_request_item(): void
    {
        [$user, $project, $boqItem] = $this->makeProjectAndEngineer();

        $this->actingAs($user)
            ->post("/projects/{$project->id}/material-requests", [
                'remarks' => null,
                'items' => [
                    [
                        'boq_item_id' => $boqItem->id,
                        'boq_item_component_id' => null,
                        'is_new_resource' => true,
                        'resource_type' => 'MATERIAL',
                        'item_description' => 'Romex Wire',
                        'unit' => 'meters',
                        'quantity' => 50,
                        'material_unit_price' => 0,
                        'labor_unit_price' => 0,
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('boq_item_components', [
            'boq_item_id' => $boqItem->id,
            'name' => 'Romex Wire',
            'unit' => 'meters',
            'resource_type' => 'MATERIAL',
        ]);

        $component = BoqItemComponent::where('name', 'Romex Wire')->first();
        $this->assertDatabaseHas('material_request_items', [
            'boq_item_id' => $boqItem->id,
            'boq_item_component_id' => $component->id,
            'item_description' => 'Romex Wire',
            'quantity' => 50,
        ]);
    }

    public function test_existing_component_reused_on_second_request(): void
    {
        [$user, $project, $boqItem] = $this->makeProjectAndEngineer();

        $component = BoqItemComponent::create([
            'boq_item_id' => $boqItem->id,
            'resource_type' => 'MATERIAL',
            'name' => 'PVC Conduit',
            'unit' => 'pcs',
            'quantity_factor' => null,
            'client_unit_rate' => null,
            'client_total_cost' => null,
            'altapil_unit_rate' => 0,
            'altapil_total_cost' => 0,
        ]);

        $this->actingAs($user)
            ->post("/projects/{$project->id}/material-requests", [
                'items' => [
                    [
                        'boq_item_id' => $boqItem->id,
                        'boq_item_component_id' => $component->id,
                        'is_new_resource' => false,
                        'item_description' => 'PVC Conduit',
                        'unit' => 'pcs',
                        'quantity' => 20,
                        'material_unit_price' => 0,
                        'labor_unit_price' => 0,
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('boq_item_components', 1);

        $this->assertDatabaseHas('material_request_items', [
            'boq_item_component_id' => $component->id,
            'quantity' => 20,
        ]);
    }

    public function test_new_resource_requires_resource_type(): void
    {
        [$user, $project, $boqItem] = $this->makeProjectAndEngineer();

        $this->actingAs($user)
            ->post("/projects/{$project->id}/material-requests", [
                'items' => [
                    [
                        'boq_item_id' => $boqItem->id,
                        'boq_item_component_id' => null,
                        'is_new_resource' => true,
                        // resource_type missing intentionally
                        'item_description' => 'Some Resource',
                        'unit' => 'pcs',
                        'quantity' => 10,
                        'material_unit_price' => 0,
                        'labor_unit_price' => 0,
                    ],
                ],
            ])
            ->assertSessionHasErrors();
    }
}
