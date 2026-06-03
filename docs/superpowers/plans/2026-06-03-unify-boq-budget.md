# Unify BOQ Budget Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dual `client_unit_rate` / `altapil_unit_rate` fields on `boq_item_components` with a single `unit_rate` (budget) field, where profit/loss is now budget minus actual spend.

**Architecture:** The four columns (`client_unit_rate`, `client_total_cost`, `altapil_unit_rate`, `altapil_total_cost`) are merged into two (`unit_rate = client + altapil`, `total_cost = unit_rate × quantity_factor`). Profit tracking moves from a static margin to a dynamic variance: `total_budget − total_actual_spend`. Actual spend is the sum of MaterialRequestItem costs for non-rejected/cancelled material requests.

**Tech Stack:** Laravel 13 + Eloquent accessors, Inertia.js, React 18, PHPUnit, Playwright (no E2E changes needed).

---

## File Map

**Created:**
- `database/migrations/2026_06_03_000001_unify_boq_component_budget_fields.php`

**Modified:**
- `app/Models/BoqItemComponent.php` — remove 4 fields, add 2
- `app/Models/BoqItem.php` — recalculateTotals sums `total_cost`
- `app/Models/Project.php` — replace accessors: `total_altapil_budget` → `total_budget`, remove `total_profit`, add `total_actual_spend` + `profit_or_loss`
- `app/Services/BoqService.php` — use `unit_rate` / `total_cost`
- `app/Http/Requests/StoreBoqItemRequest.php` — remove `altapilUnitRate`, rename `clientUnitRate` → `unitRate`
- `app/Services/MaterialRequestService.php` — budget check uses `unit_rate`
- `app/Http/Controllers/MaterialRequestController.php` — rename `client_budget` → `budget`
- `app/Services/ProjectService.php` — rename subquery, add actual_spend + profit_or_loss
- `app/Services/ReportService.php` — `total_altapil_budget` → `total_budget`
- `app/Http/Controllers/ProjectController.php` — append new attributes on show
- `resources/js/Components/Boq/ResourceModal.jsx` — single Budget Rate field
- `resources/js/Components/Boq/AddBoqItemWizard.jsx` — single unitRate field + updated calcs
- `resources/js/Pages/Projects/Boq.jsx` — updated payload + component display
- `resources/js/Components/Projects/ProjectTable.jsx` — total_profit → profit_or_loss
- `resources/js/Components/Projects/ProjectGrid.jsx` — label update
- `resources/js/Pages/Projects/Show.jsx` — stat card update
- `tests/Feature/BoqAdditionTest.php` — updated fields
- `tests/Feature/MaterialRequestBudgetTest.php` — updated fields

---

## Task 1: Database Migration

**Files:**
- Create: `database/migrations/2026_06_03_000001_unify_boq_component_budget_fields.php`

- [ ] **Step 1: Create the migration file**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('unit_rate', 10, 2)->nullable()->after('quantity_factor');
            $table->decimal('total_cost', 15, 2)->nullable()->after('unit_rate');
        });

        DB::statement('UPDATE boq_item_components SET unit_rate = COALESCE(client_unit_rate, 0) + COALESCE(altapil_unit_rate, 0)');
        DB::statement('UPDATE boq_item_components SET total_cost = COALESCE(client_total_cost, 0) + COALESCE(altapil_total_cost, 0)');

        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('unit_rate', 10, 2)->default(0)->nullable(false)->change();
            $table->decimal('total_cost', 15, 2)->default(0)->nullable(false)->change();
            $table->dropColumn(['client_unit_rate', 'client_total_cost', 'altapil_unit_rate', 'altapil_total_cost']);
        });
    }

    public function down(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('client_unit_rate', 10, 2)->nullable()->after('quantity_factor');
            $table->decimal('client_total_cost', 15, 2)->nullable()->after('client_unit_rate');
            $table->decimal('altapil_unit_rate', 10, 2)->default(0)->after('client_total_cost');
            $table->decimal('altapil_total_cost', 15, 2)->default(0)->after('altapil_unit_rate');
        });

        DB::statement('UPDATE boq_item_components SET client_unit_rate = COALESCE(unit_rate, 0), client_total_cost = COALESCE(total_cost, 0), altapil_unit_rate = 0, altapil_total_cost = 0');

        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->dropColumn(['unit_rate', 'total_cost']);
        });
    }
};
```

- [ ] **Step 2: Run the migration**

```bash
php artisan migrate
```

Expected: `Migrating: 2026_06_03_000001_unify_boq_component_budget_fields` then `Migrated`.

- [ ] **Step 3: Verify the schema**

```bash
php artisan tinker --execute="Schema::getColumnListing('boq_item_components');"
```

Expected output contains `unit_rate` and `total_cost`, does NOT contain `client_unit_rate`, `altapil_unit_rate`, `client_total_cost`, `altapil_total_cost`.

- [ ] **Step 4: Commit**

```bash
git add database/migrations/2026_06_03_000001_unify_boq_component_budget_fields.php
git commit -m "feat: migrate boq_item_components to single unit_rate/total_cost budget fields"
```

---

## Task 2: Update Backend Models

**Files:**
- Modify: `app/Models/BoqItemComponent.php`
- Modify: `app/Models/BoqItem.php`
- Modify: `app/Models/Project.php`

- [ ] **Step 1: Update BoqItemComponent fillable and casts**

In `app/Models/BoqItemComponent.php`, replace the four budget fields in `$fillable` with the two new ones, and update `casts()` to match.

The fillable array currently contains `'client_unit_rate'`, `'client_total_cost'`, `'altapil_unit_rate'`, `'altapil_total_cost'`. Replace those four with `'unit_rate'` and `'total_cost'`.

In `casts()`, replace:
```php
'client_unit_rate' => 'decimal:2',
'client_total_cost' => 'decimal:2',
'altapil_unit_rate' => 'decimal:2',
'altapil_total_cost' => 'decimal:2',
```
With:
```php
'unit_rate' => 'decimal:2',
'total_cost' => 'decimal:2',
```

- [ ] **Step 2: Update BoqItem::recalculateTotals**

In `app/Models/BoqItem.php`, change both `sum('client_total_cost')` calls to `sum('total_cost')`:

```php
public function recalculateTotals(): void
{
    $materialTotal = $this->components()
        ->whereIn('resource_type', ['MATERIAL', 'EQUIPMENT'])
        ->sum('total_cost');

    $laborTotal = $this->components()
        ->where('resource_type', 'LABOR')
        ->sum('total_cost');

    $this->update([
        'material_unit_price' => $materialTotal,
        'labor_unit_price' => $laborTotal,
    ]);
}
```

- [ ] **Step 3: Replace Project model budget/profit accessors**

In `app/Models/Project.php`, add these imports at the top (after existing use statements):

```php
use App\Enums\MaterialRequestStatus;
use App\Models\MaterialRequestItem;
```

Then replace the two existing accessors (`getTotalProfitAttribute` and `getTotalAltapilBudgetAttribute`) with three new ones:

```php
public function getTotalBudgetAttribute(): float
{
    return (float) BoqItemComponent::join('boq_items', 'boq_items.id', '=', 'boq_item_components.boq_item_id')
        ->where('boq_items.project_id', $this->id)
        ->sum('total_cost');
}

public function getTotalActualSpendAttribute(): float
{
    return (float) MaterialRequestItem::join('material_requests', 'material_requests.id', '=', 'material_request_items.material_request_id')
        ->where('material_requests.project_id', $this->id)
        ->whereNotIn('material_requests.status', [
            MaterialRequestStatus::REJECTED->value,
            MaterialRequestStatus::CANCELLED->value,
        ])
        ->sum(DB::raw('material_request_items.quantity * (material_request_items.material_unit_price + material_request_items.labor_unit_price)'));
}

public function getProfitOrLossAttribute(): float
{
    return $this->total_budget - $this->total_actual_spend;
}
```

- [ ] **Step 4: Commit**

```bash
git add app/Models/BoqItemComponent.php app/Models/BoqItem.php app/Models/Project.php
git commit -m "feat: update models for unified unit_rate budget and profit_or_loss accessor"
```

---

## Task 3: Update BoqService and Form Validation

**Files:**
- Modify: `app/Services/BoqService.php`
- Modify: `app/Http/Requests/StoreBoqItemRequest.php`

- [ ] **Step 1: Update BoqService::store — component mapping**

In `app/Services/BoqService.php`, in the `store()` method, replace the four dual-rate lines in the `collect($validated['components'])->map()` closure:

```php
// Replace this block:
'client_unit_rate' => $comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0,
'client_total_cost' => ($comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0) * $comp['quantityFactor'],
'altapil_unit_rate' => $comp['altapilUnitRate'] ?? 0,
'altapil_total_cost' => ($comp['altapilUnitRate'] ?? 0) * $comp['quantityFactor'],

// With:
'unit_rate' => $unitRate = ($comp['unitRate'] ?? 0),
'total_cost' => $unitRate * $comp['quantityFactor'],
```

- [ ] **Step 2: Update BoqService::bulkStore — component mapping**

Same replacement in the `bulkStore()` method's `collect($itemData['components'])->map()` closure:

```php
// Replace:
'client_unit_rate' => $comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0,
'client_total_cost' => ($comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0) * $comp['quantityFactor'],
'altapil_unit_rate' => $comp['altapilUnitRate'] ?? 0,
'altapil_total_cost' => ($comp['altapilUnitRate'] ?? 0) * $comp['quantityFactor'],

// With:
'unit_rate' => $unitRate = ($comp['unitRate'] ?? 0),
'total_cost' => $unitRate * $comp['quantityFactor'],
```

- [ ] **Step 3: Update BoqService::storeComponent**

In `storeComponent()`, replace:

```php
// Replace:
'client_unit_rate' => $validated['clientUnitRate'],
'client_total_cost' => $validated['clientUnitRate'] * $validated['quantityFactor'],
'altapil_unit_rate' => $validated['altapilUnitRate'] ?? 0,
'altapil_total_cost' => ($validated['altapilUnitRate'] ?? 0) * $validated['quantityFactor'],

// With:
'unit_rate' => $validated['unitRate'],
'total_cost' => $validated['unitRate'] * $validated['quantityFactor'],
```

- [ ] **Step 4: Update BoqService::updateComponent**

In `updateComponent()`, same replacement:

```php
// Replace:
'client_unit_rate' => $validated['clientUnitRate'],
'client_total_cost' => $validated['clientUnitRate'] * $validated['quantityFactor'],
'altapil_unit_rate' => $validated['altapilUnitRate'] ?? 0,
'altapil_total_cost' => ($validated['altapilUnitRate'] ?? 0) * $validated['quantityFactor'],

// With:
'unit_rate' => $validated['unitRate'],
'total_cost' => $validated['unitRate'] * $validated['quantityFactor'],
```

- [ ] **Step 5: Update StoreBoqItemRequest validation**

In `app/Http/Requests/StoreBoqItemRequest.php`, replace the two component rate rules:

```php
// Replace:
'components.*.clientUnitRate' => 'required|numeric|min:0',
'components.*.altapilUnitRate' => 'nullable|numeric|min:0',

// With:
'components.*.unitRate' => 'required|numeric|min:0',
```

- [ ] **Step 6: Commit**

```bash
git add app/Services/BoqService.php app/Http/Requests/StoreBoqItemRequest.php
git commit -m "feat: update BoqService and validation to use single unitRate budget field"
```

---

## Task 4: Update Budget Check and Material Request Controller

**Files:**
- Modify: `app/Services/MaterialRequestService.php`
- Modify: `app/Http/Controllers/MaterialRequestController.php`

- [ ] **Step 1: Update checkBudgetViolations in MaterialRequestService**

In `app/Services/MaterialRequestService.php`, in `checkBudgetViolations()`, replace line 46 and the subsequent if-block:

```php
// Replace:
$totalAltapilBudget = $totalComponentQty * $component->altapil_unit_rate;
// ...
if (($previousRequestsCost + $currentRequestCost) > $totalAltapilBudget) {
    $remaining = max(0, $totalAltapilBudget - $previousRequestsCost);
    $overBudgetItems[] = "{$component->name} (Budget: ".number_format($totalAltapilBudget, 2).', Remaining: '.number_format($remaining, 2).', Requested: '.number_format($currentRequestCost, 2).')';
}

// With:
$totalBudget = $totalComponentQty * $component->unit_rate;
// ...
if (($previousRequestsCost + $currentRequestCost) > $totalBudget) {
    $remaining = max(0, $totalBudget - $previousRequestsCost);
    $overBudgetItems[] = "{$component->name} (Budget: ".number_format($totalBudget, 2).', Remaining: '.number_format($remaining, 2).', Requested: '.number_format($currentRequestCost, 2).')';
}
```

- [ ] **Step 2: Rename client_budget to budget in MaterialRequestController**

In `app/Http/Controllers/MaterialRequestController.php`, line 59, rename the key:

```php
// Replace:
$item['client_budget'] = $clientBudget;
$item['total_requested'] = $totalRequested;
$item['remaining_budget'] = $clientBudget - $totalRequested;

// With:
$item['budget'] = $clientBudget;
$item['total_requested'] = $totalRequested;
$item['remaining_budget'] = $clientBudget - $totalRequested;
```

- [ ] **Step 3: Commit**

```bash
git add app/Services/MaterialRequestService.php app/Http/Controllers/MaterialRequestController.php
git commit -m "feat: update budget check to use unified unit_rate"
```

---

## Task 5: Update ProjectService, ReportService, and ProjectController

**Files:**
- Modify: `app/Services/ProjectService.php`
- Modify: `app/Services/ReportService.php`
- Modify: `app/Http/Controllers/ProjectController.php`

- [ ] **Step 1: Rewrite ProjectService::getAllForUser**

In `app/Services/ProjectService.php`, add these imports at the top:

```php
use App\Enums\MaterialRequestStatus;
use App\Models\MaterialRequestItem;
```

Then replace the `getAllForUser` method:

```php
public function getAllForUser(User $user): Collection
{
    $projects = Project::with(['client', 'siteEngineer'])
        ->addSelect([
            'projects.*',
            'total_budget' => BoqItemComponent::selectRaw('COALESCE(SUM(total_cost), 0)')
                ->join('boq_items', 'boq_items.id', '=', 'boq_item_components.boq_item_id')
                ->whereColumn('boq_items.project_id', 'projects.id'),
            'total_actual_spend' => MaterialRequestItem::selectRaw('COALESCE(SUM(mri.quantity * (mri.material_unit_price + mri.labor_unit_price)), 0)')
                ->from('material_request_items as mri')
                ->join('material_requests as mr', 'mr.id', '=', 'mri.material_request_id')
                ->whereColumn('mr.project_id', 'projects.id')
                ->whereNotIn('mr.status', [
                    MaterialRequestStatus::REJECTED->value,
                    MaterialRequestStatus::CANCELLED->value,
                ]),
        ])
        ->forUser($user)
        ->orderBy('created_at', 'desc')
        ->get();

    $projects->each(function ($project) {
        $project->profit_or_loss = (float) $project->total_budget - (float) $project->total_actual_spend;
    });

    return $projects;
}
```

- [ ] **Step 2: Update ReportService**

In `app/Services/ReportService.php`, line 92, rename the accessor call:

```php
// Replace:
$boqBaselineCogs = (float) $project->total_altapil_budget;

// With:
$boqBaselineCogs = (float) $project->total_budget;
```

- [ ] **Step 3: Update ProjectController::show to append new attributes**

In `app/Http/Controllers/ProjectController.php`, in the `show()` method, append the new attributes after `load()`:

```php
public function show(Project $project)
{
    $this->authorize('view', $project);

    $project->load(['client', 'siteEngineer', 'boqItems', 'materialRequests', 'purchaseOrders']);
    $project->append(['total_budget', 'total_actual_spend', 'profit_or_loss']);

    return Inertia::render('Projects/Show', [
        'project' => $project,
    ]);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/Services/ProjectService.php app/Services/ReportService.php app/Http/Controllers/ProjectController.php
git commit -m "feat: update project stats to total_budget, actual_spend, and profit_or_loss"
```

---

## Task 6: Update React Form Components

**Files:**
- Modify: `resources/js/Components/Boq/ResourceModal.jsx`
- Modify: `resources/js/Components/Boq/AddBoqItemWizard.jsx`

- [ ] **Step 1: Replace dual rate fields in ResourceModal with single Budget Rate**

In `resources/js/Components/Boq/ResourceModal.jsx`, replace the two-column grid (lines 82–108) that shows "Client Unit Rate" and "Altapil Unit Rate" with a single full-width "Budget Rate" field:

```jsx
<div>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Budget Rate</label>
    <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
        <input
            type="text"
            required
            value={formatWithCommas(data.unit_rate !== undefined ? data.unit_rate : '')}
            onChange={e => handleNumericChange('unit_rate', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
        />
    </div>
</div>
```

- [ ] **Step 2: Update AddBoqItemWizard — initial component state**

In `resources/js/Components/Boq/AddBoqItemWizard.jsx`, line 132, replace the default component object:

```js
// Replace:
{ resourceType: 'MATERIAL', name: '', unit: '', quantityFactor: 0, clientUnitRate: 0, altapilUnitRate: 0, noOfPersons: 0, hours: 0 }

// With:
{ resourceType: 'MATERIAL', name: '', unit: '', quantityFactor: 0, unitRate: 0, noOfPersons: 0, hours: 0 }
```

- [ ] **Step 3: Update AddBoqItemWizard — numeric field list**

Line 149, remove `'altapilUnitRate'` and rename `'clientUnitRate'` to `'unitRate'`:

```js
// Replace:
const value = ['quantityFactor', 'clientUnitRate', 'altapilUnitRate', 'noOfPersons', 'hours'].includes(field)

// With:
const value = ['quantityFactor', 'unitRate', 'noOfPersons', 'hours'].includes(field)
```

- [ ] **Step 4: Update AddBoqItemWizard — live cost calculations**

Lines 168–173, rename `clientUnitRate` to `unitRate` in both reduce calls:

```js
const matCosts = newComponents
    .filter(c => c.resourceType === 'MATERIAL')
    .reduce((sum, c) => sum + (Number(c.quantityFactor) * Number(c.unitRate)), 0);
const labCosts = newComponents
    .filter(c => c.resourceType === 'LABOR' || c.resourceType === 'EQUIPMENT')
    .reduce((sum, c) => sum + (Number(c.quantityFactor) * Number(c.unitRate)), 0);
```

- [ ] **Step 5: Update AddBoqItemWizard — input field UI**

Replace the two-column "Client Rate" + "Altapil Rate" input block (lines ~401–430) with a single "Budget Rate" column:

```jsx
<div>
    <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 block text-right pr-1">Budget Rate</label>
    <input
        type="text"
        placeholder="0.00"
        className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 rounded shadow-sm p-1.5 text-xs text-slate-900 dark:text-white outline-none text-right focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
        value={formatWithCommas(comp.unitRate)}
        onChange={e => {
            const stripped = stripCommas(e.target.value);
            if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) {
                updateComponent(idx, 'unitRate', stripped);
            }
        }}
    />
</div>
```

- [ ] **Step 6: Update AddBoqItemWizard — row total display**

Line 439, rename `clientUnitRate` to `unitRate`:

```js
// Replace:
Row: ₱ {(Number(comp.quantityFactor) * Number(comp.clientUnitRate)).toLocaleString(undefined, { minimumFractionDigits: 2 })}

// With:
Row: ₱ {(Number(comp.quantityFactor) * Number(comp.unitRate)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
```

- [ ] **Step 7: Update AddBoqItemWizard — payload mapping**

Lines 83–84 in the `handleSubmit` payload, replace:

```js
// Replace:
clientUnitRate: Number(c.clientUnitRate) || 0,
altapilUnitRate: Number(c.altapilUnitRate) || 0,

// With:
unitRate: Number(c.unitRate) || 0,
```

- [ ] **Step 8: Commit**

```bash
git add resources/js/Components/Boq/ResourceModal.jsx resources/js/Components/Boq/AddBoqItemWizard.jsx
git commit -m "feat: replace dual rate inputs with single Budget Rate field in BOQ forms"
```

---

## Task 7: Update Boq.jsx Page

**Files:**
- Modify: `resources/js/Pages/Projects/Boq.jsx`

- [ ] **Step 1: Update resource form payload**

Lines 140–141, replace the dual-rate mapping:

```js
// Replace:
clientUnitRate: data.client_unit_rate !== undefined && data.client_unit_rate !== '' ? Number(data.client_unit_rate) : (data.unit_rate !== undefined && data.unit_rate !== '' ? Number(data.unit_rate) : 0),
altapilUnitRate: data.altapil_unit_rate !== undefined && data.altapil_unit_rate !== '' ? Number(data.altapil_unit_rate) : 0,

// With:
unitRate: data.unit_rate !== undefined && data.unit_rate !== '' ? Number(data.unit_rate) : 0,
```

- [ ] **Step 2: Update "Add Resource" button default data**

Line 516, remove `altapil_unit_rate` from the default data object:

```js
// Replace:
{ open: true, mode: 'add', data: { resource_type: 'MATERIAL', quantity_factor: 1, client_unit_rate: 0, altapil_unit_rate: 0, no_of_persons: 1, hours: 0 } }

// With:
{ open: true, mode: 'add', data: { resource_type: 'MATERIAL', quantity_factor: 1, unit_rate: 0, no_of_persons: 1, hours: 0 } }
```

- [ ] **Step 3: Replace "Overall Profit" drawer card with "Total Budget"**

Lines 494–507, replace the entire `Overall Profit` stat card div with a `Total Budget` card:

```jsx
<div className="p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 shadow-sm relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><TrendingUp size={40} className="text-emerald-500" /></div>
    <div className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><TrendingUp size={12} /> Total Budget</div>
    <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight tabular-nums">
        ₱{((Number(drawerItem.material_unit_price || 0) + Number(drawerItem.labor_unit_price || 0)) * Number(drawerItem.quantity || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </div>
    <div className="text-[10px] text-slate-400 mt-1 font-medium">total amount</div>
</div>
```

- [ ] **Step 4: Replace the 5-column component row with a 3-column layout**

Lines 564–596, replace the `grid grid-cols-2 lg:grid-cols-5` component stats grid with a 3-column layout (Qty Factor, Budget Rate, Total Cost):

```jsx
<div className="grid grid-cols-3 gap-2 text-[11px]">
    <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
        <span className="block text-slate-400 uppercase font-bold text-[9px] mb-1">Qty Factor</span>
        <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
            {comp.resource_type === 'MATERIAL'
                ? Number(comp.quantity_factor).toFixed(4)
                : ((Number(comp.no_of_persons) || 0) * (Number(comp.hours) || 0) / (Number(drawerItem?.quantity) || 1)).toFixed(4)
            }
        </span>
    </div>
    <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
        <span className="block text-slate-400 uppercase font-bold text-[9px] mb-1">Budget Rate</span>
        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold tabular-nums">₱{Number(comp.unit_rate || 0).toLocaleString()}</span>
    </div>
    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
        <span className="block text-emerald-600 uppercase font-bold text-[9px] mb-1">Total Cost</span>
        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black tabular-nums">
            ₱{Number(comp.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
    </div>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Projects/Boq.jsx
git commit -m "feat: update Boq page to show unified budget rate and remove dual-rate profit columns"
```

---

## Task 8: Update Project Display Components

**Files:**
- Modify: `resources/js/Components/Projects/ProjectTable.jsx`
- Modify: `resources/js/Components/Projects/ProjectGrid.jsx`
- Modify: `resources/js/Pages/Projects/Show.jsx`

- [ ] **Step 1: Update ProjectTable column**

In `resources/js/Components/Projects/ProjectTable.jsx`, find the column defined with `accessorKey: 'total_profit'` (around line 113) and update it:

```js
// Replace:
accessorKey: 'total_profit',
// ...header label (likely "Total Profit") and cell renderer using project.total_profit

// With:
accessorKey: 'profit_or_loss',
header: 'Profit / Loss',
cell: ({ row }) => {
    const val = Number(row.original.profit_or_loss || 0);
    return (
        <span className={val >= 0 ? 'text-emerald-600 font-mono' : 'text-red-500 font-mono'}>
            {val >= 0 ? '' : '-'}₱ {Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
    );
},
```

- [ ] **Step 2: Update ProjectGrid display**

In `resources/js/Components/Projects/ProjectGrid.jsx`, line 28, replace the "Total Profit" row:

```jsx
// Replace:
<div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50">
    <span className="text-purple-500/80">Total Profit</span>
    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">₱ {Number(project.total_profit || 0).toLocaleString()}</span>
</div>

// With:
<div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50">
    <span className={Number(project.profit_or_loss || 0) >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}>
        {Number(project.profit_or_loss || 0) >= 0 ? 'Profit' : 'Loss'}
    </span>
    <span className={`font-mono font-bold ${Number(project.profit_or_loss || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
        ₱ {Math.abs(Number(project.profit_or_loss || 0)).toLocaleString()}
    </span>
</div>
```

- [ ] **Step 3: Update Show.jsx stat card**

In `resources/js/Pages/Projects/Show.jsx`, around line 108, replace the "Total Profit" stat:

```js
// Replace:
{
    title: 'Total Profit',
    value: formatCurrency(project.total_profit),
    icon: <Activity size={20} className="text-purple-600 dark:text-purple-400" />,
    color: 'from-purple-500 to-indigo-500',
    hideForSiteEngineer: true
},

// With:
{
    title: Number(project.profit_or_loss || 0) >= 0 ? 'Profit' : 'Loss',
    value: formatCurrency(Math.abs(Number(project.profit_or_loss || 0))),
    icon: <Activity size={20} className={Number(project.profit_or_loss || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />,
    color: Number(project.profit_or_loss || 0) >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500',
    hideForSiteEngineer: true
},
```

- [ ] **Step 4: Update MRCreateModal client_budget reference**

In `resources/js/Components/MaterialRequest/MRCreateModal.jsx`, line 176, update the `client_budget` reference to `budget`:

```jsx
// Replace:
Budget: ₱{Number(selectedBoqItem.client_budget ?? clientBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}

// With:
Budget: ₱{Number(selectedBoqItem.budget ?? clientBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
```

- [ ] **Step 5: Commit**

```bash
git add resources/js/Components/Projects/ProjectTable.jsx resources/js/Components/Projects/ProjectGrid.jsx resources/js/Pages/Projects/Show.jsx resources/js/Components/MaterialRequest/MRCreateModal.jsx
git commit -m "feat: update project display components to show profit/loss based on budget vs actual spend"
```

---

## Task 9: Update Tests

**Files:**
- Modify: `tests/Feature/BoqAdditionTest.php`
- Modify: `tests/Feature/MaterialRequestBudgetTest.php`

- [ ] **Step 1: Update BoqAdditionTest payload and assertion**

In `tests/Feature/BoqAdditionTest.php`, replace the component payload and the final assertion:

```php
// In $payload['components'][0], replace:
'unitRate' => 100,    // Remove this line (already correct)
'clientUnitRate' => 100,   // Remove this
'altapilUnitRate' => 80,   // Remove this

// New component array:
[
    'resourceType' => 'MATERIAL',
    'name' => 'Cement',
    'quantityFactor' => 5,
    'unitRate' => 100,
    'noOfPersons' => 0,
    'hours' => 0,
],

// Replace the assertion:
$this->assertDatabaseHas('boq_item_components', ['name' => 'Cement', 'client_unit_rate' => 100]);
// With:
$this->assertDatabaseHas('boq_item_components', ['name' => 'Cement', 'unit_rate' => 100]);
```

- [ ] **Step 2: Update MaterialRequestBudgetTest component creation**

In `tests/Feature/MaterialRequestBudgetTest.php`, in `makeProjectWithComponent()`, replace the `BoqItemComponent::create()` call (lines 53–64):

```php
// Total budget = BOQ qty(10) * quantity_factor(5) * unit_rate(20) = 1000
$component = BoqItemComponent::create([
    'boq_item_id' => $boqItem->id,
    'resource_type' => 'MATERIAL',
    'name' => 'Cement',
    'quantity_factor' => 5,
    'unit_rate' => 20,
    'total_cost' => 100,
    'no_of_persons' => 0,
    'hours' => 0,
]);
```

Also update the comment on line 78 (within budget test):

```php
// Replace:
// Total Altapil budget = 10 * 5 * 20 = 1000. Requesting qty=45 @ ₱20 = 900 — within budget.

// With:
// Total budget = 10 * 5 * 20 = 1000. Requesting qty=45 @ ₱20 = 900 — within budget.
```

And line 106 (exceeds budget test):

```php
// Replace:
// First request: qty=40 @ ₱20 = 800. Budget is 1000, so this passes.

// With:
// First request: qty=40 @ ₱20 = 800. Budget is 1000, so this passes.
// (comment is already fine, just make sure the test logic still refers to unit_rate not altapil_unit_rate)
```

- [ ] **Step 3: Run the test suite to verify everything passes**

```bash
composer run test
```

Expected: All tests pass. If `BoqAdditionTest` or `MaterialRequestBudgetTest` fail, check that the component fields in the test match what the model now expects (`unit_rate`, `total_cost`).

- [ ] **Step 4: Commit**

```bash
git add tests/Feature/BoqAdditionTest.php tests/Feature/MaterialRequestBudgetTest.php
git commit -m "test: update BOQ and budget tests for unified unit_rate field"
```

---

## Final Verification

- [ ] **Step 1: Run full test suite**

```bash
composer run test
```

Expected: All tests green.

- [ ] **Step 2: Start dev server and verify manually**
  1. Go to any project → BOQ page. Verify the Add/Edit resource modal shows one "Budget Rate" field.
  2. Add a BOQ item with a resource (e.g., unit_rate = 100, qty factor = 2). Verify `boq_item_components.unit_rate = 100` and `total_cost = 200` in DB.
  3. Go to Material Requests for the project. Verify the "Budget" column shows the correct combined budget value.
  4. Go to Projects index. Verify the "Profit / Loss" column appears (green for positive, red for negative).
  5. Go to a project show page. Verify the "Profit / Loss" stat card shows correctly.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors.

---

## Known Limitation

Historical `MaterialRequestItem` records were created with `material_unit_price` / `labor_unit_price` values based on the old client-only rate. After this migration, the `BoqItem.material_unit_price` and `labor_unit_price` fields will reflect the unified (combined) budget. This means the `profit_or_loss` calculation for projects with existing material requests will be slightly inconsistent until those requests are re-created. This is acceptable for the initial migration.
