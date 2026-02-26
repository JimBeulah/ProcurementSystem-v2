<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\PurchaseOrder;
use App\Services\ReceivingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReceivingController extends Controller
{
    public function __construct(
        protected ReceivingService $service
    ) {
    }

    public function index()
    {
        $reports = \App\Models\ReceivingReport::with(['purchaseOrder.supplier', 'items'])
            ->orderBy('received_date', 'desc')
            ->get();

        return Inertia::render('Inventory/Receiving/Index', ['reports' => $reports]);
    }

    public function create(Request $request)
    {
        $purchaseOrders = PurchaseOrder::with(['supplier', 'items'])
            ->whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED'])
            ->get();

        return Inertia::render('Inventory/Receiving/Create', [
            'purchaseOrders' => $purchaseOrders,
            'selectedPoId' => $request->query('poId') ? (int) $request->query('poId') : null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'delivery_note_no' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:purchase_order_items,id',
            'items.*.material_name' => 'required|string|max:255',
            'items.*.quantity_received' => 'required|numeric|min:0.01',
        ]);

        $this->service->receive($validated);

        return redirect()->route('receiving.index')
            ->with('success', 'Goods received and inventory updated successfully.');
    }
}
