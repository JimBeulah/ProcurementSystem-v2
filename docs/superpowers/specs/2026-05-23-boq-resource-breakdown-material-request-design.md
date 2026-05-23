# BOQ Resource Breakdown via Material Request

**Date:** 2026-05-23
**Status:** Approved

## Problem

Altapil imports client BOQ templates that are high-level (e.g., "General Electrical Rewiring: 82.57 sqm @ ₱725"). These items have no resource breakdown (components). Altapil has no dedicated breakdown employee — the site engineer is the person who knows what materials, labor, and equipment are required for each BOQ item.

The current system has no guided path for a site engineer to define resources while creating a material request. This means:
- BOQ items stay unbroken down indefinitely
- Material requests have loose or no traceability to BOQ items
- Budget monitoring (client budget vs actual spend) is not possible at the BOQ item level

## Real-World Workflow

1. Client provides a BOQ (high-level lump sums per scope of work)
2. Altapil imports the BOQ into the system
3. Some BOQ items may already have components (from prior templates); most do not
4. Site engineer knows the resource breakdown for each BOQ item
5. Site engineer creates a material request when they need to procure something
6. Procurement creates a PO from the approved request
7. Altapil profits the difference between the client BOQ budget and actual PO spend

## Solution: Augmented Material Request Form

Enhance the existing material request creation form so that when a site engineer selects a BOQ item, they see its existing components and can add new ones. New components are saved permanently to `boq_item_components`. This captures the resource breakdown organically as part of the procurement workflow — no separate breakdown step required.

## Architecture

### No new tables required

The existing schema supports this fully:

```
boq_items
  └── boq_item_components  (resources: material, labor, equipment)
        └── material_request_items  (links request line to component)
```

### Backend changes

**`BoqController` / `BoqService`**
- New endpoint: `GET /boq-items/{id}/components`
- Returns existing components for a BOQ item (id, name, unit, resource_type)

**`MaterialRequestController` — store/update**
- For each request item submitted:
  - If `boq_item_component_id` is present → reuse existing component
  - If no `boq_item_component_id` (new resource) → insert into `boq_item_components` first, then use the new id
- Both inserts (`boq_item_components` and `material_request_items`) execute inside a single database transaction

**New component fields saved at request time:**
```
boq_item_components:
  boq_item_id       → from selected BOQ item
  name              → entered by site engineer
  unit              → entered by site engineer
  resource_type     → "Material" | "Labor" | "Equipment" (default: Material)
  quantity_factor   → null (not required at this stage)
  client_unit_rate  → null (filled later by management)
  altapil_unit_rate → null (filled later by management)
```

### Frontend changes

**`MaterialRequests` page (JSX)**
- When site engineer selects a BOQ item from the dropdown, fetch its components via `GET /boq-items/{id}/components`
- Render components as a checklist with a Qty field per row
- "Add Resource" button appends a blank editable row (name, unit, resource_type)
- Unchecked rows are excluded from the submitted payload
- All qty fields are always blank — never pre-filled

## UI Behavior

```
BOQ Item: [ General Electrical Rewiring (82.57 sqm) ▾ ]   Budget: ₱59,862

Resources:
┌──┬──────────────────────┬────────────┬──────────┐
│☑ │ Romex 12/2 Wire      │ meters     │ Qty: [  ]│  ← existing component
│☑ │ PVC Conduit          │ pcs        │ Qty: [  ]│  ← existing component
│☐ │ Junction Box         │ pcs        │ Qty: [  ]│  ← existing component (unchecked = skip)
├──┴──────────────────────┴────────────┴──────────┤
│ + Add Resource                                   │
└──────────────────────────────────────────────────┘

[ Add Resource row ]
│☑ │ [___name___] │ [unit▾] │ [Material▾] │ Qty: [  ] │ 🆕 new
```

**Qty field rules:**
- Always blank regardless of whether a quantity_factor exists on the component
- Site engineer must intentionally enter the quantity — prevents accidental over-ordering
- Submitting a checked row with no qty → validation error on that row

**BOQ item with zero components:**
- Component list renders empty
- Site engineer starts by clicking "Add Resource"

**resource_type dropdown:**
- Options: Material, Labor, Equipment
- Defaults to Material on new rows

## Budget Monitoring

Displayed on the **BOQ page** per item, and as a reference label on the **Material Request form**.

```
BOQ Item: General Electrical Rewiring
──────────────────────────────────────────
Client Budget:        ₱59,862   (from boq_items)
Total Requested:      ₱45,000   (sum of estimated costs on material requests)
Total Ordered (POs):  ₱41,500   (sum of actual PO amounts)
Remaining Budget:     ₱18,362
Variance:             +₱18,362  (positive = Altapil savings/profit)
```

**Calculation sources:**
- Client Budget → `boq_items` (quantity × unit price from client BOQ)
- Total Requested → `material_request_items` estimated costs linked to the BOQ item
- Total Ordered → `purchase_order_items` linked through the request chain
- No hard blocks anywhere — these are informational figures only

**Shown in three places:**
1. BOQ page — expandable row or inline columns per BOQ item
2. Material Request form — budget label next to the BOQ item selector (read-only)
3. Project dashboard — rolled-up totals across all BOQ items for the project

## Key Rules

- New resources added during a request are **permanently saved** to `boq_item_components`
- Pricing (rates) are **not required** at request time — filled later by management/procurement
- No hard budget blocks — system shows numbers, Altapil decides
- Works for both pre-broken-down BOQ items (components already exist) and blank ones (no components yet)
- All DB writes for a single request submit are wrapped in one transaction
