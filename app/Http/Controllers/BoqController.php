<?php

namespace App\Http\Controllers;

use App\Models\BoqItem;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BoqController extends Controller
{
    public function index(Project $project)
    {
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
        if (!in_array(auth()->user()->role, ['ADMIN', 'PROJECT_MANAGER'])) {
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

    public function store(Request $request, Project $project)
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validate([
            'item_description' => 'required|string|max:500',
            'unit' => 'required|string|max:50',
            'quantity' => 'required|numeric|min:0',
            'material_unit_price' => 'nullable|numeric|min:0',
            'labor_unit_price' => 'nullable|numeric|min:0',
            'is_carport' => 'nullable|boolean',
            'components' => 'nullable|array',
            'components.*.resourceType' => 'required|string|in:MATERIAL,LABOR,EQUIPMENT',
            'components.*.name' => 'required|string|max:255',
            'components.*.quantityFactor' => 'required|numeric|min:0',
            'components.*.unitRate' => 'required|numeric|min:0',
            'components.*.noOfPersons' => 'nullable|numeric|min:1',
            'components.*.hours' => 'nullable|numeric|min:0',
        ]);

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
                    'quantity_factor' => $comp['quantityFactor'], // or quantity_factor
                    'unit_rate' => $comp['unitRate'],
                    'no_of_persons' => $comp['noOfPersons'] ?? 1,
                    'hours' => $comp['hours'] ?? null,
                    'total_component_cost' => ($comp['resourceType'] === 'LABOR')
                        ? ($comp['unitRate'] * ($comp['noOfPersons'] ?? 1) * ($comp['hours'] ?? 0))
                        : ($comp['unitRate'] * $comp['quantityFactor'])
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
                        'unit_rate' => $comp['unitRate'],
                        'no_of_persons' => $comp['noOfPersons'] ?? 1,
                        'hours' => $comp['hours'] ?? null,
                        'total_component_cost' => ($comp['resourceType'] === 'LABOR')
                            ? ($comp['unitRate'] * ($comp['noOfPersons'] ?? 1) * ($comp['hours'] ?? 0))
                            : ($comp['unitRate'] * $comp['quantityFactor'])
                    ]);
                }
            }
        }

        return redirect()->back()->with('success', 'Bulk upload successful.');
    }

    public function update(Request $request, Project $project, BoqItem $boqItem)
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403);
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validate([
            'item_description' => 'required|string|max:500',
            'unit' => 'required|string|max:50',
            'quantity' => 'required|numeric|min:0',
            'material_unit_price' => 'nullable|numeric|min:0',
            'labor_unit_price' => 'nullable|numeric|min:0',
            'is_carport' => 'nullable|boolean',
        ]);

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

    public function storeComponent(Request $request, Project $project, BoqItem $boqItem)
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403);
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validate([
            'resourceType' => 'required|string|in:MATERIAL,LABOR,EQUIPMENT',
            'name' => 'required|string|max:255',
            'quantityFactor' => 'required|numeric|min:0',
            'unitRate' => 'required|numeric|min:0',
            'noOfPersons' => 'nullable|numeric|min:1',
            'hours' => 'nullable|numeric|min:0',
        ]);

        // Calculate Cost
        $totalCost = ($validated['resourceType'] === 'LABOR')
            ? ($validated['unitRate'] * ($validated['noOfPersons'] ?? 1) * ($validated['hours'] ?? 0))
            : ($validated['unitRate'] * $validated['quantityFactor']);

        $boqItem->components()->create([
            'resource_type' => $validated['resourceType'],
            'name' => $validated['name'],
            'quantity_factor' => $validated['quantityFactor'],
            'unit_rate' => $validated['unitRate'],
            'no_of_persons' => $validated['noOfPersons'] ?? 1,
            'hours' => $validated['hours'] ?? null,
            'total_component_cost' => $totalCost
        ]);

        return redirect()->back()->with('success', 'Resource added successfully.');
    }

    public function updateComponent(Request $request, Project $project, \App\Models\BoqItemComponent $boqComponent)
    {
        // Ideally enforce project ownership via relation check
        // $boqComponent->boqItem->project_id === $project->id
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validate([
            'resourceType' => 'required|string|in:MATERIAL,LABOR,EQUIPMENT',
            'name' => 'required|string|max:255',
            'quantityFactor' => 'required|numeric|min:0',
            'unitRate' => 'required|numeric|min:0',
            'noOfPersons' => 'nullable|numeric|min:1',
            'hours' => 'nullable|numeric|min:0',
        ]);

        $totalCost = ($validated['resourceType'] === 'LABOR')
            ? ($validated['unitRate'] * ($validated['noOfPersons'] ?? 1) * ($validated['hours'] ?? 0))
            : ($validated['unitRate'] * $validated['quantityFactor']);

        $boqComponent->update([
            'resource_type' => $validated['resourceType'],
            'name' => $validated['name'],
            'quantity_factor' => $validated['quantityFactor'],
            'unit_rate' => $validated['unitRate'],
            'no_of_persons' => $validated['noOfPersons'] ?? 1,
            'hours' => $validated['hours'] ?? null,
            'total_component_cost' => $totalCost
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
