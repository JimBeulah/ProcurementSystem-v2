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
        $pendingPos = PurchaseOrder::with(['project', 'requester', 'items.purchaseRequestItem'])
            ->where('status', PurchaseOrderStatus::PENDING)
            ->orderBy('created_at', 'asc')
            ->get();

        // --- BOQ-scoped budget context for each pending PO ---
        // Chain: PO → purchase_request.material_request_id → material_request_items.boq_item_id → boq_items

        $prIds = $pendingPos->pluck('purchase_request_id')->filter()->unique();

        // PR id → MR id
        $mrIdByPrId = PurchaseRequest::whereIn('id', $prIds)
            ->select('id', 'material_request_id')
            ->get()
            ->pluck('material_request_id', 'id');

        $mrIds = $mrIdByPrId->values()->filter()->unique();

        // MR id → [boq_item_ids]
        $boqItemIdsByMrId = MaterialRequestItem::whereIn('material_request_id', $mrIds)
            ->whereNotNull('boq_item_id')
            ->select('material_request_id', 'boq_item_id')
            ->distinct()
            ->get()
            ->groupBy('material_request_id')
            ->map(fn ($rows) => $rows->pluck('boq_item_id')->unique()->values());

        // Fetch all relevant BOQ items keyed by id
        $allBoqItemIds = $boqItemIdsByMrId->flatten()->unique();
        $boqItemsById = BoqItem::whereIn('id', $allBoqItemIds)
            ->whereNull('deleted_at')
            ->get(['id', 'item_description', 'material_unit_price', 'labor_unit_price', 'quantity'])
            ->keyBy('id');

        // Committed PO spend per MR (all non-cancelled/declined POs from the same MR, via PR)
        $committedByMrId = DB::table('purchase_orders as po')
            ->join('purchase_requests as pr', 'po.purchase_request_id', '=', 'pr.id')
            ->whereIn('pr.material_request_id', $mrIds)
            ->whereNotIn('po.status', [PurchaseOrderStatus::CANCELLED->value, PurchaseOrderStatus::DECLINED->value])
            ->whereNull('po.deleted_at')
            ->select('pr.material_request_id', DB::raw('SUM(po.total_amount) as total_spend'))
            ->groupBy('pr.material_request_id')
            ->pluck('total_spend', 'material_request_id');

        $pendingPos = $pendingPos->map(function (PurchaseOrder $po) use (
            $mrIdByPrId, $boqItemIdsByMrId, $boqItemsById, $committedByMrId
        ) {
            $mrId = $mrIdByPrId[$po->purchase_request_id] ?? null;
            $boqItemIds = $mrId ? ($boqItemIdsByMrId[$mrId] ?? collect()) : collect();

            $boqBudget = $boqItemIds->sum(function ($id) use ($boqItemsById) {
                $item = $boqItemsById[$id] ?? null;
                return $item ? ($item->material_unit_price + $item->labor_unit_price) * $item->quantity : 0;
            });

            $boqItemNames = $boqItemIds->map(fn ($id) => $boqItemsById[$id]?->item_description)->filter()->values();

            // Committed = all PO spend for this MR minus this PO's own amount
            $committedForMr = (float) ($committedByMrId[$mrId] ?? 0);
            $committedExcludingThis = max(0, $committedForMr - (float) $po->total_amount);

            $data = $po->toArray();
            $data['budget_context'] = [
                'boq_budget'      => $boqBudget,
                'boq_item_names'  => $boqItemNames,
                'committed_spend' => $committedExcludingThis,
                'this_po_amount'  => (float) $po->total_amount,
                'remaining_after' => $boqBudget - $committedExcludingThis - (float) $po->total_amount,
                'has_boq_link'    => $boqItemIds->isNotEmpty(),
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
