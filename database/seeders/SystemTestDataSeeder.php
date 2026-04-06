<?php

namespace Database\Seeders;

use App\Models\BoqItem;
use App\Models\Category;
use App\Models\Client;
use App\Models\InventoryItem;
use App\Models\Material;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedFoundations();
        $this->seedMasterData();
        $this->seedProjectStructure();
        $this->seedInventory();
        $this->seedWorkflowData();
    }

    private function seedFoundations(): void
    {
        $units = [
            ['name' => 'Pieces', 'abbreviation' => 'pcs'],
            ['name' => 'Kilogram', 'abbreviation' => 'kg'],
            ['name' => 'Meter', 'abbreviation' => 'm'],
            ['name' => 'Set', 'abbreviation' => 'set'],
            ['name' => 'Roll', 'abbreviation' => 'roll'],
            ['name' => 'Bag', 'abbreviation' => 'bag'],
            ['name' => 'Cubic Meter', 'abbreviation' => 'cu.m'],
            ['name' => 'Square Meter', 'abbreviation' => 'sq.m'],
            ['name' => 'Lot', 'abbreviation' => 'lot'],
        ];
        foreach ($units as $unit) {
            Unit::firstOrCreate(['abbreviation' => $unit['abbreviation']], $unit);
        }

        $categories = ['Structural', 'Electrical', 'Plumbing', 'Finishing', 'HVAC', 'General Requisites'];
        foreach ($categories as $cat) {
            Category::firstOrCreate(['name' => $cat]);
        }
    }

    private function seedMasterData(): void
    {
        $materialBases = [
            'Structural' => ['Portland Cement', 'Deformed Bar 10mm', 'Deformed Bar 12mm', 'Gravel 3/4', 'Fine Sand', 'Ready-Mix Concrete', 'Hollow Blocks 4"', 'Hollow Blocks 6"'],
            'Electrical' => ['THHN Wire #12', 'THHN Wire #14', 'PVC Conduit 20mm', 'Circuit Breaker 20A', 'LED Bulb 9W', 'Utility Box', 'Junction Box', 'Electrical Tape'],
            'Plumbing' => ['PVC Pipe 1/2"', 'PVC Pipe 3/4"', 'Elbow 90 deg', 'Tee 1/2"', 'Gate Valve', 'Teflon Tape', 'Faucet (Stainless)', 'Floor Drain'],
            'Finishing' => ['Plywood 1/4"', 'Plywood 3/4"', 'Ceramic Tiles 60x60', 'Paint (Latex)', 'Paint (Enamel)', 'Wood Stain', 'Sandpaper #100', 'Gypsum Board'],
        ];

        foreach ($materialBases as $cat => $mats) {
            foreach ($mats as $matName) {
                Material::firstOrCreate(['name' => $matName], [
                    'code' => 'MAT-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                    'category' => $cat,
                    'unit' => fake()->randomElement(['pcs', 'bag', 'roll', 'cu.m', 'set']),
                    'description' => 'High quality ' . $matName . ' for construction.',
                ]);
            }
        }

        $warehouses = [
            ['name' => 'Main Warehouse', 'location' => 'Quezon City', 'type' => 'CENTRAL'],
            ['name' => 'Cavite Logistics Hub', 'location' => 'General Trias, Cavite', 'type' => 'SITE'],
            ['name' => 'Cebu Regional Depot', 'location' => 'Mandaue City', 'type' => 'REGIONAL'],
        ];

        foreach ($warehouses as $wh) {
            Warehouse::firstOrCreate(['name' => $wh['name']], $wh);
        }

        Supplier::factory(10)->create();
    }

    private function seedProjectStructure(): void
    {
        $clients = Client::factory(10)->create();
        
        $statuses = ['ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

        foreach ($clients as $client) {
            $numProjects = rand(1, 3);
            for ($i = 0; $i < $numProjects; $i++) {
                $p = Project::create([
                    'client_id' => $client->id,
                    'name' => fake()->company() . ' - ' . fake()->words(2, true),
                    'location' => fake()->address(),
                    'budget' => fake()->randomFloat(2, 500000, 5000000),
                    'status' => fake()->randomElement($statuses),
                    'target_start_date' => now()->subDays(rand(30, 365)),
                    'target_end_date' => now()->addDays(rand(30, 365)),
                ]);

                $pm = User::where('role', 'project_manager')->inRandomOrder()->first();
                $se = User::where('role', 'site_engineer')->inRandomOrder()->first();

                if ($pm) {
                    ProjectMember::create(['project_id' => $p->id, 'user_id' => $pm->id, 'role' => 'Project Manager']);
                }
                if ($se) {
                    ProjectMember::create(['project_id' => $p->id, 'user_id' => $se->id, 'role' => 'Site Engineer']);
                }

                BoqItem::factory(rand(5, 15))->create(['project_id' => $p->id]);
            }
        }
    }

    private function seedInventory(): void
    {
        $allWarehouses = Warehouse::all();
        $allMaterials = Material::all();

        foreach ($allWarehouses as $wh) {
            // Give each warehouse some random stock
            $randomMats = $allMaterials->random(rand(10, 20));
            foreach ($randomMats as $mat) {
                InventoryItem::create([
                    'warehouse_id' => $wh->id,
                    'material_name' => $mat->name,
                    'quantity' => rand(100, 1000),
                    'unit' => $mat->unit,
                ]);
            }
        }
    }

    private function seedWorkflowData(): void
    {
        $projects = Project::whereIn('status', ['ACTIVE', 'IN_PROGRESS'])->limit(5)->get();
        $engineers = User::where('role', 'site_engineer')->get();
        $procurement = User::where('role', 'procurement_officer')->first();
        $suppliers = Supplier::all();

        foreach ($projects as $idx => $project) {
            $engineer = $engineers->random();
            
            // 1. Material Request
            $mr = MaterialRequest::create([
                'project_id' => $project->id,
                'requester_id' => $engineer->id,
                'status' => fake()->randomElement(['PENDING', 'APPROVED', 'FULFILLED']),
                'remarks' => 'Batch seeding request for ' . $project->name,
            ]);

            $mats = Material::inRandomOrder()->limit(rand(3, 8))->get();
            foreach ($mats as $m) {
                MaterialRequestItem::create([
                    'material_request_id' => $mr->id,
                    'item_description' => $m->name,
                    'quantity' => rand(10, 100),
                    'unit' => $m->unit,
                ]);
            }

            // 2. Purchase Request (every 2nd project)
            if ($idx % 2 == 0) {
                $pr = PurchaseRequest::create([
                    'project_id' => $project->id,
                    'requester_id' => $procurement->id ?? $engineer->id,
                    'status' => fake()->randomElement(['PENDING', 'APPROVED']),
                    'remarks' => 'PO sourcing for project ' . $project->name,
                    'total_estimated_cost' => rand(10000, 100000),
                ]);

                foreach ($mr->items as $item) {
                    PurchaseRequestItem::create([
                        'purchase_request_id' => $pr->id,
                        'item_description' => $item->item_description,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit,
                        'estimated_unit_cost' => rand(100, 1000),
                        'estimated_total_cost' => rand(1000, 10000),
                    ]);
                }

                // 3. Purchase Order (every 4th project)
                if ($idx % 4 == 0 && $suppliers->count() > 0) {
                    $po = PurchaseOrder::create([
                        'project_id' => $project->id,
                        'purchase_request_id' => $pr->id,
                        'supplier_id' => $suppliers->random()->id,
                        'requester_id' => $procurement->id ?? $engineer->id,
                        'status' => 'PENDING',
                        'total_amount' => $pr->total_estimated_cost,
                        'remarks' => 'Bulk order from seeder.',
                    ]);

                    foreach ($pr->items as $prItem) {
                        PurchaseOrderItem::create([
                            'purchase_order_id' => $po->id,
                            'material_name' => $prItem->item_description,
                            'quantity' => $prItem->quantity,
                            'unit' => $prItem->unit,
                            'unit_price' => $prItem->estimated_unit_cost,
                            'total_price' => $prItem->estimated_total_cost,
                        ]);
                    }
                }
            }
        }
    }
}
