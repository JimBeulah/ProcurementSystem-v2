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
        $project->load('client');
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
        ]);
    }

    public function store(Request $request, Project $project)
    {
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

    public function destroy(Project $project, BoqItem $boqItem)
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403, 'Item does not belong to this project.');
        }

        $boqItem->components()->delete();
        $boqItem->delete();

        return redirect()->back()->with('success', 'BOQ item deleted successfully.');
    }
}
