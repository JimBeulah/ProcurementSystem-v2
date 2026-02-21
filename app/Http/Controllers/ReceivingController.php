<?php

namespace App\Http\Controllers;

use App\Models\ReceivingReport;
use App\Models\ReceivingItem;
use App\Models\PurchaseOrder;
use App\Models\InventoryItem;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReceivingController extends Controller
{
    public function index()
    {
        $reports = ReceivingReport::with(['purchaseOrder.supplier', 'items'])
            ->orderBy('received_date', 'desc')
            ->get();

        return Inertia::render('Inventory/Receiving/Index', ['reports' => $reports]);
    }

    public function create(Request $request)
    {
        $poId = $request->query('poId');

        $purchaseOrders = PurchaseOrder::with(['supplier', 'items'])
            ->whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED'])
            ->get();

        return Inertia::render('Inventory/Receiving/Create', [
            'purchaseOrders' => $purchaseOrders,
            'selectedPoId' => $poId ? (int) $poId : null,
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

        $po = PurchaseOrder::with('items')->findOrFail($validated['purchase_order_id']);

        $report = ReceivingReport::create([
            'purchase_order_id' => $po->id,
            'received_by_id' => auth()->id(),
            'received_date' => now(),
            'delivery_note_no' => $validated['delivery_note_no'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        // We assume there's one main warehouse, or create a default one
        $warehouse = Warehouse::firstOrCreate(
            ['name' => 'Main Warehouse'],
            ['location' => 'HQ', 'type' => 'CENTRAL']
        );

        foreach ($validated['items'] as $itemData) {
            // 1. Log the receipt item
            ReceivingItem::create([
                'receiving_report_id' => $report->id,
                'material_name' => $itemData['material_name'],
                'quantity_received' => $itemData['quantity_received'],
                'status' => 'ACCEPTED',
            ]);

            // Find the original PO Item to know the unit
            $poItem = collect($po->items)->firstWhere('id', $itemData['id']);

            // 2. Increment Inventory
            $inventoryItem = InventoryItem::firstOrCreate(
                [
                    'material_name' => $itemData['material_name'],
                    'project_id' => $po->project_id,
                    'warehouse_id' => $warehouse->id,
                ],
                [
                    'quantity' => 0,
                    'unit' => $poItem ? $poItem->unit : 'unit',
                ]
            );

            $inventoryItem->increment('quantity', $itemData['quantity_received']);
        }

        // 3. Mark PO as COMPLETED
        $po->update(['status' => 'COMPLETED']);

        return redirect()->route('receiving.index')->with('success', 'Goods received and inventory updated successfully.');
    }
}
