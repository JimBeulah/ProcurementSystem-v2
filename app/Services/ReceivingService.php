<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\PurchaseOrder;
use App\Models\ReceivingItem;
use App\Models\ReceivingReport;
use App\Models\Warehouse;
use Illuminate\Support\Facades\Auth;

class ReceivingService
{
    /**
     * Process a goods receipt: create report, log received items, and update inventory.
     */
    public function receive(array $validated): ReceivingReport
    {
        $po = PurchaseOrder::with('items')->findOrFail($validated['purchase_order_id']);

        $report = ReceivingReport::create([
            'purchase_order_id' => $po->id,
            'received_by_id' => Auth::id(),
            'received_date' => now(),
            'delivery_note_no' => $validated['delivery_note_no'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);


        $rejectedItems = [];

        foreach ($validated['items'] as $itemData) {
            $isRejected = ($itemData['status'] ?? 'ACCEPTED') === 'REJECTED';

            ReceivingItem::create([
                'receiving_report_id' => $report->id,
                'material_name' => $itemData['material_name'],
                'quantity_received' => $itemData['quantity_received'],
                'status' => $itemData['status'] ?? 'ACCEPTED',
            ]);

            // Only increment inventory if NOT rejected
            if (!$isRejected) {
                $poItem = collect($po->items)->firstWhere('id', $itemData['id']);

                $inventoryItem = InventoryItem::firstOrCreate(
                    [
                        'material_name' => $itemData['material_name'],
                        'project_id' => $po->project_id,
                        'warehouse_id' => null,
                    ],
                    [
                        'quantity' => 0,
                        'unit' => $poItem ? $poItem->unit : 'unit',
                    ]
                );

                $inventoryItem->increment('quantity', $itemData['quantity_received']);
            } else {
                // Collect for automatic Supplier Return creation
                $poItem = collect($po->items)->firstWhere('id', $itemData['id']);
                $rejectedItems[] = [
                    'po_item_id' => $itemData['id'],
                    'material_name' => $itemData['material_name'],
                    'unit' => $poItem ? $poItem->unit : 'unit',
                    'quantity' => $itemData['quantity_received'],
                    'unit_price' => $poItem ? $poItem->unit_price : 0,
                    'notes' => 'Rejected during manual GRN entry.'
                ];
            }
        }

        // Automatically create a Supplier Return request for rejected items
        if (!empty($rejectedItems)) {
            app(SupplierReturnService::class)->create([
                'purchase_order_id' => $po->id,
                'project_id' => $po->project_id,
                'supplier_id' => $po->supplier_id,
                'reason' => 'Items rejected during manual receiving.',
                'remarks' => $validated['notes'] ?? null,
                'items' => $rejectedItems
            ], true); // skipInventory = true because they never entered stock
        }

        $po->update(['status' => 'COMPLETED']);

        return $report;
    }


    /**
     * Automatically receive the full requested quantity for a Purchase Order (Direct-to-site).
     */
    public function autoReceiveFullOrder(PurchaseOrder $po, array $quantities = [], ?string $notes = null, array $rejections = []): ReceivingReport
    {
        if (empty($notes)) {
            $notes = empty($quantities)
                ? 'Auto-received full quantity by Site Engineer.'
                : 'Received with actual quantities by Site Engineer.';
        }

        $report = ReceivingReport::create([
            'purchase_order_id' => $po->id,
            'received_by_id' => Auth::id(),
            'received_date' => now(),
            'notes' => $notes,
        ]);

        $rejectedItems = [];

        foreach ($po->items as $poItem) {
            $isRejected = isset($rejections[$poItem->id]) && $rejections[$poItem->id] === true;

            // Use engineer-entered qty if provided, otherwise fall back to ordered qty
            $receivedQty = isset($quantities[$poItem->id]) && is_numeric($quantities[$poItem->id])
                ? (float) $quantities[$poItem->id]
                : (float) $poItem->quantity;

            ReceivingItem::create([
                'receiving_report_id' => $report->id,
                'material_name' => $poItem->material_name,
                'quantity_received' => $receivedQty,
                'status' => $isRejected ? 'REJECTED' : 'GOOD',
            ]);

            // Only increment inventory if NOT rejected
            if (!$isRejected) {
                $inventoryItem = InventoryItem::firstOrCreate(
                    [
                        'material_name' => $poItem->material_name,
                        'project_id' => $po->project_id,
                        'warehouse_id' => null,
                    ],
                    [
                        'quantity' => 0,
                        'unit' => $poItem->unit,
                    ]
                );

                $inventoryItem->increment('quantity', $receivedQty);
            } else {
                // Collect for automatic Supplier Return creation
                $rejectedItems[] = [
                    'po_item_id' => $poItem->id,
                    'material_name' => $poItem->material_name,
                    'unit' => $poItem->unit,
                    'quantity' => $receivedQty,
                    'unit_price' => $poItem->unit_price,
                    'notes' => 'Rejected at gate during delivery receipt.'
                ];
            }
        }

        // Automatically create a Supplier Return request for rejected items
        if (!empty($rejectedItems)) {
            app(SupplierReturnService::class)->create([
                'purchase_order_id' => $po->id,
                'project_id' => $po->project_id,
                'supplier_id' => $po->supplier_id,
                'reason' => 'Items rejected during delivery confirmation.',
                'remarks' => $notes,
                'items' => $rejectedItems
            ], true); // skipInventory = true because they never entered stock
        }

        $po->update(['status' => 'COMPLETED']);

        return $report;
    }
}
