# Remove BOQ Lock and PLANNING Status

**Date:** 2026-06-20
**Status:** Approved

## Problem

The BOQ approval lock was designed for client-facing contracts, but the BOQ in this system is internal only. The lock causes unnecessary friction:

- Site engineers add resource components (equipment, labor) with ₱0 price and 0 quantity factor because prices are unknown at planning time.
- When procurement officers canvas actual prices, they cannot update the BOQ component — the lock blocks all edits.
- To update any price or quantity, an admin/PM must run the full revision cycle, which drops the project back to PLANNING status.
- PLANNING status only existed to represent the pre-approval state; it has no other meaning in the workflow.

## Decision

- Remove the BOQ approve/revise flow entirely. BOQ is always editable.
- Remove the PLANNING project status. Projects are created and remain ACTIVE from the start.
- Keep the `approved_by`/`approved_at` DB columns (no drop migration) to avoid data loss risk.

---

## Backend Changes

### `app/Http/Controllers/BoqController.php`
- Remove `approve()` method.
- Remove `revise()` method.
- Remove all `if ($project->approved_by) abort(403)` guards — present in `store()`, `bulkStore()`, `update()`, `destroy()`, `destroyAll()`, `storeComponent()`, `updateComponent()`, `destroyComponent()`.
- Remove `'isApproved' => (bool) $project->approved_by` from the Inertia render in `index()`.
- Remove `'approver'` from `$project->load('client', 'approver')` in `index()`.

### `routes/web.php`
- Remove the two BOQ approval routes:
  ```
  Route::post('/projects/{project}/boq/approve', ...)
  Route::post('/projects/{project}/boq/revise', ...)
  ```

### `app/Models/Project.php`
- Remove `approved_by` and `approved_at` from `$fillable`.
- Remove `approved_at` from `casts()`.
- Remove the `approver()` relationship method.
- DB columns are kept (no migration to drop them).

### New Migration
- Change the `status` column default on `projects` table from `'PLANNING'` to `'ACTIVE'`.
- Update all existing rows where `status = 'PLANNING'` to `'ACTIVE'`.

---

## Frontend Changes

### `resources/js/Pages/Projects/Boq.jsx`
- Remove `isApproved` from `usePage().props` destructuring.
- Remove the approval banner section (currently shown when `isApproved` is true).
- Remove approve and revise button handlers and their modals/dialogs.
- Remove all `isApproved` conditionals on edit/delete buttons — buttons are always enabled.
- Remove all `toast.info('BOQ is approved and locked...')` calls.
- Remove the `!isApproved` guard on the "Add BOQ Item" button — always show it.
- Remove `!isApproved` guard on the "Add Resource" button inside the component panel.

### `resources/js/Components/Projects/ProjectForm.jsx`
- Remove `{ value: "PLANNING", label: "PLANNING" }` from the status select options.

### `resources/js/Pages/Projects/Index.jsx`
- Change the new-project default `status` from `'PLANNING'` to `'ACTIVE'`.
- Change the status filter default from `'PLANNING'` to `'ACTIVE'` (line 34).
- Change the edit-project status fallback from `project.status || 'ACTIVE'` — already correct, no change needed if PLANNING records are migrated.

### `resources/js/Components/Projects/ProjectTable.jsx`
- Remove any PLANNING-specific badge styling or filter option.

### `resources/js/Components/Projects/ProjectMetrics.jsx`
- Remove PLANNING from any status groupings/counts.

### `resources/js/Components/Projects/ProjectGrid.jsx`
- Remove PLANNING badge styling.

### `resources/js/Pages/Projects/Show.jsx`
- Remove PLANNING status badge handling.

---

## What Is Not Changing

- The `approve boq` permission in `RolesAndPermissionsSeeder` can be left in place — unused permissions cause no harm.
- All other approval flows (Material Request, Purchase Request, Purchase Order) are unaffected.
- Project status values ACTIVE, IN_PROGRESS, WARRANTY_PERIOD, COMPLETED remain unchanged.
