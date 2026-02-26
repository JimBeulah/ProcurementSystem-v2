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

        $warehouse = Warehouse::firstOrCreate(
            ['name' => 'Main Warehouse'],
            ['location' => 'HQ', 'type' => 'CENTRAL']
        );

        foreach ($validated['items'] as $itemData) {
            ReceivingItem::create([
                'receiving_report_id' => $report->id,
                'material_name' => $itemData['material_name'],
                'quantity_received' => $itemData['quantity_received'],
                'status' => 'ACCEPTED',
            ]);

            $poItem = collect($po->items)->firstWhere('id', $itemData['id']);

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

        $po->update(['status' => 'COMPLETED']);

        return $report;
    }
}
