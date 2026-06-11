# BOQ Item Nature & Auto-Component Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Classify each BOQ item as DIRECT_MATERIAL, SERVICE, or BUNDLE at creation/import time and auto-create a matching `BoqItemComponent` for non-BUNDLE items, eliminating manual encoding for directly purchasable and service items.

**Architecture:** A new `BoqItemClassifier` service uses keyword matching to suggest a `nature` for each BOQ item. `BoqService` reads `nature` on save and auto-creates a single component when applicable. Both the Smart Import preview modal and the AddBoqItemWizard expose the nature field so the user can confirm or override before committing.

**Tech Stack:** Laravel 13 / PHP 8.3, React 18, PHPUnit (in-memory SQLite), Inertia.js

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `database/migrations/2026_06_11_000001_add_nature_to_boq_items.php` | Create | Adds `nature` enum column to `boq_items` |
| `app/Models/BoqItem.php` | Modify | Add `nature` to `$fillable` and `casts()` |
| `app/Services/BoqItemClassifier.php` | Create | Keyword-based nature classification |
| `app/Services/BoqService.php` | Modify | Inject classifier; auto-create component after store/bulkStore |
| `app/Http/Controllers/SmartBoqImportController.php` | Modify | Accept `nature` overrides in confirm(); classify all rows in PHP |
| `resources/js/Utils/boqNatureClassifier.js` | Create | Client-side keyword classifier (mirrors PHP) |
| `resources/js/Components/Boq/SmartImportPreviewModal.jsx` | Modify | Add Type column with badge + override dropdown |
| `resources/js/Components/Boq/AddBoqItemWizard.jsx` | Modify | Add Nature field with auto-detect and helper note |
| `tests/Feature/BoqItemClassifierTest.php` | Create | Unit tests for classifier |
| `tests/Feature/BoqAutoComponentTest.php` | Create | Integration tests for auto-create logic |

---

### Task 1: Migration and Model

**Files:**
- Create: `database/migrations/2026_06_11_000001_add_nature_to_boq_items.php`
- Modify: `app/Models/BoqItem.php`

- [ ] **Step 1: Create the migration**

```php
<?php
// database/migrations/2026_06_11_000001_add_nature_to_boq_items.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boq_items', function (Blueprint $table) {
            $table->enum('nature', ['DIRECT_MATERIAL', 'SERVICE', 'BUNDLE'])
                  ->default('BUNDLE')
                  ->after('is_carport');
        });
    }

    public function down(): void
    {
        Schema::table('boq_items', function (Blueprint $table) {
            $table->dropColumn('nature');
        });
    }
};
```

- [ ] **Step 2: Run the migration**

```bash
php artisan migrate
```

Expected: `Migrating: 2026_06_11_000001_add_nature_to_boq_items` then `Migrated`.

- [ ] **Step 3: Update BoqItem model**

In `app/Models/BoqItem.php`, add `'nature'` to `$fillable` and add a cast:

```php
protected $fillable = [
    'project_id',
    'item_description',
    'unit',
    'material_unit_price',
    'labor_unit_price',
    'quantity',
    'is_carport',
    'nature',         // ← add this
];

protected function casts(): array
{
    return [
        'material_unit_price' => 'decimal:2',
        'labor_unit_price'    => 'decimal:2',
        'quantity'            => 'decimal:2',
        'is_carport'          => 'boolean',
        // nature is a plain string enum — no cast needed
    ];
}
```

- [ ] **Step 4: Verify tests still pass**

```bash
composer run test
```

Expected: all existing tests pass (default `BUNDLE` means no behaviour change).

---

### Task 2: BoqItemClassifier Service

**Files:**
- Create: `app/Services/BoqItemClassifier.php`
- Create: `tests/Feature/BoqItemClassifierTest.php`

- [ ] **Step 1: Write the failing tests**

```php
<?php
// tests/Feature/BoqItemClassifierTest.php

namespace Tests\Feature;

use App\Services\BoqItemClassifier;
use Tests\TestCase;

class BoqItemClassifierTest extends TestCase
{
    private BoqItemClassifier $classifier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->classifier = new BoqItemClassifier();
    }

    public function test_classifies_reinforcing_steel_as_direct_material()
    {
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('Reinforcing Steel'));
    }

    public function test_classifies_pvc_pipe_as_direct_material()
    {
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('Supply and Installation of 50mmØ PVC Pipe'));
    }

    public function test_classifies_chb_as_direct_material()
    {
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('6" CHB'));
    }

    public function test_classifies_mobilization_as_service()
    {
        $this->assertSame('SERVICE', $this->classifier->classify('Mobilization/Demobilization for CME-GBT'));
    }

    public function test_classifies_whse_requirements_as_service()
    {
        $this->assertSame('SERVICE', $this->classifier->classify('WHSE Requirements'));
    }

    public function test_classifies_as_built_documentation_as_service()
    {
        $this->assertSame('SERVICE', $this->classifier->classify('As-built Documentation for Site Acceptance and Billing'));
    }

    public function test_classifies_concrete_works_as_bundle()
    {
        $this->assertSame('BUNDLE', $this->classifier->classify('Concrete Works'));
    }

    public function test_classifies_excavation_as_bundle()
    {
        $this->assertSame('BUNDLE', $this->classifier->classify('Excavation'));
    }

    public function test_classifies_formworks_as_bundle()
    {
        $this->assertSame('BUNDLE', $this->classifier->classify('Formworks/Falseworks'));
    }

    public function test_is_case_insensitive()
    {
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('REINFORCING STEEL'));
        $this->assertSame('SERVICE', $this->classifier->classify('mobilization'));
    }

    public function test_direct_takes_priority_over_service()
    {
        // "supply" is a DIRECT keyword; even if description contained a service word too
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('Supply of Safety Equipment'));
    }
}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
php artisan test --filter=BoqItemClassifierTest
```

Expected: `Error: Class "App\Services\BoqItemClassifier" not found`

- [ ] **Step 3: Implement the classifier**

```php
<?php
// app/Services/BoqItemClassifier.php

namespace App\Services;

class BoqItemClassifier
{
    private array $directKeywords = [
        'supply', 'steel', 'rebar', 'pipe', 'pvc', 'chb', 'block',
        'aggregate', 'gravel', 'sand', 'cement', 'tile', 'paint',
        'wire', 'lumber', 'plywood', 'phenolic', 'glass', 'door',
        'window', 'hardware', 'bolt', 'nail', 'bar', 'reinforcing',
        'structural', 'sheet pile', 'guardrail', 'concrete masonry',
    ];

    private array $serviceKeywords = [
        'mobilization', 'demobilization', 'whse', 'documentation',
        'management', 'safety', 'health', 'loading', 'unloading',
        'hauling', 'as-built', 'supervision', 'inspection',
        'signboard', 'billboard', 'permit', 'testing', 'survey',
    ];

    public function classify(string $description): string
    {
        $lower = strtolower($description);

        foreach ($this->directKeywords as $keyword) {
            if (str_contains($lower, $keyword)) {
                return 'DIRECT_MATERIAL';
            }
        }

        foreach ($this->serviceKeywords as $keyword) {
            if (str_contains($lower, $keyword)) {
                return 'SERVICE';
            }
        }

        return 'BUNDLE';
    }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
php artisan test --filter=BoqItemClassifierTest
```

Expected: 11 tests, 11 passed.

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_06_11_000001_add_nature_to_boq_items.php app/Models/BoqItem.php app/Services/BoqItemClassifier.php tests/Feature/BoqItemClassifierTest.php
git commit -m "feat: add nature field to boq_items and BoqItemClassifier service"
```

---

### Task 3: BoqService Auto-Component Creation

**Files:**
- Modify: `app/Services/BoqService.php`
- Create: `tests/Feature/BoqAutoComponentTest.php`

- [ ] **Step 1: Write the failing tests**

```php
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
php artisan test --filter=BoqAutoComponentTest
```

Expected: failures — auto-create logic does not exist yet.

- [ ] **Step 3: Update BoqService**

Replace the contents of `app/Services/BoqService.php`:

```php
<?php

namespace App\Services;

use App\Models\BoqItem;
use App\Models\BoqItemComponent;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class BoqService
{
    public function __construct(private BoqItemClassifier $classifier) {}

    public function store(array $validated, Project $project): BoqItem
    {
        return DB::transaction(function () use ($validated, $project) {
            $boqItem = BoqItem::create([
                'project_id'         => $project->id,
                'item_description'   => $validated['item_description'],
                'unit'               => $validated['unit'],
                'quantity'           => $validated['quantity'],
                'material_unit_price' => $validated['material_unit_price'] ?? 0,
                'labor_unit_price'   => $validated['labor_unit_price'] ?? 0,
                'is_carport'         => $validated['is_carport'] ?? false,
                'nature'             => $validated['nature'] ?? 'BUNDLE',
            ]);

            if (! empty($validated['components'])) {
                $componentsData = collect($validated['components'])->map(function ($comp) {
                    return [
                        'resource_type'   => $comp['resourceType'],
                        'name'            => $comp['name'],
                        'unit'            => $comp['unit'] ?? null,
                        'quantity_factor' => $comp['quantityFactor'],
                        'unit_rate'       => $unitRate = ($comp['unitRate'] ?? 0),
                        'total_cost'      => $unitRate * $comp['quantityFactor'],
                        'no_of_persons'   => $comp['noOfPersons'] ?? 0,
                        'hours'           => $comp['hours'] ?? 0,
                    ];
                })->toArray();

                $boqItem->components()->createMany($componentsData);
                $boqItem->recalculateTotals();
            } else {
                $this->maybeAutoCreateComponent($boqItem);
            }

            return $boqItem;
        });
    }

    public function bulkStore(array $itemsData, Project $project): void
    {
        DB::transaction(function () use ($itemsData, $project) {
            foreach ($itemsData as $itemData) {
                $boqItem = BoqItem::updateOrCreate(
                    [
                        'project_id'       => $project->id,
                        'item_description' => $itemData['itemDescription'],
                    ],
                    [
                        'unit'               => $itemData['unit'],
                        'quantity'           => $itemData['quantity'],
                        'material_unit_price' => $itemData['materialUnitPrice'],
                        'labor_unit_price'   => $itemData['laborUnitPrice'],
                        'is_carport'         => $itemData['isCarport'] ?? false,
                        'nature'             => $itemData['nature'] ?? 'BUNDLE',
                    ]
                );

                if (! empty($itemData['components'])) {
                    $componentsData = collect($itemData['components'])->map(function ($comp) {
                        return [
                            'resource_type'   => $comp['resourceType'],
                            'name'            => $comp['name'],
                            'unit'            => $comp['unit'] ?? null,
                            'quantity_factor' => $comp['quantityFactor'],
                            'unit_rate'       => $unitRate = ($comp['unitRate'] ?? 0),
                            'total_cost'      => $unitRate * $comp['quantityFactor'],
                            'no_of_persons'   => $comp['noOfPersons'] ?? 0,
                            'hours'           => $comp['hours'] ?? 0,
                        ];
                    })->toArray();

                    $boqItem->components()->createMany($componentsData);
                    $boqItem->recalculateTotals();
                } else {
                    $this->maybeAutoCreateComponent($boqItem);
                }
            }
        });
    }

    public function storeComponent(array $validated, BoqItem $boqItem): BoqItemComponent
    {
        return DB::transaction(function () use ($validated, $boqItem) {
            return $boqItem->components()->create([
                'resource_type'   => $validated['resourceType'],
                'name'            => $validated['name'],
                'unit'            => $validated['unit'] ?? null,
                'quantity_factor' => $validated['quantityFactor'],
                'unit_rate'       => $validated['unitRate'],
                'total_cost'      => $validated['unitRate'] * $validated['quantityFactor'],
                'no_of_persons'   => $validated['noOfPersons'] ?? 0,
                'hours'           => $validated['hours'] ?? 0,
            ]);
        });
    }

    public function updateComponent(array $validated, BoqItemComponent $boqComponent): BoqItemComponent
    {
        return DB::transaction(function () use ($validated, $boqComponent) {
            $boqComponent->update([
                'resource_type'   => $validated['resourceType'],
                'name'            => $validated['name'],
                'unit'            => $validated['unit'] ?? null,
                'quantity_factor' => $validated['quantityFactor'],
                'unit_rate'       => $validated['unitRate'],
                'total_cost'      => $validated['unitRate'] * $validated['quantityFactor'],
                'no_of_persons'   => $validated['noOfPersons'] ?? 0,
                'hours'           => $validated['hours'] ?? 0,
            ]);

            return $boqComponent;
        });
    }

    private function maybeAutoCreateComponent(BoqItem $boqItem): void
    {
        match ($boqItem->nature) {
            'DIRECT_MATERIAL' => $boqItem->components()->create([
                'resource_type'   => 'MATERIAL',
                'name'            => $boqItem->item_description,
                'unit'            => $boqItem->unit,
                'quantity_factor' => 1,
                'unit_rate'       => $boqItem->material_unit_price,
                'total_cost'      => $boqItem->material_unit_price,
                'no_of_persons'   => 0,
                'hours'           => 0,
            ]),
            'SERVICE' => $boqItem->components()->create([
                'resource_type'   => 'LABOR',
                'name'            => $boqItem->item_description,
                'unit'            => $boqItem->unit,
                'quantity_factor' => 1,
                'unit_rate'       => $boqItem->labor_unit_price,
                'total_cost'      => $boqItem->labor_unit_price,
                'no_of_persons'   => 0,
                'hours'           => 0,
            ]),
            default => null,
        };
    }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
php artisan test --filter=BoqAutoComponentTest
```

Expected: 5 tests, 5 passed.

- [ ] **Step 5: Run the full test suite**

```bash
composer run test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/Services/BoqService.php tests/Feature/BoqAutoComponentTest.php
git commit -m "feat: auto-create component in BoqService for DIRECT_MATERIAL and SERVICE items"
```

---

### Task 4: SmartBoqImportController — Accept Nature Per Row

**Files:**
- Modify: `app/Http/Controllers/SmartBoqImportController.php`

The controller's `confirm()` already maps rows → items and calls `bulkStore()`. We need to:
1. Accept an optional `overrides` map `{ rowIndex: nature }` from the frontend
2. For each item, classify using PHP (fallback) then apply any override

- [ ] **Step 1: Update the controller**

Replace `app/Http/Controllers/SmartBoqImportController.php` with:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\BoqColumnMapper;
use App\Services\BoqItemClassifier;
use App\Services\BoqService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class SmartBoqImportController extends Controller
{
    public function __construct(
        private BoqColumnMapper $mapper,
        private BoqService $boqService,
        private BoqItemClassifier $classifier,
    ) {}

    public function analyze(Request $request, Project $project): JsonResponse
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:20480',
        ]);

        $spreadsheet = IOFactory::load($request->file('file')->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $allRows = $sheet->toArray(null, true, false, false);

        $allRows = array_values(array_filter($allRows, fn($r) => count(array_filter($r, fn($c) => $c !== null && $c !== '')) > 0));

        if (empty($allRows)) {
            return response()->json(['message' => 'The file appears to be empty.'], 422);
        }

        $headerRowIndex = $this->findHeaderRowIndex($allRows);
        $headers = array_map(fn($v) => (string) ($v ?? ''), $allRows[$headerRowIndex]);
        $dataRows = array_slice($allRows, $headerRowIndex + 1);

        $castRows = array_map(
            fn($r) => array_values(array_map(fn($v) => (string) ($v ?? ''), $r)),
            $dataRows
        );

        $token = Str::uuid()->toString();
        Storage::put("boq_imports/{$token}.json", json_encode($castRows));

        return response()->json([
            'token'      => $token,
            'headers'    => $headers,
            'sampleRows' => array_slice($castRows, 0, 5),
            'mappings'   => $this->mapper->map($headers),
            'totalRows'  => count($castRows),
        ]);
    }

    public function confirm(Request $request, Project $project): RedirectResponse
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $request->validate([
            'token'     => 'required|string|uuid',
            'mappings'  => 'required|array',
            'overrides' => 'nullable|array',
        ]);

        $path = "boq_imports/{$request->token}.json";

        if (! Storage::exists($path)) {
            return back()->withErrors(['token' => 'Import session expired. Please re-upload the file.']);
        }

        $rows = json_decode(Storage::get($path), true);
        Storage::delete($path);

        $fieldByIndex = collect($request->mappings)
            ->filter(fn($m) => ! empty($m['mappedTo']))
            ->pluck('mappedTo', 'columnIndex')
            ->all();

        $overrides = $request->overrides ?? [];

        $items = collect($rows)
            ->values()
            ->map(function ($row, $index) use ($fieldByIndex, $overrides) {
                $item = $this->rowToItem($row, $fieldByIndex);
                $item['nature'] = $overrides[$index]
                    ?? $this->classifier->classify($item['itemDescription']);
                return $item;
            })
            ->filter(fn($item) => ! empty($item['itemDescription']))
            ->filter(fn($item) => ! $this->isSummaryRow($item['itemDescription']))
            ->unique('itemDescription')
            ->values()
            ->all();

        if (empty($items)) {
            return back()->withErrors(['file' => 'No valid BOQ items could be parsed from the file.']);
        }

        $this->boqService->bulkStore($items, $project);

        return redirect()->back()->with('success', count($items) . ' BOQ items imported successfully.');
    }

    private function findHeaderRowIndex(array $allRows): int
    {
        $bestIndex = 0;
        $bestScore = 0;

        foreach (array_slice($allRows, 0, 30, true) as $i => $row) {
            $headers = array_map(fn($v) => (string) ($v ?? ''), $row);
            $score = count(array_filter(
                $this->mapper->map($headers),
                fn($m) => $m['mappedTo'] !== null
            ));

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestIndex = $i;
            }
        }

        return $bestIndex;
    }

    private function isSummaryRow(string $description): bool
    {
        return (bool) preg_match(
            '/^(total|sub.?total|grand total|amount without|amount per|carport area|floor area|output per|direct unit cost)/i',
            trim($description)
        );
    }

    private function rowToItem(array $row, array $fieldByIndex): array
    {
        $item = [
            'itemDescription'   => '',
            'unit'              => 'lot',
            'quantity'          => 1,
            'materialUnitPrice' => 0,
            'laborUnitPrice'    => 0,
            'isCarport'         => false,
            'components'        => [],
        ];

        foreach ($fieldByIndex as $colIndex => $field) {
            $value = $row[$colIndex] ?? '';
            match ($field) {
                'itemDescription'  => $item['itemDescription']   = (string) $value,
                'unit'             => $item['unit']              = (string) $value ?: 'lot',
                'quantity'         => $item['quantity']          = ($value !== '' && $value !== null) ? (float) str_replace(',', '', $value) : 1,
                'materialUnitCost' => $item['materialUnitPrice'] = (float) str_replace(',', '', $value),
                'laborUnitCost'    => $item['laborUnitPrice']    = (float) str_replace(',', '', $value),
                default            => null,
            };
        }

        return $item;
    }
}
```

- [ ] **Step 2: Run the full test suite**

```bash
composer run test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/SmartBoqImportController.php
git commit -m "feat: accept nature overrides in SmartBoqImportController confirm"
```

---

### Task 5: Client-Side Nature Classifier Utility

**Files:**
- Create: `resources/js/Utils/boqNatureClassifier.js`

- [ ] **Step 1: Create the utility**

```js
// resources/js/Utils/boqNatureClassifier.js

const DIRECT_KEYWORDS = [
    'supply', 'steel', 'rebar', 'pipe', 'pvc', 'chb', 'block',
    'aggregate', 'gravel', 'sand', 'cement', 'tile', 'paint',
    'wire', 'lumber', 'plywood', 'phenolic', 'glass', 'door',
    'window', 'hardware', 'bolt', 'nail', 'bar', 'reinforcing',
    'structural', 'sheet pile', 'guardrail', 'concrete masonry',
];

const SERVICE_KEYWORDS = [
    'mobilization', 'demobilization', 'whse', 'documentation',
    'management', 'safety', 'health', 'loading', 'unloading',
    'hauling', 'as-built', 'supervision', 'inspection',
    'signboard', 'billboard', 'permit', 'testing', 'survey',
];

export const NATURE_OPTIONS = [
    { value: 'DIRECT_MATERIAL', label: 'Direct Material' },
    { value: 'SERVICE',         label: 'Service' },
    { value: 'BUNDLE',          label: 'Bundle' },
];

export const NATURE_COLORS = {
    DIRECT_MATERIAL: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    SERVICE:         'bg-blue-100 text-blue-700 border-blue-300',
    BUNDLE:          'bg-amber-100 text-amber-700 border-amber-300',
};

export function classifyNature(description) {
    const lower = (description || '').toLowerCase();

    for (const kw of DIRECT_KEYWORDS) {
        if (lower.includes(kw)) return 'DIRECT_MATERIAL';
    }
    for (const kw of SERVICE_KEYWORDS) {
        if (lower.includes(kw)) return 'SERVICE';
    }
    return 'BUNDLE';
}

export function natureHelperText(nature) {
    switch (nature) {
        case 'DIRECT_MATERIAL':
            return 'A MATERIAL component will be auto-created for you.';
        case 'SERVICE':
            return 'A LABOR component will be auto-created for you.';
        default:
            return 'You will add components manually after saving.';
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/Utils/boqNatureClassifier.js
git commit -m "feat: add client-side BOQ nature classifier utility"
```

---

### Task 6: AddBoqItemWizard — Nature Field

**Files:**
- Modify: `resources/js/Components/Boq/AddBoqItemWizard.jsx`

- [ ] **Step 1: Add `nature` to INITIAL_STATE and import classifier**

At the top of `AddBoqItemWizard.jsx`, add the import:

```js
import { classifyNature, natureHelperText, NATURE_OPTIONS, NATURE_COLORS } from '@/Utils/boqNatureClassifier';
```

Change `INITIAL_STATE` to include `nature`:

```js
const INITIAL_STATE = {
    itemDescription: '',
    unit: '',
    materialUnitPrice: 0,
    laborUnitPrice: 0,
    quantity: 0,
    isCarport: false,
    nature: 'BUNDLE',
    components: [],
};
```

- [ ] **Step 2: Auto-detect nature when description changes**

In the `onChange` handler for the `itemDescription` input (around line 234), add nature auto-detection:

```js
onChange={e => {
    const val = e.target.value;
    const mat = materials.find(m => m.name === val);
    if (mat) {
        setItem(prev => ({
            ...prev,
            itemDescription: mat.name,
            unit: mat.unit,
            nature: classifyNature(mat.name),
        }));
    } else {
        setItem(prev => ({
            ...prev,
            itemDescription: val,
            nature: classifyNature(val),
        }));
    }
    if (errors.itemDescription) setErrors(prev => { const n = { ...prev }; delete n.itemDescription; return n; });
}}
```

- [ ] **Step 3: Add the Nature field UI after the description input in Step 0**

After the `itemDescription` field `<div>` block (closing `</div>` before the `grid grid-cols-2` div), add:

```jsx
{/* Nature classification */}
<div>
    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black mb-1 block ml-1">
        Item Nature
    </label>
    <select
        className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
        value={item.nature}
        onChange={e => setItem(prev => ({ ...prev, nature: e.target.value }))}
    >
        {NATURE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
    <p className={`text-[10px] mt-1 ml-1 font-semibold ${
        item.nature === 'BUNDLE' ? 'text-amber-500' : 'text-emerald-600'
    }`}>
        {item.nature === 'BUNDLE' ? '⚠' : '✓'} {natureHelperText(item.nature)}
    </p>
</div>
```

- [ ] **Step 4: Include `nature` in the submit payload**

In the `handleSubmit` function, add `nature` to the payload:

```js
const payload = {
    item_description:    item.itemDescription,
    unit:                item.unit,
    quantity:            Number(item.quantity),
    material_unit_price: item.materialUnitPrice,
    labor_unit_price:    item.laborUnitPrice,
    is_carport:          item.isCarport,
    nature:              item.nature,         // ← add this
    components: item.components.map(c => ({
        ...c,
        unit:           c.unit || '',
        quantityFactor: Number(c.quantityFactor) || 0,
        unitRate:       Number(c.unitRate) || 0,
        noOfPersons:    Number(c.noOfPersons) || 0,
        hours:          Number(c.hours) || 0,
    }))
};
```

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add resources/js/Components/Boq/AddBoqItemWizard.jsx
git commit -m "feat: add nature field with auto-detection to AddBoqItemWizard"
```

---

### Task 7: SmartImportPreviewModal — Type Column

**Files:**
- Modify: `resources/js/Components/Boq/SmartImportPreviewModal.jsx`

The modal currently shows a sample preview table (last 5 rows). We need to add a `Type` column with a colored badge that the user can override, and pass per-row overrides in the confirm payload.

- [ ] **Step 1: Import the classifier utilities**

At the top of `SmartImportPreviewModal.jsx`, add:

```js
import { classifyNature, natureHelperText, NATURE_OPTIONS, NATURE_COLORS } from '@/Utils/boqNatureClassifier';
import { applyMappingsToRows } from '@/Utils/boqFileUtils';
```

(The `applyMappingsToRows` import already exists — do not duplicate it.)

- [ ] **Step 2: Add `natures` state to `ModalContent`**

In `ModalContent`, after the `mappings` state, add:

```js
// Nature overrides keyed by sample row index (0–4)
const [natureOverrides, setNatureOverrides] = useState({});
```

- [ ] **Step 3: Compute per-row natures from previewItems**

After the `previewItems` useMemo, add:

```js
const rowNatures = useMemo(() => {
    return previewItems.map((item, i) =>
        natureOverrides[i] ?? classifyNature(item.itemDescription)
    );
}, [previewItems, natureOverrides]);
```

- [ ] **Step 4: Add Type column header to sample preview table**

In the sample preview `<thead>`, add a Type column after `Lab. Cost`:

```jsx
<th className="px-3 py-2 text-left font-semibold">Type</th>
```

- [ ] **Step 5: Add Type cell to each preview row**

In the sample preview `<tbody>` row map, add a Type cell after the Lab. Cost cell:

```jsx
<td className="px-3 py-2">
    <select
        value={rowNatures[i]}
        onChange={e => setNatureOverrides(prev => ({ ...prev, [i]: e.target.value }))}
        className={`text-[10px] font-bold border rounded px-1.5 py-0.5 outline-none cursor-pointer ${NATURE_COLORS[rowNatures[i]]}`}
    >
        {NATURE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
</td>
```

- [ ] **Step 6: Send overrides in the confirm payload**

In `handleConfirm`, include `overrides`:

```js
const handleConfirm = () => {
    setSubmitting(true);
    router.post(
        `/projects/${projectId}/boq/smart-import/confirm`,
        { token, mappings, overrides: natureOverrides },
        {
            onSuccess: () => onClose(),
            onError:   () => setSubmitting(false),
        }
    );
};
```

- [ ] **Step 7: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add resources/js/Components/Boq/SmartImportPreviewModal.jsx
git commit -m "feat: add Type column with nature overrides to SmartImportPreviewModal"
```

---

### Task 8: Allow Nature Through StoreBoqItemRequest

**Files:**
- Modify: `app/Http/Requests/StoreBoqItemRequest.php`

The `BoqController::store()` and `update()` both use `StoreBoqItemRequest` for validation. Add `nature` to its rules so the field passes through to `BoqService::store()`.

- [ ] **Step 1: Add `nature` rule to StoreBoqItemRequest**

In `app/Http/Requests/StoreBoqItemRequest.php`, add one line to the `rules()` array:

```php
public function rules(): array
{
    return [
        'item_description' => [
            'required',
            'string',
            'max:500',
            Rule::unique('boq_items')
                ->where('project_id', $this->route('project')->id)
                ->whereNull('deleted_at')
                ->ignore($this->route('boq_item')),
        ],
        'unit'                       => 'required|string|max:50',
        'quantity'                   => 'required|numeric|min:0',
        'material_unit_price'        => 'nullable|numeric|min:0',
        'labor_unit_price'           => 'nullable|numeric|min:0',
        'is_carport'                 => 'nullable|boolean',
        'nature'                     => 'nullable|in:DIRECT_MATERIAL,SERVICE,BUNDLE',  // ← add this
        'components'                 => 'nullable|array',
        'components.*.resourceType'  => 'required|string|in:MATERIAL,LABOR,EQUIPMENT',
        'components.*.name'          => 'required|string|max:255',
        'components.*.quantityFactor' => 'required|numeric|min:0',
        'components.*.unitRate'      => 'required|numeric|min:0',
        'components.*.noOfPersons'   => 'nullable|numeric|min:0',
        'components.*.hours'         => 'nullable|numeric|min:0',
    ];
}
```

- [ ] **Step 2: Run the full test suite**

```bash
composer run test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/Http/Requests/StoreBoqItemRequest.php
git commit -m "feat: allow nature field through StoreBoqItemRequest validation"
```

---

### Task 9: Manual Verification

- [ ] **Step 1: Start the dev server**

```bash
composer run dev
```

- [ ] **Step 2: Open a project BOQ page and add a new item via wizard**

Navigate to any project → BOQ tab → click Add BOQ Item.

Type `Reinforcing Steel` in the description field.

Expected: Nature field auto-selects `Direct Material` and shows `✓ A MATERIAL component will be auto-created for you.`

- [ ] **Step 3: Complete the wizard without adding any resources**

Skip step 2 (Resources) and proceed to Review → Add to BOQ.

Expected: item appears in the BOQ table. Open its resource drawer — it should already have one MATERIAL component named `Reinforcing Steel`.

- [ ] **Step 4: Test SERVICE type**

Add another item, type `Mobilization/Demobilization`.

Expected: Nature auto-selects `Service`. Complete wizard. Resource drawer shows one LABOR component.

- [ ] **Step 5: Test BUNDLE type**

Add another item, type `Concrete Works`.

Expected: Nature stays `Bundle` with the amber warning. Complete wizard. Resource drawer is empty (manual entry required).

- [ ] **Step 6: Test Smart Import with Type column**

Upload a BOQ Excel file via Smart Import.

Expected: Sample Preview table shows a Type column with pre-classified badges. Changing a badge overrides that row's nature. Confirming import creates components for DIRECT and SERVICE rows.
