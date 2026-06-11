<?php
// tests/Feature/BoqAutoComponentTest.php

namespace Tests\Feature;

use App\Models\BoqItem;
use App\Models\BoqItemComponent;
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use App\Services\BoqService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoqAutoComponentTest extends TestCase
{
    use RefreshDatabase;

    private BoqService $service;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->service = app(BoqService::class);

        $client = Client::factory()->create();
        $this->project = Project::factory()->create(['client_id' => $client->id]);
    }

    public function test_direct_material_item_auto_creates_material_component()
    {
        $item = $this->service->store([
            'item_description'   => 'Reinforcing Steel',
            'unit'               => 'kgs',
            'quantity'           => 100,
            'material_unit_price' => 68.70,
            'labor_unit_price'   => 0,
            'is_carport'         => false,
            'nature'             => 'DIRECT_MATERIAL',
            'components'         => [],
        ], $this->project);

        $this->assertDatabaseHas('boq_item_components', [
            'boq_item_id'   => $item->id,
            'resource_type' => 'MATERIAL',
            'name'          => 'Reinforcing Steel',
            'unit'          => 'kgs',
        ]);
        $this->assertSame(1, $item->components()->count());
    }

    public function test_service_item_auto_creates_labor_component()
    {
        $item = $this->service->store([
            'item_description'   => 'Mobilization/Demobilization',
            'unit'               => 'lot',
            'quantity'           => 1,
            'material_unit_price' => 0,
            'labor_unit_price'   => 82240.00,
            'is_carport'         => false,
            'nature'             => 'SERVICE',
            'components'         => [],
        ], $this->project);

        $this->assertDatabaseHas('boq_item_components', [
            'boq_item_id'   => $item->id,
            'resource_type' => 'LABOR',
            'name'          => 'Mobilization/Demobilization',
        ]);
    }

    public function test_bundle_item_does_not_auto_create_component()
    {
        $item = $this->service->store([
            'item_description'   => 'Concrete Works',
            'unit'               => 'cu.m',
            'quantity'           => 382,
            'material_unit_price' => 6234.42,
            'labor_unit_price'   => 0,
            'is_carport'         => false,
            'nature'             => 'BUNDLE',
            'components'         => [],
        ], $this->project);

        $this->assertSame(0, $item->components()->count());
    }

    public function test_explicit_components_are_not_overridden_by_auto_create()
    {
        $item = $this->service->store([
            'item_description'   => 'Reinforcing Steel',
            'unit'               => 'kgs',
            'quantity'           => 100,
            'material_unit_price' => 0,
            'labor_unit_price'   => 0,
            'is_carport'         => false,
            'nature'             => 'DIRECT_MATERIAL',
            'components'         => [
                [
                    'resourceType'   => 'MATERIAL',
                    'name'           => 'Custom Component',
                    'unit'           => 'kgs',
                    'quantityFactor' => 1,
                    'unitRate'       => 68.70,
                    'noOfPersons'    => 0,
                    'hours'          => 0,
                ],
            ],
        ], $this->project);

        // Explicit component was provided — no second auto-created one
        $this->assertSame(1, $item->components()->count());
        $this->assertSame('Custom Component', $item->components()->first()->name);
    }

    public function test_bulk_store_does_not_duplicate_components_on_re_import()
    {
        // First import
        $this->service->bulkStore([
            [
                'itemDescription'   => 'Reinforcing Steel',
                'unit'              => 'kgs',
                'quantity'          => 100,
                'materialUnitPrice' => 68.70,
                'laborUnitPrice'    => 0,
                'isCarport'         => false,
                'nature'            => 'DIRECT_MATERIAL',
                'components'        => [],
            ],
        ], $this->project);

        // Re-import same item (quantity updated, but component must not be duplicated)
        $this->service->bulkStore([
            [
                'itemDescription'   => 'Reinforcing Steel',
                'unit'              => 'kgs',
                'quantity'          => 150,
                'materialUnitPrice' => 68.70,
                'laborUnitPrice'    => 0,
                'isCarport'         => false,
                'nature'            => 'DIRECT_MATERIAL',
                'components'        => [],
            ],
        ], $this->project);

        $item = BoqItem::where('item_description', 'Reinforcing Steel')->first();
        $this->assertSame(1, $item->components()->count());
    }

    public function test_bulk_store_auto_creates_components_based_on_nature()
    {
        $this->service->bulkStore([
            [
                'itemDescription'  => 'Reinforcing Steel',
                'unit'             => 'kgs',
                'quantity'         => 100,
                'materialUnitPrice' => 68.70,
                'laborUnitPrice'   => 0,
                'isCarport'        => false,
                'nature'           => 'DIRECT_MATERIAL',
                'components'       => [],
            ],
            [
                'itemDescription'  => 'Concrete Works',
                'unit'             => 'cu.m',
                'quantity'         => 382,
                'materialUnitPrice' => 6234.42,
                'laborUnitPrice'   => 0,
                'isCarport'        => false,
                'nature'           => 'BUNDLE',
                'components'       => [],
            ],
        ], $this->project);

        $steelItem = BoqItem::where('item_description', 'Reinforcing Steel')->first();
        $concreteItem = BoqItem::where('item_description', 'Concrete Works')->first();

        $this->assertSame(1, $steelItem->components()->count());
        $this->assertSame(0, $concreteItem->components()->count());
    }
}
