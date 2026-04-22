<?php

namespace App\Http\Controllers;

use App\Models\MaterialRequest;
use App\Models\PurchaseOrder;
use Inertia\Inertia;

class ApprovalController extends Controller
{
    public function index()
    {
        $pendingPos = PurchaseOrder::with(['project', 'requester', 'items.purchaseRequestItem'])
            ->where('status', 'PENDING')
            ->orderBy('created_at', 'asc')
            ->get();

        $warehouseStock = \App\Models\InventoryItem::whereNull('project_id')
            ->select('material_name', \Illuminate\Support\Facades\DB::raw('SUM(quantity) as total_quantity'))
            ->groupBy('material_name')
            ->pluck('total_quantity', 'material_name');

        $pendingMrs = MaterialRequest::with(['project', 'requester', 'items'])
            ->where('status', 'PENDING')
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
