<?php

namespace App\Services;

use App\Models\BoqItemComponent;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\Project;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MaterialRequestService
{
    /**
     * Validate budget constraints for material request items.
     * Returns a list of over-budget item descriptions, or empty array if all pass.
     */
    public function checkBudgetViolations(array $items): array
    {
        $overBudgetItems = [];

        foreach ($items as $item) {
            if (empty($item['boq_item_component_id'])) {
                continue;
            }

            $component = BoqItemComponent::with('boqItem')->find($item['boq_item_component_id']);

            if (!$component || !$component->boqItem) {
                continue;
            }

            $totalComponentQty = $component->boqItem->quantity * $component->quantity_factor;
            $totalAltapilBudget = $totalComponentQty * $component->altapil_unit_rate;

            $currentRequestCost = $item['quantity'] * (($item['material_unit_price'] ?? 0) + ($item['labor_unit_price'] ?? 0));

            $previousRequestsCost = MaterialRequestItem::where('boq_item_component_id', $component->id)
                ->whereHas('materialRequest', function ($q) {
                    $q->where('status', '!=', 'REJECTED');
                })
                ->get()
                ->sum(fn($reqItem) => $reqItem->quantity * ($reqItem->material_unit_price + $reqItem->labor_unit_price));

            if (($previousRequestsCost + $currentRequestCost) > $totalAltapilBudget) {
                $remaining = max(0, $totalAltapilBudget - $previousRequestsCost);
                $overBudgetItems[] = "{$component->name} (Budget: " . number_format($totalAltapilBudget, 2) . ", Remaining: " . number_format($remaining, 2) . ", Requested: " . number_format($currentRequestCost, 2) . ")";
            }
        }

        return array_unique($overBudgetItems);
    }

    /**
     * Create a new material request with its items for the given project.
     */
    public function create(Project $project, array $validated): MaterialRequest
    {
        $mr = MaterialRequest::create([
            'project_id' => $project->id,
            'requester_id' => Auth::id(),
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

        return $mr;
    }

    /**
     * Approve a material request and auto-generate a Purchase Request.
     * Wrapped in a DB transaction for atomicity.
     */
    public function approve(MaterialRequest $materialRequest): PurchaseRequest
    {
        return DB::transaction(function () use ($materialRequest) {
            $materialRequest->update([
                'status' => 'APPROVED',
                'approver_id' => Auth::id(),
            ]);

            $materialRequest->load('items');

            $totalCost = collect($materialRequest->items)->sum(
                fn($item) => $item->quantity * ($item->material_unit_price + $item->labor_unit_price)
            );

            $pr = PurchaseRequest::create([
                'project_id' => $materialRequest->project_id,
                'requester_id' => $materialRequest->requester_id,
                'approver_id' => Auth::id(),
                'request_date' => now(),
                'status' => 'APPROVED',
                'purpose' => 'Generated from MR-' . str_pad($materialRequest->id, 5, '0', STR_PAD_LEFT),
                'remarks' => $materialRequest->remarks,
                'total_estimated_cost' => $totalCost,
            ]);

            foreach ($materialRequest->items as $item) {
                PurchaseRequestItem::create([
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
    }

    /**
     * Reject a material request with an optional remarks override.
     */
    public function reject(MaterialRequest $materialRequest, ?string $remarks = null): void
    {
        $materialRequest->update([
            'status' => 'REJECTED',
            'approver_id' => Auth::id(),
            'remarks' => $remarks ?? $materialRequest->remarks,
        ]);
    }
}
