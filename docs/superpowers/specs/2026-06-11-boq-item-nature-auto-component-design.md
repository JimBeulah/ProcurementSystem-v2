# BOQ Item Nature & Auto-Component Creation

**Date:** 2026-06-11  
**Status:** Approved

## Problem

Different clients submit BOQ templates with fundamentally different item styles. Some items are directly purchasable materials ("Reinforcing Steel 104T kgs"), some are pure services ("Mobilization/Demobilization"), and some are work bundles that hide their materials inside a description ("Concrete Works", "Earthworks"). Today every BOQ item — regardless of type — requires manual `BoqItemComponent` creation before a Material Request can be raised. This is the primary encoding bottleneck.

## BOQ Item Types

| Nature | Example | What it means |
|---|---|---|
| `DIRECT_MATERIAL` | Reinforcing Steel 104T kgs | Item IS the purchasable resource — no breakdown needed |
| `SERVICE` | Mobilization/Demobilization | Pure labor/service deliverable — no material to buy |
| `BUNDLE` | Concrete Works, Excavation | Work package — hides multiple resources, needs manual breakdown |

Note: Section headers (EARTHWORKS, CONCRETE WORKS as a heading row) have no qty/unit/cost and are not BOQ items. They are out of scope for this feature.

## Solution

Classify each BOQ item at the point of creation/import, then auto-create a single matching `BoqItemComponent` for `DIRECT_MATERIAL` and `SERVICE` items. `BUNDLE` items retain the existing manual flow.

## Data Model

### Migration: add `nature` to `boq_items`

```php
$table->enum('nature', ['DIRECT_MATERIAL', 'SERVICE', 'BUNDLE'])->default('BUNDLE');
```

- Default `BUNDLE` — all existing items are unaffected and continue to work as before.
- No changes to `boq_item_components` — auto-created components are normal records, fully editable and deletable.

## Classification Logic

New service: `app/Services/BoqItemClassifier.php`

Runs keyword matching (case-insensitive, substring) against the item description. Evaluated in order — first match wins; `BUNDLE` is the fallback.

**DIRECT_MATERIAL keywords:**
```
supply, steel, rebar, pipe, pvc, chb, block, aggregate, gravel, sand,
cement, tile, paint, wire, lumber, plywood, phenolic, glass, door,
window, hardware, bolt, nail, bar, reinforcing, structural, sheet pile,
guardrail, concrete masonry
```

**SERVICE keywords:**
```
mobilization, demobilization, whse, documentation, management, safety,
health, loading, unloading, hauling, as-built, supervision, inspection,
signboard, billboard, permit, testing, survey
```

**BUNDLE:** fallback for anything that does not match above (Excavation, Concrete Works, Formworks, Plastering, Earthworks, Clearing, etc.)

The classifier result is a suggestion only — the user can override it in the UI before saving.

## UI Changes

### Smart Import Preview Modal (`SmartImportPreviewModal.jsx`)

Add a **Type** column to the preview table, right of Unit Cost:

- Pre-filled per row by `BoqItemClassifier` (called server-side in `SmartBoqImportController::analyze()`, returned alongside `sampleRows` and `mappings`)
- Rendered as a colored badge + dropdown: DIRECT = green, SERVICE = blue, BUNDLE = amber
- User can change the type for any row before confirming import
- The selected `nature` value is submitted with each row in the `confirm` payload

### AddBoqItemWizard (`AddBoqItemWizard.jsx`)

Add a **Nature** field to the item description step:

- Auto-detects as user types the description (debounced, client-side keyword check)
- Displays a contextual helper note:
  - DIRECT_MATERIAL: "A MATERIAL component will be auto-created for you"
  - SERVICE: "A LABOR component will be auto-created for you"
  - BUNDLE: "You'll add components manually after saving"
- User can override via dropdown before submitting
- The selected `nature` value is submitted to `BoqService::store()` as part of the wizard payload

## Auto-Component Creation Logic

In `BoqService`, immediately after a `BoqItem` is saved, if `nature !== 'BUNDLE'`:

**DIRECT_MATERIAL:**
```php
BoqItemComponent::create([
    'boq_item_id'     => $item->id,
    'resource_type'   => 'MATERIAL',
    'name'            => $item->item_description,
    'unit'            => $item->unit,
    'quantity_factor' => 1,
    'unit_rate'       => $item->material_unit_price,
    'total_cost'      => $item->material_unit_price,
]);
```

**SERVICE:**
```php
BoqItemComponent::create([
    'boq_item_id'     => $item->id,
    'resource_type'   => 'LABOR',
    'name'            => $item->item_description,
    'unit'            => $item->unit,
    'quantity_factor' => 1,
    'unit_rate'       => $item->labor_unit_price,
    'total_cost'      => $item->labor_unit_price,
]);
```

`BoqItemComponent::booted()` already calls `recalculateTotals()` on save, so `BoqItem.material_unit_price` / `labor_unit_price` roll up correctly with no extra code.

**BUNDLE:** no component created. Existing manual flow unchanged.

## Scope Boundaries

- **In scope:** new BOQ items (via wizard) and imported BOQ items (via Smart Import)
- **Out of scope:** retroactive reclassification of existing BOQ items (future feature)
- **Out of scope:** section header rows in BOQ files (future feature)
- **Out of scope:** AI-assisted material extraction for BUNDLE items (future feature)

## Files Affected

| File | Change |
|---|---|
| `database/migrations/` | New migration: add `nature` enum to `boq_items` |
| `app/Models/BoqItem.php` | Add `nature` to `$fillable` and `casts()` |
| `app/Services/BoqItemClassifier.php` | New service — keyword classification |
| `app/Services/BoqService.php` | Inject classifier, call auto-create after store/bulkStore |
| `app/Http/Controllers/SmartBoqImportController.php` | Run classifier in `analyze()`, accept `nature` per row in `confirm()` |
| `resources/js/Components/Boq/SmartImportPreviewModal.jsx` | Add Type column with badge + dropdown |
| `resources/js/Components/Boq/AddBoqItemWizard.jsx` | Add Nature field with auto-detect and helper note |
