<?php

namespace App\Services;

use App\Enums\MaterialRequestStatus;
use App\Enums\PurchaseRequestStatus;
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

        $componentIds = collect($items)->pluck('boq_item_component_id')->filter()->unique();
        $components = BoqItemComponent::with('boqItem')->findMany($componentIds)->keyBy('id');

        foreach ($items as $item) {
            $componentId = $item['boq_item_component_id'] ?? null;
            if (! $componentId || ! $components->has($componentId)) {
                continue;
            }

            $component = $components->get($componentId);

            if (! $component->boqItem) {
                continue;
            }

            if ($component->quantity_factor === null) {
                continue;
            }

            $totalComponentQty = $component->boqItem->quantity * $component->quantity_factor;
            $totalBudget = $totalComponentQty * $component->unit_rate;

            $currentRequestCost = $item['quantity'] * (($item['material_unit_price'] ?? 0) + ($item['labor_unit_price'] ?? 0));

            $previousRequestsCost = MaterialRequestItem::where('boq_item_component_id', $component->id)
                ->whereHas('materialRequest', function ($q) {
                    $q->whereNotIn('status', [MaterialRequestStatus::REJECTED, MaterialRequestStatus::CANCELLED]);
                })
                ->get()
                ->sum(fn ($reqItem) => $reqItem->quantity * ($reqItem->material_unit_price + $reqItem->labor_unit_price));

            if (($previousRequestsCost + $currentRequestCost) > $totalBudget) {
                $remaining = max(0, $totalBudget - $previousRequestsCost);
                $overBudgetItems[] = "{$component->name} (Budget: ".number_format($totalBudget, 2).', Remaining: '.number_format($remaining, 2).', Requested: '.number_format($currentRequestCost, 2).')';
            }
        }

        return array_unique($overBudgetItems);
    }

    /**
     * Create a new material request with its items for the given project.
     */
    public function create(Project $project, array $validated): MaterialRequest
    {
        return DB::transaction(function () use ($project, $validated) {
            $mr = MaterialRequest::create([
                'project_id' => $project->id,
                'requester_id' => Auth::id(),
                'request_date' => now(),
                'status' => MaterialRequestStatus::PENDING,
                'remarks' => $validated['remarks'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $componentId = $this->resolveComponentId($item);

                MaterialRequestItem::create([
                    'material_request_id'   => $mr->id,
                    'boq_item_id'           => $item['boq_item_id'] ?? null,
                    'boq_item_component_id' => $componentId,
                    'item_description'      => $item['item_description'],
                    'unit'                  => $item['unit'],
                    'quantity'              => $item['quantity'],
                    'material_unit_price'   => $item['material_unit_price'] ?? 0,
                    'labor_unit_price'      => $item['labor_unit_price'] ?? 0,
                ]);
            }

            return $mr;
        });
    }

    /**
     * Resolve the boq_item_component_id for a material request item.
     * If the item references an existing component, return its ID.
     * If it is a new resource, create a BoqItemComponent record and return the new ID.
     */
    private function resolveComponentId(array $item): ?int
    {
        if (!empty($item['boq_item_component_id'])) {
            return (int) $item['boq_item_component_id'];
        }

        if (!empty($item['is_new_resource']) && !empty($item['boq_item_id'])) {
            $component = BoqItemComponent::create([
                'boq_item_id'     => $item['boq_item_id'],
                'resource_type'   => $item['resource_type'],
                'name'            => $item['item_description'],
                'unit'            => $item['unit'],
                'quantity_factor' => null,
                'unit_rate'       => 0,
                'total_cost'      => 0,
            ]);

            return $component->id;
        }

        return null;
    }

    /**
     * Approve a material request and auto-generate a Purchase Request.
     * Wrapped in a DB transaction for atomicity.
     */
    public function approve(MaterialRequest $materialRequest): PurchaseRequest
    {
        return DB::transaction(function () use ($materialRequest) {
            $materialRequest->update([
                'status' => MaterialRequestStatus::APPROVED,
                'approver_id' => Auth::id(),
            ]);

            $materialRequest->load('items');

            $totalCost = collect($materialRequest->items)->sum(
                fn ($item) => $item->quantity * ($item->material_unit_price + $item->labor_unit_price)
            );

            $pr = PurchaseRequest::create([
                'project_id' => $materialRequest->project_id,
                'requester_id' => $materialRequest->requester_id,
                'approver_id' => Auth::id(),
                'request_date' => now(),
                'status' => PurchaseRequestStatus::APPROVED,
                'purpose' => 'Generated from RQ-'.str_pad($materialRequest->id, 5, '0', STR_PAD_LEFT),
                'remarks' => $materialRequest->remarks,
                'total_estimated_cost' => $totalCost,
                'material_request_id' => $materialRequest->id,
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
            'status' => MaterialRequestStatus::REJECTED,
            'approver_id' => Auth::id(),
            'remarks' => $remarks ?? $materialRequest->remarks,
        ]);
    }

    /**
     * Cancel a material request.
     */
    public function cancel(MaterialRequest $materialRequest): void
    {
        $materialRequest->update([
            'status' => MaterialRequestStatus::CANCELLED,
        ]);
    }
}
