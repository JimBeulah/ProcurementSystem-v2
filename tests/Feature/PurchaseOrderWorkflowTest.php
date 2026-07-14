<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseOrderWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    private function makeActiveProject(?User $siteEngineer = null): Project
    {
        $client = Client::factory()->create();

        return Project::factory()->create([
            'client_id' => $client->id,
            'status' => 'ACTIVE',
            'budget' => 1000000,
            'site_engineer_id' => $siteEngineer?->id,
        ]);
    }

    private function createPr(User $user, Project $project): PurchaseRequest
    {
        $this->actingAs($user)->post(route('purchasing.requests.store'), [
            'project_id' => $project->id,
            'purpose' => 'Test purpose',
            'items' => [
                [
                    'item_description' => 'Cement',
                    'quantity' => 10,
                    'unit' => 'bags',
                    'estimated_unit_cost' => 300,
                ],
            ],
        ]);

        return PurchaseRequest::where('project_id', $project->id)->firstOrFail();
    }

    public function test_project_manager_can_create_purchase_request()
    {
        $pm = User::factory()->create(['role' => 'project_manager']);
        $pm->assignRole('project_manager');
        $project = $this->makeActiveProject();

        $response = $this->actingAs($pm)->post(route('purchasing.requests.store'), [
            'project_id' => $project->id,
            'purpose' => 'Materials for foundation',
            'items' => [
                [
                    'item_description' => 'Cement',
                    'quantity' => 10,
                    'unit' => 'bags',
                    'estimated_unit_cost' => 300,
                ],
            ],
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('purchase_requests', ['project_id' => $project->id]);
    }

    public function test_site_engineer_can_create_purchase_request_for_own_project()
    {
        $engineer = User::factory()->create(['role' => 'site_engineer']);
        $engineer->assignRole('site_engineer');
        $project = $this->makeActiveProject($engineer);

        $response = $this->actingAs($engineer)->post(route('purchasing.requests.store'), [
            'project_id' => $project->id,
            'purpose' => 'Site materials',
            'items' => [
                [
                    'item_description' => 'Rebar',
                    'quantity' => 5,
                    'unit' => 'pcs',
                    'estimated_unit_cost' => 500,
                ],
            ],
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('purchase_requests', ['project_id' => $project->id]);
    }

    public function test_project_manager_cannot_approve_their_own_purchase_request()
    {
        $pm = User::factory()->create(['role' => 'project_manager']);
        $pm->assignRole('project_manager');
        $project = $this->makeActiveProject();

        $pr = $this->createPr($pm, $project);

        $response = $this->actingAs($pm)->post(route('purchasing.requests.approve', $pr));

        $response->assertSessionHas('error');
        $this->assertSame('PENDING', $pr->fresh()->status->value);
    }

    public function test_admin_can_approve_purchase_request_and_create_purchase_order()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->assignRole('admin');
        $requester = User::factory()->create(['role' => 'procurement_officer']);
        $requester->assignRole('procurement_officer');
        $project = $this->makeActiveProject();

        $pr = $this->createPr($requester, $project);

        $this->actingAs($admin)->post(route('purchasing.requests.approve', $pr));
        $this->assertSame('APPROVED', $pr->fresh()->status->value);

        $prItem = $pr->items()->first();
        $supplier = Supplier::factory()->create();

        $response = $this->actingAs($requester)->post(route('purchasing.orders.store'), [
            'project_id' => $project->id,
            'supplier_id' => $supplier->id,
            'purchase_request_id' => $pr->id,
            'items' => [
                [
                    'purchase_request_item_id' => $prItem->id,
                    'material_name' => $prItem->item_description,
                    'quantity' => $prItem->quantity,
                    'unit_price' => 300,
                    'unit' => $prItem->unit,
                ],
            ],
        ]);

        $response->assertSessionHas('success');
        $po = PurchaseOrder::where('purchase_request_id', $pr->id)->firstOrFail();
        $this->assertSame('PENDING', $po->status->value);
        $this->assertEquals(3000, $po->total_amount);
    }

    public function test_admin_can_approve_purchase_order()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->assignRole('admin');
        $requester = User::factory()->create(['role' => 'procurement_officer']);
        $requester->assignRole('procurement_officer');
        $project = $this->makeActiveProject();

        $pr = $this->createPr($requester, $project);
        $this->actingAs($admin)->post(route('purchasing.requests.approve', $pr));
        $prItem = $pr->items()->first();
        $supplier = Supplier::factory()->create();

        $this->actingAs($requester)->post(route('purchasing.orders.store'), [
            'project_id' => $project->id,
            'supplier_id' => $supplier->id,
            'purchase_request_id' => $pr->id,
            'items' => [
                [
                    'purchase_request_item_id' => $prItem->id,
                    'material_name' => $prItem->item_description,
                    'quantity' => $prItem->quantity,
                    'unit_price' => 300,
                    'unit' => $prItem->unit,
                ],
            ],
        ]);
        $po = PurchaseOrder::where('purchase_request_id', $pr->id)->firstOrFail();

        $response = $this->actingAs($admin)->post(route('purchasing.orders.approve', $po));

        $response->assertSessionHas('success');
        $this->assertSame('APPROVED', $po->fresh()->status->value);
    }

    public function test_admin_can_decline_purchase_order_and_ordered_quantity_rolls_back()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->assignRole('admin');
        $requester = User::factory()->create(['role' => 'procurement_officer']);
        $requester->assignRole('procurement_officer');
        $project = $this->makeActiveProject();

        $pr = $this->createPr($requester, $project);
        $this->actingAs($admin)->post(route('purchasing.requests.approve', $pr));
        $prItem = $pr->items()->first();
        $supplier = Supplier::factory()->create();

        $this->actingAs($requester)->post(route('purchasing.orders.store'), [
            'project_id' => $project->id,
            'supplier_id' => $supplier->id,
            'purchase_request_id' => $pr->id,
            'items' => [
                [
                    'purchase_request_item_id' => $prItem->id,
                    'material_name' => $prItem->item_description,
                    'quantity' => $prItem->quantity,
                    'unit_price' => 300,
                    'unit' => $prItem->unit,
                ],
            ],
        ]);
        $po = PurchaseOrder::where('purchase_request_id', $pr->id)->firstOrFail();
        $this->assertGreaterThan(0, $prItem->fresh()->ordered_quantity);

        $response = $this->actingAs($admin)->post(route('purchasing.orders.decline', $po), [
            'remarks' => 'Supplier unavailable',
        ]);

        $response->assertSessionHas('success');
        $this->assertSame('DECLINED', $po->fresh()->status->value);
        $this->assertEquals(0, $prItem->fresh()->ordered_quantity);
    }

    public function test_site_engineer_cannot_view_purchase_request_from_another_project()
    {
        $ownerEngineer = User::factory()->create(['role' => 'site_engineer']);
        $ownerEngineer->assignRole('site_engineer');
        $otherEngineer = User::factory()->create(['role' => 'site_engineer']);
        $otherEngineer->assignRole('site_engineer');

        $project = $this->makeActiveProject($ownerEngineer);
        $pr = $this->createPr($ownerEngineer, $project);

        $response = $this->actingAs($otherEngineer)->get(route('purchasing.requests.print', $pr));

        $response->assertForbidden();
    }

    public function test_site_engineer_cannot_view_purchase_order_from_another_project()
    {
        $ownerEngineer = User::factory()->create(['role' => 'site_engineer']);
        $ownerEngineer->assignRole('site_engineer');
        $otherEngineer = User::factory()->create(['role' => 'site_engineer']);
        $otherEngineer->assignRole('site_engineer');
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->assignRole('admin');

        $project = $this->makeActiveProject($ownerEngineer);
        $pr = $this->createPr($ownerEngineer, $project);
        $this->actingAs($admin)->post(route('purchasing.requests.approve', $pr));
        $prItem = $pr->items()->first();
        $supplier = Supplier::factory()->create();

        $this->actingAs($admin)->post(route('purchasing.orders.store'), [
            'project_id' => $project->id,
            'supplier_id' => $supplier->id,
            'purchase_request_id' => $pr->id,
            'items' => [
                [
                    'purchase_request_item_id' => $prItem->id,
                    'material_name' => $prItem->item_description,
                    'quantity' => $prItem->quantity,
                    'unit_price' => 300,
                    'unit' => $prItem->unit,
                ],
            ],
        ]);
        $po = PurchaseOrder::where('purchase_request_id', $pr->id)->firstOrFail();

        $response = $this->actingAs($otherEngineer)->get(route('purchasing.orders.print', $po));

        $response->assertForbidden();
    }
}
