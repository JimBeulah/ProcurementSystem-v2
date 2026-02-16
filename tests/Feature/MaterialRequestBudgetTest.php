<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Project;
use App\Models\Client;
use App\Models\BoqItem;
use App\Models\BoqItemComponent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaterialRequestBudgetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_material_request_within_budget()
    {
        $user = User::factory()->create();
        $client = Client::create(['name' => 'Test Client']);
        $project = Project::create([
            'client_id' => $client->id,
            'name' => 'Test Project',
            'status' => 'active',
            'location' => 'Test Loc',
            'duration' => 10,
            'budget' => 100000,
        ]);

        $boqItem = BoqItem::create([
            'project_id' => $project->id,
            'item_description' => 'Test Item',
            'quantity' => 10,
            'unit' => 'lot',
            'material_unit_price' => 100,
            'labor_unit_price' => 50,
            'is_carport' => false,
        ]);

        $component = BoqItemComponent::create([
            'boq_item_id' => $boqItem->id,
            'resource_type' => 'MATERIAL',
            'name' => 'Cement',
            'quantity_factor' => 5, // Total Budget = 10 * 5 = 50
            'unit_rate' => 20,
            'total_component_cost' => 1000,
            'no_of_persons' => 0,
            'hours' => 0,
        ]);

        $response = $this->actingAs($user)->post(route('projects.material-requests.store', $project), [
            'items' => [
                [
                    'boq_item_id' => $boqItem->id,
                    'boq_item_component_id' => $component->id,
                    'item_description' => 'Requesting Cement',
                    'unit' => 'bags',
                    'quantity' => 45,
                    'material_unit_price' => 20,
                    'labor_unit_price' => 0,
                ]
            ]
        ]);

        $response->assertSessionHas('success');
        $response->assertSessionMissing('warning');
        $this->assertDatabaseHas('material_request_items', ['quantity' => 45]);
    }

    public function test_user_gets_warning_when_exceeding_budget()
    {
        $user = User::factory()->create();
        $client = Client::create(['name' => 'Test Client']);
        $project = Project::create([
            'client_id' => $client->id,
            'name' => 'Test Project',
            'status' => 'active',
            'location' => 'Test Loc',
            'duration' => 10,
            'budget' => 100000,
        ]);

        $boqItem = BoqItem::create([
            'project_id' => $project->id,
            'item_description' => 'Test Item',
            'quantity' => 10,
            'unit' => 'lot',
            'material_unit_price' => 100,
            'labor_unit_price' => 50,
            'is_carport' => false,
        ]);

        $component = BoqItemComponent::create([
            'boq_item_id' => $boqItem->id,
            'resource_type' => 'MATERIAL',
            'name' => 'Cement',
            'quantity_factor' => 5, // Total Budget = 50
            'unit_rate' => 20,
            'total_component_cost' => 1000,
            'no_of_persons' => 0,
            'hours' => 0,
        ]);

        // First request (40) - OK
        $this->actingAs($user)->post(route('projects.material-requests.store', $project), [
            'items' => [
                [
                    'boq_item_id' => $boqItem->id,
                    'boq_item_component_id' => $component->id,
                    'item_description' => 'Batch 1',
                    'unit' => 'bags',
                    'quantity' => 40,
                    'material_unit_price' => 20,
                    'labor_unit_price' => 0,
                ]
            ]
        ]);

        // Second request (15) -> Total 55 > 50 - WARNING
        $response = $this->actingAs($user)->post(route('projects.material-requests.store', $project), [
            'items' => [
                [
                    'boq_item_id' => $boqItem->id,
                    'boq_item_component_id' => $component->id,
                    'item_description' => 'Batch 2',
                    'unit' => 'bags',
                    'quantity' => 15,
                    'material_unit_price' => 20,
                    'labor_unit_price' => 0,
                ]
            ]
        ]);

        $response->assertSessionHas('warning');
        // Still saved in DB
        $this->assertDatabaseHas('material_request_items', ['quantity' => 15]);
    }
}
