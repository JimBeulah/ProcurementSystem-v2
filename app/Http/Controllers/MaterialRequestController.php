<?php

namespace App\Http\Controllers;

use App\Models\BoqItem;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MaterialRequestController extends Controller
{
    public function index(Project $project)
    {
        $project->load('client');

        $materialRequests = MaterialRequest::where('project_id', $project->id)
            ->with(['requester', 'items.boqItem', 'items.boqItemComponent'])
            ->orderBy('request_date', 'desc')
            ->get();

        $boqItems = BoqItem::where('project_id', $project->id)
            ->with('components')
            ->get();

        return Inertia::render('Projects/MaterialRequests', [
            'project' => $project,
            'materialRequests' => $materialRequests,
            'boqItems' => $boqItems,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.boq_item_id' => 'nullable|exists:boq_items,id',
            'items.*.boq_item_component_id' => 'nullable|exists:boq_item_components,id',
            'items.*.item_description' => 'required|string|max:500',
            'items.*.unit' => 'required|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.material_unit_price' => 'nullable|numeric|min:0',
            'items.*.labor_unit_price' => 'nullable|numeric|min:0',
        ]);

        $mr = MaterialRequest::create([
            'project_id' => $project->id,
            'requester_id' => auth()->id(),
            'request_date' => now(),
            'status' => 'PENDING',
            'remarks' => $validated['remarks'] ?? null,
        ]);

        $isOverBudget = false;
        $overBudgetItems = [];

        foreach ($validated['items'] as $item) {
            MaterialRequestItem::create([
                'material_request_id' => $mr->id,
                'boq_item_id' => $item['boq_item_id'] ?? null,
                'boq_item_component_id' => $item['boq_item_component_id'] ?? null,
                'item_description' => $item['item_description'],
                'unit' => $item['unit'],
                'quantity' => $item['quantity'],
                'material_unit_price' => $item['material_unit_price'] ?? 0,
                'labor_unit_price' => $item['labor_unit_price'] ?? 0,
            ]);

            // Budget Validation Checks
            if (!empty($item['boq_item_component_id'])) {
                $component = \App\Models\BoqItemComponent::with('boqItem')->find($item['boq_item_component_id']);

                if ($component && $component->boqItem) {
                    $totalBudgetedQty = $component->boqItem->quantity * $component->quantity_factor;

                    // Sum previous approved/pending requests for this component
                    $previouslyRequested = MaterialRequestItem::where('boq_item_component_id', $component->id)
                        ->whereHas('materialRequest', function ($q) {
                            $q->where('status', '!=', 'REJECTED');
                        })
                        ->where('material_request_id', '!=', $mr->id) // Exclude current
                        ->sum('quantity');

                    if (($previouslyRequested + $item['quantity']) > $totalBudgetedQty) {
                        $isOverBudget = true;
                        $overBudgetItems[] = $component->name;
                    }
                }
            }
        }

        if ($isOverBudget) {
            $itemsList = implode(', ', array_unique($overBudgetItems));
            return redirect()->back()->with('warning', "Material request submitted, BUT the following items exceed the BOQ budget: $itemsList. Admin has been notified.");
        }

        return redirect()->back()->with('success', 'Material request submitted successfully.');
    }
}
