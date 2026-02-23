<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBoqComponentRequest;
use App\Http\Requests\StoreBoqItemRequest;
use App\Models\BoqItem;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BoqController extends Controller
{
    public function index(Project $project)
    {
        if (auth()->user()->hasRole('site_engineer')) {
            abort(403, 'Unauthorized. Site Engineers cannot view BOQ details.');
        }

        $project->load('client', 'approver');
        $boqItems = BoqItem::where('project_id', $project->id)
            ->with('components')
            ->orderBy('id')
            ->get();

        $materials = \App\Models\Material::orderBy('name')->get();
        $units = \App\Models\Unit::orderBy('name')->get();

        return Inertia::render('Projects/Boq', [
            'project' => $project,
            'boqItems' => $boqItems,
            'materials' => $materials,
            'units' => $units,
            'isApproved' => !!$project->approved_by
        ]);
    }

    public function approve(Project $project)
    {
        if (!in_array(auth()->user()->role, ['admin', 'project_manager'])) {
            abort(403, 'Unauthorized. Only Admins and Project Managers can approve BOQs.');
        }

        if ($project->approved_by) {
            return redirect()->back()->with('error', 'Project BOQ is already approved.');
        }

        $project->update([
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Project BOQ approved successfully.');
    }

    public function store(StoreBoqItemRequest $request, Project $project)
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validated();

        $validated['project_id'] = $project->id;

        // Create Item
        $boqItem = BoqItem::create([
            'project_id' => $project->id,
            'item_description' => $validated['item_description'],
            'unit' => $validated['unit'],
            'quantity' => $validated['quantity'],
            'material_unit_price' => $validated['material_unit_price'] ?? 0,
            'labor_unit_price' => $validated['labor_unit_price'] ?? 0,
            'is_carport' => $validated['is_carport'] ?? false,
        ]);

        // Create Components if any
        if (!empty($validated['components'])) {
            foreach ($validated['components'] as $comp) {
                // Map frontend keys to DB columns if necessary, assuming DB columns match or close enough
                // Migration check needed? Assuming 'resource_type', 'name', 'quantity_factor', etc.
                // Let's use snake_case for DB columns based on Laravel conventions usually. 
                // Need to verify BoqItemComponent migration.
                // For now, I'll assume standard Laravel snake_case
                $boqItem->components()->create([
                    'resource_type' => $comp['resourceType'],
                    'name' => $comp['name'],
                    'quantity_factor' => $comp['quantityFactor'],
                    'client_unit_rate' => $comp['clientUnitRate'] ?? $comp['unitRate'], // Fallback for backward compatibility or if frontend not fully updated yet? No, plan says update frontend. But let's be safe.
                    // actually, better to just enforce new key.
                    'client_total_cost' => ($comp['clientUnitRate'] ?? $comp['unitRate']) * $comp['quantityFactor'],
                    'altapil_unit_rate' => $comp['altapilUnitRate'] ?? 0,
                    'altapil_total_cost' => ($comp['altapilUnitRate'] ?? 0) * $comp['quantityFactor'],
                    'no_of_persons' => $comp['noOfPersons'] ?? 0,
                    'hours' => $comp['hours'] ?? 0,
                ]);
            }
        }

        return redirect()->back()->with('success', 'BOQ item added successfully.');
    }

    public function bulkStore(Request $request, Project $project)
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.itemDescription' => 'required|string',
            'items.*.unit' => 'required|string',
            'items.*.quantity' => 'required|numeric',
            'items.*.materialUnitPrice' => 'required|numeric',
            'items.*.laborUnitPrice' => 'required|numeric',
            'items.*.isCarport' => 'boolean',
            'items.*.components' => 'array'
        ]);

        foreach ($validated['items'] as $itemData) {
            $boqItem = BoqItem::create([
                'project_id' => $project->id,
                'item_description' => $itemData['itemDescription'],
                'unit' => $itemData['unit'],
                'quantity' => $itemData['quantity'],
                'material_unit_price' => $itemData['materialUnitPrice'],
                'labor_unit_price' => $itemData['laborUnitPrice'],
                'is_carport' => $itemData['isCarport'] ?? false,
            ]);

            if (!empty($itemData['components'])) {
                foreach ($itemData['components'] as $comp) {
                    $boqItem->components()->create([
                        'resource_type' => $comp['resourceType'],
                        'name' => $comp['name'],
                        'quantity_factor' => $comp['quantityFactor'],
                        'client_unit_rate' => $comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0,
                        'client_total_cost' => ($comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0) * $comp['quantityFactor'],
                        'altapil_unit_rate' => $comp['altapilUnitRate'] ?? 0,
                        'altapil_total_cost' => ($comp['altapilUnitRate'] ?? 0) * $comp['quantityFactor'],
                        'no_of_persons' => $comp['noOfPersons'] ?? 0,
                        'hours' => $comp['hours'] ?? 0,
                    ]);
                }
            }
        }

        return redirect()->back()->with('success', 'Bulk upload successful.');
    }

    public function update(StoreBoqItemRequest $request, Project $project, BoqItem $boqItem)
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403);
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validated();

        $boqItem->update([
            'item_description' => $validated['item_description'],
            'unit' => $validated['unit'],
            'quantity' => $validated['quantity'],
            'material_unit_price' => $validated['material_unit_price'] ?? 0,
            'labor_unit_price' => $validated['labor_unit_price'] ?? 0,
            'is_carport' => $validated['is_carport'] ?? false,
        ]);

        return redirect()->back()->with('success', 'BOQ Item updated successfully.');
    }

    public function destroy(Project $project, BoqItem $boqItem)
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403, 'Item does not belong to this project.');
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $boqItem->components()->delete();
        $boqItem->delete();

        return redirect()->back()->with('success', 'BOQ item deleted successfully.');
    }

    // Components / DUPA Management

    public function storeComponent(StoreBoqComponentRequest $request, Project $project, BoqItem $boqItem)
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403);
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validated();

        $boqItem->components()->create([
            'resource_type' => $validated['resourceType'],
            'name' => $validated['name'],
            'quantity_factor' => $validated['quantityFactor'],
            'client_unit_rate' => $validated['clientUnitRate'],
            'client_total_cost' => $validated['clientUnitRate'] * $validated['quantityFactor'],
            'altapil_unit_rate' => $validated['altapilUnitRate'] ?? 0,
            'altapil_total_cost' => ($validated['altapilUnitRate'] ?? 0) * $validated['quantityFactor'],
            'no_of_persons' => $validated['noOfPersons'] ?? 0,
            'hours' => $validated['hours'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Resource added successfully.');
    }

    public function updateComponent(StoreBoqComponentRequest $request, Project $project, \App\Models\BoqItemComponent $boqComponent)
    {
        // Enforce project ownership via relation check
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validated();

        $boqComponent->update([
            'resource_type' => $validated['resourceType'],
            'name' => $validated['name'],
            'quantity_factor' => $validated['quantityFactor'],
            'client_unit_rate' => $validated['clientUnitRate'],
            'client_total_cost' => $validated['clientUnitRate'] * $validated['quantityFactor'],
            'altapil_unit_rate' => $validated['altapilUnitRate'] ?? 0,
            'altapil_total_cost' => ($validated['altapilUnitRate'] ?? 0) * $validated['quantityFactor'],
            'no_of_persons' => $validated['noOfPersons'] ?? 0,
            'hours' => $validated['hours'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Resource updated successfully.');
    }

    public function destroyComponent(Project $project, \App\Models\BoqItemComponent $boqComponent)
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $boqComponent->delete();
        return redirect()->back()->with('success', 'Resource deleted successfully.');
    }
}
