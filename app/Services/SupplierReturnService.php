<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\SupplierReturn;
use App\Models\SupplierReturnItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierReturnService
{
    /**
     * Store a new supplier return and decrement site inventory.
     * Set $skipInventory to true if items were rejected at the gate and never entered stock.
     */
    public function create(array $data, bool $skipInventory = false): SupplierReturn
    {
        return DB::transaction(function () use ($data, $skipInventory) {
            $return = SupplierReturn::create([
                'purchase_order_id' => $data['purchase_order_id'] ?? null,
                'project_id' => $data['project_id'],
                'supplier_id' => $data['supplier_id'] ?? null,
                'initiated_by_id' => Auth::id(),
                'status' => 'PENDING_APPROVAL',
                'reason' => $data['reason'],
                'remarks' => $data['remarks'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                SupplierReturnItem::create([
                    'supplier_return_id' => $return->id,
                    'purchase_order_item_id' => $item['purchase_order_item_id'] ?? $item['po_item_id'] ?? null,
                    'material_name' => $item['material_name'],
                    'unit' => $item['unit'] ?? 'unit',
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                ]);

                if (!$skipInventory) {
                    // 1. Find the exact inventory item at the site
                    $inventoryItem = InventoryItem::where('material_name', $item['material_name'])
                        ->where('project_id', $data['project_id'])
                        ->first();

                    // 2. Strict validation: cannot return what you don't have
                    if (!$inventoryItem || $inventoryItem->quantity < $item['quantity']) {
                        throw ValidationException::withMessages([
                            'items' => ["Insufficient quantity for '{$item['material_name']}' on site. Available: " . ($inventoryItem->quantity ?? 0)],
                        ]);
                    }

                    $inventoryItem->decrement('quantity', $item['quantity']);
                }
            }

            return $return;
        });
    }

    /**
     * Approve a return request.
     */
    public function approve(SupplierReturn $return): void
    {
        if ($return->status !== 'PENDING_APPROVAL') {
            throw new \DomainException('Only pending returns can be approved.');
        }

        $return->update([
            'status' => 'APPROVED',
            'approved_by_id' => Auth::id(),
        ]);
    }

    /**
     * Mark items as physically returned.
     */
    public function markAsReturned(SupplierReturn $return, array $data): void
    {
        if ($return->status !== 'APPROVED') {
            throw new \DomainException('Only approved returns can be marked as returned.');
        }

        $return->update([
            'status' => 'RETURNED',
            'return_reference' => $data['return_reference'] ?? null,
            'returned_date' => $data['returned_date'],
        ]);
    }

    /**
     * Cancel a return and restore site inventory.
     */
    public function cancel(SupplierReturn $return): void
    {
        if (in_array($return->status, ['RETURNED', 'CANCELLED'])) {
            throw new \DomainException('This return cannot be cancelled.');
        }

        DB::transaction(function () use ($return) {
            foreach ($return->items as $item) {
                $inventoryItem = InventoryItem::firstOrCreate(
                    [
                        'material_name' => $item->material_name,
                        'project_id' => $return->project_id,
                        'warehouse_id' => null,
                    ],
                    [
                        'quantity' => 0,
                        'unit' => $item->unit,
                    ]
                );

                $inventoryItem->increment('quantity', $item->quantity);
            }

            $return->update(['status' => 'CANCELLED']);
        });
    }
}
