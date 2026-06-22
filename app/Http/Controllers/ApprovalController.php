<?php

namespace App\Http\Controllers;

use App\Enums\MaterialRequestStatus;
use App\Enums\PurchaseOrderStatus;
use App\Models\BoqItem;
use App\Models\InventoryItem;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ApprovalController extends Controller
{
    public function index()
    {
        // Eager load related models to reduce queries.
        // Budget context queries: PurchaseRequest, MaterialRequestItem, BoqItem (3 additional queries)
        // Consider caching or pagination if this grows beyond ~100 pending POs per load.
        $pendingPos = PurchaseOrder::with([
            'project',
            'requester',
            'items.purchaseRequestItem',
            'purchaseRequest', // Eager load to reduce join queries below
        ])
            ->where('status', PurchaseOrderStatus::PENDING)
            ->orderBy('created_at', 'asc')
            ->get();

        // Filter POs to only those for projects the user can access
        $user = auth()->user();
        $pendingPos = $pendingPos->filter(function (PurchaseOrder $po) use ($user) {
            // Allow if: no project attached, user is admin/finance, or user can view project
            if (! $po->project) {
                return true;
            }
            if (in_array($user->role, ['admin', 'finance'])) {
                return true;
            }

            return $user->can('view', $po->project);
        })->values();

        // --- BOQ-scoped budget context for each pending PO ---
        // Chain: PO → purchase_request.material_request_id → material_request_items.boq_item_id → boq_items

        $prIds = $pendingPos->pluck('purchase_request_id')->filter()->unique();

        // PR id → MR id
        $mrIdByPrId = PurchaseRequest::whereIn('id', $prIds)
            ->select('id', 'material_request_id')
            ->get()
            ->pluck('material_request_id', 'id');

        $mrIds = $mrIdByPrId->values()->filter()->unique();

        // MR id → boq_item_id → [item_descriptions]  (for PO amount attribution per BOQ item)
        $mrItemsRaw = MaterialRequestItem::whereIn('material_request_id', $mrIds)
            ->whereNotNull('boq_item_id')
            ->get(['material_request_id', 'boq_item_id', 'item_description']);

        // mr_id → boq_item_id → [descriptions]
        $descsByMrAndBoq = $mrItemsRaw
            ->groupBy('material_request_id')
            ->map(fn ($rows) => $rows->groupBy('boq_item_id')
                ->map(fn ($r) => $r->pluck('item_description')->unique()->values())
            );

        // All unique BOQ item IDs
        $allBoqItemIds = $mrItemsRaw->pluck('boq_item_id')->unique();
        $boqItemsById = BoqItem::whereIn('id', $allBoqItemIds)
            ->whereNull('deleted_at')
            ->get(['id', 'item_description', 'material_unit_price', 'labor_unit_price', 'quantity'])
            ->keyBy('id');

        $pendingPos = $pendingPos->map(function (PurchaseOrder $po) use (
            $mrIdByPrId, $descsByMrAndBoq, $boqItemsById
        ) {
            $mrId = $mrIdByPrId[$po->purchase_request_id] ?? null;
            $boqMap = $mrId ? ($descsByMrAndBoq[$mrId] ?? collect()) : collect();

            if ($boqMap->isEmpty()) {
                $data = $po->toArray();
                $data['budget_context'] = ['has_boq_link' => false, 'breakdown' => []];

                return $data;
            }

            // Map PR item description → PO item total (quantity × unit_price)
            $poTotalByDesc = collect($po->items)->mapWithKeys(fn ($item) => [
                ($item->purchaseRequestItem?->item_description ?? $item->material_name) => (float) $item->quantity * (float) $item->unit_price,
            ]);

            // Build one row per BOQ item
            $breakdown = $boqMap->map(function ($descriptions, $boqItemId) use ($boqItemsById, $poTotalByDesc) {
                $boqItem = $boqItemsById[$boqItemId] ?? null;
                if (! $boqItem) {
                    return null;
                }

                $budget = ((float) $boqItem->material_unit_price + (float) $boqItem->labor_unit_price)
                            * (float) $boqItem->quantity;
                $poAmount = $descriptions->sum(fn ($desc) => $poTotalByDesc[$desc] ?? 0);

                return [
                    'boq_item_name' => $boqItem->item_description,
                    'budget' => $budget,
                    'this_po_amount' => $poAmount,
                    'remaining_after' => $budget - $poAmount,
                ];
            })->filter()->values();

            $data = $po->toArray();
            $data['budget_context'] = [
                'has_boq_link' => true,
                'breakdown' => $breakdown,
            ];

            return $data;
        });

        $warehouseStock = InventoryItem::whereNull('project_id')
            ->select('material_name', DB::raw('SUM(quantity) as total_quantity'))
            ->groupBy('material_name')
            ->pluck('total_quantity', 'material_name');

        $pendingMrs = MaterialRequest::with(['project', 'requester', 'items'])
            ->where('status', MaterialRequestStatus::PENDING)
            ->orderBy('created_at', 'asc')
            ->get()
            ->filter(function (MaterialRequest $mr) use ($user) {
                // Filter MRs to only those for projects the user can access
                if (! $mr->project) {
                    return true;
                }
                if (in_array($user->role, ['admin', 'finance'])) {
                    return true;
                }

                return $user->can('view', $mr->project);
            })
            ->values()
            ->map(function (MaterialRequest $mr) use ($warehouseStock) {
                $items = [];
                foreach ($mr->items as $item) {
                    $itemData = $item->toArray();
                    $itemData['warehouse_quantity'] = (float) ($warehouseStock[$item->item_description] ?? 0);
                    $items[] = $itemData;
                }

                $mrData = $mr->toArray();
                $mrData['items'] = $items;

                return $mrData;
            });

        return Inertia::render('Purchasing/Approvals/Index', [
            'pendingPos' => $pendingPos,
            'pendingMrs' => $pendingMrs,
        ]);
    }
}
