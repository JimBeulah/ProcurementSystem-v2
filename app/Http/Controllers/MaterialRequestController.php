<?php

namespace App\Http\Controllers;

use App\Models\BoqItem;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $isOverBudget = false;
        $overBudgetItems = [];

        // 1. Validation Phase: Check Budgets BEFORE creating any records
        foreach ($validated['items'] as $item) {
            if (!empty($item['boq_item_component_id'])) {
                $component = \App\Models\BoqItemComponent::with('boqItem')->find($item['boq_item_component_id']);

                if ($component && $component->boqItem) {
                    // Calculate Total Altapil Budget for this component
                    // Budget = Qty Factor * BOQ Item Qty * Altapil Unit Rate
                    // OR simply: component->altapil_total_cost * BOQ Item Qty (Since altapil_total_cost is unit_rate * qty_factor)
                    // Let's use the explicit calc for clarity:
                    // Total Quantity of Component = BOQ Item Quantity * Component Quantity Factor
                    // Total Budget Amount = Total Quantity * Altapil Unit Rate

                    $totalComponentQty = $component->boqItem->quantity * $component->quantity_factor;
                    $totalAltapilBudget = $totalComponentQty * $component->altapil_unit_rate;

                    // Skip validation if Altapil Budget is 0 (assuming it means not budgeted/tracked yet? 
                    // OR should we strictly block? The user said "base on the budget of the altapil".
                    // If budget is 0, they can't request. Strict.)

                    // Calculate Cost of CURRENT Request
                    $currentRequestCost = $item['quantity'] * (($item['material_unit_price'] ?? 0) + ($item['labor_unit_price'] ?? 0));

                    // Calculate Cost of PREVIOUS Requests (Approved or Pending)
                    $previousRequestsCost = MaterialRequestItem::where('boq_item_component_id', $component->id)
                        ->whereHas('materialRequest', function ($q) {
                            $q->where('status', '!=', 'REJECTED');
                        })
                        ->get()
                        ->sum(function ($reqItem) {
                            return $reqItem->quantity * ($reqItem->material_unit_price + $reqItem->labor_unit_price);
                        });

                    if (($previousRequestsCost + $currentRequestCost) > $totalAltapilBudget) {
                        $isOverBudget = true;
                        $remaining = max(0, $totalAltapilBudget - $previousRequestsCost);
                        $overBudgetItems[] = "{$component->name} (Budget: " . number_format($totalAltapilBudget, 2) . ", Remaining: " . number_format($remaining, 2) . ", Requested: " . number_format($currentRequestCost, 2) . ")";
                    }
                }
            }
        }

        if ($isOverBudget) {
            $itemsList = implode('; ', array_unique($overBudgetItems));
            return redirect()->back()->with('warning', "Budget Exceeded! The request exceeds the Altapil budget for: $itemsList. Request blocked.");
        }

        // 2. Creation Phase: Only create if validation passes
        $mr = MaterialRequest::create([
            'project_id' => $project->id,
            'requester_id' => auth()->id(),
            'request_date' => now(),
            'status' => 'PENDING',
            'remarks' => $validated['remarks'] ?? null,
        ]);

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
        }

        return redirect()->back()->with('success', 'Material request submitted successfully.');
    }

    public function approve(MaterialRequest $materialRequest)
    {
        if (!in_array(auth()->user()->role, ['admin', 'project_manager'])) {
            abort(403, 'Unauthorized. Only Admins and Project Managers can approve requests.');
        }

        if ($materialRequest->status !== 'PENDING') {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $pr = DB::transaction(function () use ($materialRequest) {
            $materialRequest->update([
                'status' => 'APPROVED',
                'approver_id' => auth()->id(),
            ]);

            // Auto-create Purchase Request
            $materialRequest->load('items');

            $totalCost = 0;
            foreach ($materialRequest->items as $item) {
                $totalCost += $item->quantity * ($item->material_unit_price + $item->labor_unit_price);
            }

            $pr = \App\Models\PurchaseRequest::create([
                'project_id' => $materialRequest->project_id,
                'requester_id' => $materialRequest->requester_id,
                'request_date' => now(),
                'status' => 'PENDING',
                'purpose' => 'Generated from MR-' . str_pad($materialRequest->id, 5, '0', STR_PAD_LEFT),
                'remarks' => $materialRequest->remarks,
                'total_estimated_cost' => $totalCost,
            ]);

            foreach ($materialRequest->items as $item) {
                \App\Models\PurchaseRequestItem::create([
                    'purchase_request_id' => $pr->id,
                    'item_description' => $item->item_description,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'estimated_unit_cost' => $item->material_unit_price + $item->labor_unit_price,
                    'estimated_total_cost' => $item->quantity * ($item->material_unit_price + $item->labor_unit_price),
                ]);
            }

            return $pr;
        });

        return redirect()->back()->with('success', "Material Request MR-{$materialRequest->id} approved and Purchase Request PR-" . str_pad($pr->id, 5, '0', STR_PAD_LEFT) . " generated.");
    }

    public function reject(Request $request, MaterialRequest $materialRequest)
    {
        if (!in_array(auth()->user()->role, ['admin', 'project_manager'])) {
            abort(403, 'Unauthorized. Only Admins and Project Managers can reject requests.');
        }

        if ($materialRequest->status !== 'PENDING') {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $materialRequest->update([
            'status' => 'REJECTED',
            'approver_id' => auth()->id(),
            'remarks' => $request->input('remarks', $materialRequest->remarks),
        ]);

        return redirect()->back()->with('success', "Material Request MR-{$materialRequest->id} rejected.");
    }
}
