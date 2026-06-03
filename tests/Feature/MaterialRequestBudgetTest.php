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
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class MaterialRequestBudgetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    private function makeProjectWithComponent(): array
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create(['role' => 'site_engineer']);
        $user->assignRole('site_engineer');

        $client = Client::factory()->create(['name' => 'Test Client']);
        $project = Project::factory()->create([
            'client_id' => $client->id,
            'name' => 'Test Project',
            'status' => 'ACTIVE',
            'location' => 'Test Loc',
            'budget' => 100000,
            'site_engineer_id' => $user->id,
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

        // Total budget = BOQ qty(10) * quantity_factor(5) * unit_rate(20) = 1000
        $component = BoqItemComponent::create([
            'boq_item_id'     => $boqItem->id,
            'resource_type'   => 'MATERIAL',
            'name'            => 'Cement',
            'quantity_factor' => 5,
            'unit_rate'       => 20,
            'total_cost'      => 100,
            'no_of_persons'   => 0,
            'hours'           => 0,
        ]);

        // Grant material request permissions
        Permission::findOrCreate('view material requests');
        Permission::findOrCreate('create material requests');
        $user->givePermissionTo(['view material requests', 'create material requests']);

        return compact('user', 'project', 'boqItem', 'component');
    }

    public function test_user_can_create_material_request_within_budget()
    {
        ['user' => $user, 'project' => $project, 'boqItem' => $boqItem, 'component' => $component] = $this->makeProjectWithComponent();

        // Total budget = 10 * 5 * 20 = 1000. Requesting qty=45 @ ₱20 = 900 — within budget.
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
                ],
            ],
        ]);

        if ($response->status() !== 302) {
            $response->dump();
        }

        $response->assertSessionHas('success');
        $response->assertSessionMissing('warning');
        $this->assertDatabaseHas('material_request_items', ['quantity' => 45]);
    }

    public function test_user_gets_warning_when_exceeding_budget()
    {
        ['user' => $user, 'project' => $project, 'boqItem' => $boqItem, 'component' => $component] = $this->makeProjectWithComponent();

        // First request: qty=40 @ ₱20 = 800. Budget is 1000, so this passes.
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
                ],
            ],
        ]);

        // Second request: qty=15 @ ₱20 = 300. 800 + 300 = 1100 > 1000 → WARNING.
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
                ],
            ],
        ]);

        $response->assertSessionHas('warning');
    }
}
