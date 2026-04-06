<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Disbursement;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceReportTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
        $this->user = User::factory()->create(['role' => 'finance']);
        $this->user->assignRole('finance');
    }

    public function test_finance_reports_page_loads_with_all_projects_summary()
    {
        Client::factory()->count(1)->create();
        Project::factory()->count(3)->create(['budget' => 100000]);

        $response = $this->actingAs($this->user)
            ->get(route('finance.reports'));

        $response->assertStatus(200);
        $response->assertInertia(
            fn ($page) => $page
                ->component('Finance/Reports/Index')
                ->has('data', 3)
                ->has('projects', 3)
                ->where('filters.project_id', null)
        );
    }

    public function test_finance_reports_page_can_filter_by_project()
    {
        Client::factory()->count(1)->create();
        $project = Project::factory()->create(['budget' => 500000, 'name' => 'Test Project']);

        $supplier = \App\Models\Supplier::factory()->create();
        $user = \App\Models\User::factory()->create();

        $po = PurchaseOrder::create([
            'project_id' => $project->id,
            'supplier_id' => $supplier->id,
            'requester_id' => $user->id,
            'total_amount' => 100000,
            'status' => 'APPROVED',
            'order_date' => now(),
        ]);

        Disbursement::create([
            'purchase_order_id' => $po->id,
            'processed_by_id' => $user->id,
            'received_by_id' => $user->id,
            'amount' => 50000,
            'payment_date' => now(),
            'method' => 'ONLINE',
            'status' => 'PAID',
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('finance.reports', ['project_id' => $project->id]));

        $response->assertStatus(200);
        $response->assertInertia(
            fn ($page) => $page
                ->component('Finance/Reports/Index')
                ->has('data.project')
                ->where('data.project.id', $project->id)
                ->where('data.revenue.total', 500000)
                ->where('data.expenses.committed', 100000)
                ->where('data.expenses.paid', 50000)
                ->where('data.profit_loss.amount', 400000)
        );
    }
}
