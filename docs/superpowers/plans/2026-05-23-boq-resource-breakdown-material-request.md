# BOQ Resource Breakdown via Material Request — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow site engineers to select and add BOQ item resources (components) directly in the Material Request form, with new resources saved permanently to `boq_item_components`.

**Architecture:** Enhance `MRCreateModal.jsx` to show a checklist of existing `boq_item_components` per selected BOQ item, plus an "Add Resource" row for new ones. On submit, `MaterialRequestService::create()` auto-creates `BoqItemComponent` records for new resources inside the same transaction. A migration makes `quantity_factor` and `client_unit_rate` nullable to support components created without rate data.

**Tech Stack:** Laravel 11, Inertia.js, React 18, PostgreSQL, Tailwind CSS, Lucide icons, Sonner (toasts)

---

## File Map

| File | Change |
|------|--------|
| `database/migrations/YYYY_MM_DD_create_boq_component_nullable_fields.php` | New migration — nullable `quantity_factor`, `client_unit_rate` |
| `app/Http/Requests/StoreMaterialRequestRequest.php` | Add `is_new_resource`, `resource_type` validation rules |
| `app/Services/MaterialRequestService.php` | Auto-create component for new resources in `create()` |
| `resources/js/Components/MaterialRequest/MRCreateModal.jsx` | Full UI redesign — checklist + new resource rows |
| `tests/Feature/MaterialRequestNewResourceTest.php` | New feature test |

---

## Task 1: Migration — Make quantity_factor and client_unit_rate Nullable

**Files:**
- Create: `database/migrations/2026_05_23_000001_make_boq_component_rate_fields_nullable.php`

When a site engineer adds a new resource during a material request, the rates and factor are unknown. These fields must be nullable.

- [ ] **Step 1: Create the migration file**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('quantity_factor', 10, 4)->nullable()->change();
            $table->decimal('client_unit_rate', 10, 2)->nullable()->change();
            $table->decimal('client_total_cost', 15, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('quantity_factor', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('client_unit_rate', 10, 2)->nullable(false)->default(0)->change();
            $table->decimal('client_total_cost', 15, 2)->nullable(false)->default(0)->change();
        });
    }
};
```

Save to: `database/migrations/2026_05_23_000001_make_boq_component_rate_fields_nullable.php`

- [ ] **Step 2: Run the migration**

```bash
php artisan migrate
```

Expected output: `Migrating: 2026_05_23_000001_make_boq_component_rate_fields_nullable` then `Migrated`.

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026_05_23_000001_make_boq_component_rate_fields_nullable.php
git commit -m "feat: make boq_item_components rate fields nullable for site-engineer-created resources"
```

---

## Task 2: Update StoreMaterialRequestRequest

**Files:**
- Modify: `app/Http/Requests/StoreMaterialRequestRequest.php`

Add validation for `is_new_resource` and `resource_type` fields submitted when the site engineer adds a resource that doesn't yet exist as a component.

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/MaterialRequestNewResourceTest.php`:

```php
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

        // Component was created permanently on the BOQ item
        $this->assertDatabaseHas('boq_item_components', [
            'boq_item_id' => $boqItem->id,
            'name' => 'Romex Wire',
            'unit' => 'meters',
            'resource_type' => 'MATERIAL',
        ]);

        // Material request item links to the new component
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

        // No new component was created
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
                        // resource_type missing
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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
php artisan test tests/Feature/MaterialRequestNewResourceTest.php
```

Expected: All 3 tests FAIL (component creation not implemented yet).

- [ ] **Step 3: Add validation rules to StoreMaterialRequestRequest**

Open `app/Http/Requests/StoreMaterialRequestRequest.php` and replace the `rules()` method:

```php
public function rules(): array
{
    return [
        'remarks' => 'nullable|string|max:500',
        'authorize_override' => 'sometimes|boolean',
        'items' => 'required|array|min:1',
        'items.*.boq_item_id' => 'nullable|exists:boq_items,id',
        'items.*.boq_item_component_id' => 'nullable|exists:boq_item_components,id',
        'items.*.is_new_resource' => 'sometimes|boolean',
        'items.*.resource_type' => 'required_if:items.*.is_new_resource,true|nullable|in:MATERIAL,LABOR,EQUIPMENT',
        'items.*.item_description' => 'required|string|max:500',
        'items.*.unit' => 'required|string|max:50',
        'items.*.quantity' => 'required|numeric|min:0.01',
        'items.*.material_unit_price' => 'nullable|numeric|min:0',
        'items.*.labor_unit_price' => 'nullable|numeric|min:0',
    ];
}
```

- [ ] **Step 4: Commit**

```bash
git add app/Http/Requests/StoreMaterialRequestRequest.php tests/Feature/MaterialRequestNewResourceTest.php
git commit -m "feat: add is_new_resource and resource_type validation to material request"
```

---

## Task 3: Update MaterialRequestService to Auto-Create Components

**Files:**
- Modify: `app/Services/MaterialRequestService.php:65-91`

When `is_new_resource` is true on a request item, create the `BoqItemComponent` first inside the same transaction, then use its ID for the `MaterialRequestItem`.

- [ ] **Step 1: Add `resolveComponentId` private method to MaterialRequestService**

Add this method before the `approve()` method in `app/Services/MaterialRequestService.php`:

```php
/**
 * Returns the component ID for a request item.
 * Creates a new BoqItemComponent if the item is flagged as a new resource.
 */
private function resolveComponentId(array $item): ?int
{
    if (!empty($item['boq_item_component_id'])) {
        return (int) $item['boq_item_component_id'];
    }

    if (!empty($item['is_new_resource']) && !empty($item['boq_item_id'])) {
        $component = BoqItemComponent::create([
            'boq_item_id'       => $item['boq_item_id'],
            'resource_type'     => $item['resource_type'],
            'name'              => $item['item_description'],
            'unit'              => $item['unit'],
            'quantity_factor'   => null,
            'client_unit_rate'  => null,
            'client_total_cost' => null,
            'altapil_unit_rate' => 0,
            'altapil_total_cost' => 0,
        ]);

        return $component->id;
    }

    return null;
}
```

- [ ] **Step 2: Update the `create()` method to call `resolveComponentId`**

In `app/Services/MaterialRequestService.php`, replace the `foreach` loop inside `create()` (lines 76–87):

```php
foreach ($validated['items'] as $item) {
    $componentId = $this->resolveComponentId($item);

    MaterialRequestItem::create([
        'material_request_id'   => $mr->id,
        'boq_item_id'           => $item['boq_item_id'] ?? null,
        'boq_item_component_id' => $componentId,
        'item_description'      => $item['item_description'],
        'unit'                  => $item['unit'],
        'quantity'              => $item['quantity'],
        'material_unit_price'   => $item['material_unit_price'] ?? 0,
        'labor_unit_price'      => $item['labor_unit_price'] ?? 0,
    ]);
}
```

- [ ] **Step 3: Run the tests**

```bash
php artisan test tests/Feature/MaterialRequestNewResourceTest.php
```

Expected: All 3 tests PASS.

- [ ] **Step 4: Run the full test suite to check for regressions**

```bash
php artisan test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/Services/MaterialRequestService.php
git commit -m "feat: auto-create boq_item_component for new resources in material request"
```

---

## Task 4: Redesign MRCreateModal.jsx — Checklist UI

**Files:**
- Modify: `resources/js/Components/MaterialRequest/MRCreateModal.jsx`

Replace the "Select Resource" dropdown with a checklist of existing components. Add an "Add Resource" button that appends a new editable row. All checked rows with quantities are batched into the cart together.

- [ ] **Step 1: Replace MRCreateModal.jsx with the new implementation**

Full file replacement for `resources/js/Components/MaterialRequest/MRCreateModal.jsx`:

```jsx
import React, { useState, useMemo } from 'react';
import Modal from '@/Components/UI/Modal';
import Select from '@/Components/UI/Select';
import { Package, Plus, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const RESOURCE_TYPES = [
    { value: 'MATERIAL', label: 'Material' },
    { value: 'LABOR', label: 'Labor' },
    { value: 'EQUIPMENT', label: 'Equipment' },
];

export default function MRCreateModal({
    isOpen,
    onClose,
    onSubmit,
    boqItems,
    submitting,
}) {
    const [selectedBoqItemId, setSelectedBoqItemId] = useState('');
    const [rows, setRows] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [cart, setCart] = useState([]);

    const selectedBoqItem = useMemo(
        () => boqItems?.find(b => b.id === Number(selectedBoqItemId)),
        [boqItems, selectedBoqItemId]
    );

    const clientBudget = useMemo(() => {
        if (!selectedBoqItem) return 0;
        return (Number(selectedBoqItem.material_unit_price) + Number(selectedBoqItem.labor_unit_price));
    }, [selectedBoqItem]);

    const handleBoqItemChange = (val) => {
        setSelectedBoqItemId(val);
        const item = boqItems?.find(b => b.id === Number(val));
        setRows(
            (item?.components || []).map(comp => ({
                id: `existing-${comp.id}`,
                type: 'existing',
                component: comp,
                qty: '',
                checked: false,
            }))
        );
    };

    const addNewResourceRow = () => {
        setRows(prev => [
            ...prev,
            {
                id: `new-${Date.now()}`,
                type: 'new',
                name: '',
                unit: '',
                resource_type: 'MATERIAL',
                qty: '',
                checked: true,
            },
        ]);
    };

    const updateRow = (id, field, value) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const removeRow = (id) => {
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleAddToCart = () => {
        if (!selectedBoqItemId) {
            toast.error('Select a BOQ item first.');
            return;
        }

        const checkedRows = rows.filter(r => r.checked);

        if (checkedRows.length === 0) {
            toast.error('Check at least one resource to add.');
            return;
        }

        const missingQty = checkedRows.filter(r => !r.qty || Number(r.qty) <= 0);
        if (missingQty.length > 0) {
            toast.error('Enter a quantity for every selected resource.');
            return;
        }

        const incompleteNew = checkedRows.filter(
            r => r.type === 'new' && (!r.name.trim() || !r.unit.trim())
        );
        if (incompleteNew.length > 0) {
            toast.error('Fill in name and unit for all new resources.');
            return;
        }

        const newItems = checkedRows.map(r => {
            if (r.type === 'existing') {
                return {
                    boq_item_id: Number(selectedBoqItemId),
                    boq_item_component_id: r.component.id,
                    is_new_resource: false,
                    item_description: r.component.name,
                    unit: r.component.unit || selectedBoqItem.unit,
                    quantity: Number(r.qty),
                    material_unit_price: 0,
                    labor_unit_price: 0,
                };
            }
            return {
                boq_item_id: Number(selectedBoqItemId),
                boq_item_component_id: null,
                is_new_resource: true,
                resource_type: r.resource_type,
                item_description: r.name.trim(),
                unit: r.unit.trim(),
                quantity: Number(r.qty),
                material_unit_price: 0,
                labor_unit_price: 0,
            };
        });

        setCart(prev => [...prev, ...newItems]);
        setSelectedBoqItemId('');
        setRows([]);
        toast.success(`${newItems.length} item(s) added to request.`);
    };

    const handleFormSubmit = () => {
        if (cart.length === 0) return;
        onSubmit({ items: cart, remarks });
    };

    const handleClose = () => {
        setSelectedBoqItemId('');
        setRows([]);
        setCart([]);
        setRemarks('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="New Resource Request" maxWidth="max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left panel — BOQ item + resource checklist */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Plus size={14} className="text-blue-500" /> Select Resources
                        </h3>

                        {/* BOQ Item selector */}
                        <div className="mb-4">
                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block tracking-wider">
                                BOQ Item
                            </label>
                            <Select
                                value={selectedBoqItemId}
                                onChange={handleBoqItemChange}
                                options={(boqItems || []).map(item => ({
                                    value: item.id.toString(),
                                    label: item.item_description,
                                }))}
                                placeholder="Select BOQ Item"
                                icon={Package}
                            />
                            {selectedBoqItem && (
                                <div className="mt-1.5 text-[10px] text-slate-500 flex justify-between">
                                    <span>{selectedBoqItem.unit} × {Number(selectedBoqItem.quantity).toLocaleString()}</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        Budget: ₱{Number(clientBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Resource checklist */}
                        {selectedBoqItemId && (
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">
                                    Resources
                                </label>

                                {rows.length === 0 && (
                                    <p className="text-[10px] text-slate-400 italic py-2">
                                        No resources yet. Click "Add Resource" below.
                                    </p>
                                )}

                                {rows.map(row => (
                                    <div
                                        key={row.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                            row.checked
                                                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={row.checked}
                                            onChange={e => updateRow(row.id, 'checked', e.target.checked)}
                                            className="shrink-0 accent-blue-600"
                                        />

                                        {row.type === 'existing' ? (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">
                                                        {row.component.name}
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 uppercase">
                                                        {row.component.resource_type} · {row.component.unit}
                                                    </div>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    placeholder="Qty"
                                                    value={row.qty}
                                                    onChange={e => updateRow(row.id, 'qty', e.target.value)}
                                                    disabled={!row.checked}
                                                    className="w-16 text-xs text-center border border-slate-300 dark:border-slate-600 rounded px-1 py-1 bg-white dark:bg-slate-900 disabled:opacity-40"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1 grid grid-cols-2 gap-1.5">
                                                    <input
                                                        type="text"
                                                        placeholder="Resource name"
                                                        value={row.name}
                                                        onChange={e => updateRow(row.id, 'name', e.target.value)}
                                                        className="col-span-2 text-[11px] border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Unit"
                                                        value={row.unit}
                                                        onChange={e => updateRow(row.id, 'unit', e.target.value)}
                                                        className="text-[11px] border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                                                    />
                                                    <select
                                                        value={row.resource_type}
                                                        onChange={e => updateRow(row.id, 'resource_type', e.target.value)}
                                                        className="text-[11px] border border-slate-300 dark:border-slate-600 rounded px-1 py-1 bg-white dark:bg-slate-900"
                                                    >
                                                        {RESOURCE_TYPES.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    placeholder="Qty"
                                                    value={row.qty}
                                                    onChange={e => updateRow(row.id, 'qty', e.target.value)}
                                                    className="w-16 text-xs text-center border border-slate-300 dark:border-slate-600 rounded px-1 py-1 bg-white dark:bg-slate-900"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(row.id)}
                                                    className="shrink-0 text-slate-300 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addNewResourceRow}
                                    className="w-full mt-1 py-1.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-[10px] font-bold text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors uppercase tracking-wider flex items-center justify-center gap-1"
                                >
                                    <Plus size={11} /> Add Resource
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 transition-colors"
                                >
                                    <ChevronRight size={13} /> Add to Request
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Remarks */}
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Remarks</label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded p-2 text-xs h-20 resize-none"
                            placeholder="Notes?"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>
                </div>

                {/* Right panel — Cart */}
                <div className="lg:col-span-7 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <Package size={14} className="text-blue-500" /> Requested Items
                    </h3>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-1 flex flex-col bg-white dark:bg-slate-800/80 max-h-[500px]">
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-[10px] text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-black tracking-widest text-[9px] sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 pl-4">Item</th>
                                        <th className="p-3">BOQ Item</th>
                                        <th className="p-3 text-center">Unit</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-center w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {cart.map((item, idx) => {
                                        const boqItem = boqItems?.find(b => b.id === item.boq_item_id);
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-3 pl-4">
                                                    <div className="font-medium">{item.item_description}</div>
                                                    {item.is_new_resource && (
                                                        <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                                                            NEW
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-slate-400 text-[9px] max-w-[120px] truncate">
                                                    {boqItem?.item_description || '—'}
                                                </td>
                                                <td className="p-3 text-center text-slate-500">{item.unit}</td>
                                                <td className="p-3 text-center text-cyan-600 font-bold">{item.quantity}</td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                                        className="text-slate-400 hover:text-red-500 font-bold text-base"
                                                    >
                                                        &times;
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {cart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400">
                                    <Package size={32} className="opacity-20 mb-3" />
                                    <div className="text-[10px] uppercase font-black opacity-50">Draft is Empty</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-slate-200">
                        <button onClick={handleClose} className="px-5 py-2.5 text-slate-500 text-xs font-bold uppercase rounded-lg">
                            Cancel
                        </button>
                        <button
                            onClick={handleFormSubmit}
                            disabled={cart.length === 0 || submitting}
                            className="bg-blue-600 px-6 py-2.5 rounded-lg text-white text-xs font-bold uppercase shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
```

- [ ] **Step 2: Update MaterialRequests.jsx to remove unused props from MRCreateModal**

Open `resources/js/Pages/Projects/MaterialRequests.jsx`. Find the `<MRCreateModal>` render and update to remove `inventoryItems`, `auth`, `requests` (no longer used by the new modal):

```jsx
<MRCreateModal
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    onSubmit={handleCreateSubmit}
    boqItems={boqItems}
    submitting={submitting}
/>
```

- [ ] **Step 3: Run the full test suite**

```bash
php artisan test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Components/MaterialRequest/MRCreateModal.jsx resources/js/Pages/Projects/MaterialRequests.jsx
git commit -m "feat: redesign material request modal with BOQ resource checklist and new resource adding"
```

---

## Task 5: Budget Monitoring — Augment BOQ Items with Spend Totals

**Files:**
- Modify: `app/Http/Controllers/MaterialRequestController.php:43-56`

Pass spend totals per BOQ item to the frontend so the modal can show how much has been requested against each item's budget.

- [ ] **Step 1: Update MaterialRequestController::index() to include spend per BOQ item**

In `app/Http/Controllers/MaterialRequestController.php`, replace the `$boqItems` query (lines 43–45):

```php
$boqItems = BoqItem::where('project_id', $project->id)
    ->with([
        'components',
        'components.materialRequestItems' => function ($q) {
            $q->whereHas('materialRequest', function ($q2) {
                $q2->whereNotIn('status', ['REJECTED', 'CANCELLED']);
            });
        },
    ])
    ->get()
    ->map(function ($boqItem) {
        $clientBudget = (float) $boqItem->material_unit_price + (float) $boqItem->labor_unit_price;

        $totalRequested = $boqItem->components->flatMap(fn ($c) => $c->materialRequestItems)
            ->sum(fn ($mri) => (float) $mri->quantity * ((float) $mri->material_unit_price + (float) $mri->labor_unit_price));

        $item = $boqItem->toArray();
        $item['client_budget'] = $clientBudget;
        $item['total_requested'] = $totalRequested;
        $item['remaining_budget'] = $clientBudget - $totalRequested;

        return $item;
    });
```

- [ ] **Step 2: Update MRCreateModal.jsx to show budget info per BOQ item**

In the BOQ item selector section of `MRCreateModal.jsx`, the budget label already shows `clientBudget`. Update the label to also show remaining:

Find the budget label block (below the Select component) and replace with:

```jsx
{selectedBoqItem && (
    <div className="mt-1.5 text-[10px] flex justify-between">
        <span className="text-slate-500">
            {selectedBoqItem.unit} × {Number(selectedBoqItem.quantity).toLocaleString()}
        </span>
        <span className="font-bold text-slate-700 dark:text-slate-300">
            Budget: ₱{Number(selectedBoqItem.client_budget ?? clientBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            {selectedBoqItem.remaining_budget != null && (
                <span className={`ml-2 ${selectedBoqItem.remaining_budget < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    · Remaining: ₱{Number(selectedBoqItem.remaining_budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )}
        </span>
    </div>
)}
```

- [ ] **Step 3: Run full tests**

```bash
php artisan test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/MaterialRequestController.php resources/js/Components/MaterialRequest/MRCreateModal.jsx
git commit -m "feat: show BOQ item budget and remaining spend in material request modal"
```

---

## Self-Review

**Spec coverage:**
- ✅ New resources saved permanently to `boq_item_components` — Task 3
- ✅ Checklist of existing components — Task 4
- ✅ "Add Resource" button for new ones — Task 4
- ✅ All qty fields always blank — Task 4 (no pre-fill)
- ✅ `resource_type` default Material, dropdown for Labor/Equipment — Task 4
- ✅ Both inserts in one transaction — Task 3 (`create()` is already wrapped in `DB::transaction`)
- ✅ Budget shown as reference — Task 5
- ✅ No hard blocks — no blocks in new modal
- ✅ Works for BOQ items with zero components — Task 4 (shows empty list, site engineer uses "Add Resource")

**Type consistency:**
- `resolveComponentId()` returns `?int` — used as `$componentId` which is passed to `boq_item_component_id` — matches `nullable|exists` validation ✅
- `rows` state array fields match what `handleAddToCart` reads ✅
- Cart item structure matches what `StoreMaterialRequestRequest` validates ✅

**No placeholders:** All steps have complete code. ✅
