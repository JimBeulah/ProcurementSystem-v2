<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseRequest;
use Illuminate\Support\Facades\Auth;

class PurchaseOrderService
{
    /**
     * Create a new purchase order with its line items.
     */
    public function create(array $validated): PurchaseOrder
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            // Segregate items meant for the supplier vs items sourced from the warehouse
            $supplierItems = [];
            $warehouseItems = [];

            foreach ($validated['items'] as $item) {
                if (($item['description'] ?? '') === 'Sourced from Warehouse') {
                    $warehouseItems[] = $item;
                } else {
                    $supplierItems[] = $item;
                }
            }

            // 1. Process Warehouse Items by auto-generating Site Releases
            foreach ($warehouseItems as $wItem) {
                // Find matching warehouse inventory
                $inventory = \App\Models\InventoryItem::where('material_name', $wItem['material_name'])
                    ->where('quantity', '>', 0)
                    ->whereNotNull('warehouse_id')
                    ->first();

                if ($inventory) {
                    $qtyToRelease = min($wItem['quantity'], $inventory->quantity);

                    \App\Models\SiteRelease::create([
                        'inventory_item_id' => $inventory->id,
                        'project_id' => $validated['project_id'],
                        'released_by_id' => Auth::id(),
                        'issued_to' => 'Site Engineer',
                        'quantity_released' => $qtyToRelease,
                        'unit' => $wItem['unit'] ?? 'pcs',
                        'purpose' => 'Auto-sourced during PR fulfillment',
                        'release_date' => now(),
                        'status' => 'PENDING', // PENDING so the Site Engineer can confirm receipt
                    ]);

                    // Deduct from warehouse stock
                    $inventory->decrement('quantity', $qtyToRelease);
                }
            }

            // 2. Create the Purchase Order ONLY for the supplier items (if any exist)
            if (empty($supplierItems)) {
                // Entire order fulfilled from warehouse! No PO needed.
                return null;
            }

            $totalAmount = collect($supplierItems)->sum(fn($i) => $i['quantity'] * $i['unit_price']);

            $po = PurchaseOrder::create([
                'project_id' => $validated['project_id'],
                'supplier_id' => $validated['supplier_id'],
                'purchase_request_id' => $validated['purchase_request_id'] ?? null,
                'requester_id' => Auth::id(),
                'order_date' => now(),
                'status' => 'PENDING',
                'remarks' => $validated['remarks'] ?? null,
                'total_amount' => $totalAmount,
            ]);

            $itemsData = collect($supplierItems)->map(function ($item) {
                return [
                    'material_name' => $item['material_name'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                    'unit' => $item['unit'] ?? 'pcs',
                ];
            })->toArray();
            $po->items()->createMany($itemsData);

            return $po;
        });
    }

    /**
     * Approve a purchase order.
     */
    public function approve(PurchaseOrder $order): void
    {
        $order->update([
            'status' => 'APPROVED',
            'approver_id' => Auth::id(),
        ]);
    }

    /**
     * Decline a purchase order.
     */
    public function decline(PurchaseOrder $order, ?string $remarks = null): void
    {
        $order->update([
            'status' => 'DECLINED',
            'remarks' => $remarks ?? $order->remarks,
        ]);
    }


    /**
     * Optionally find a purchase request for pre-filling the PO create form.
     */
    public function findPurchaseRequest(?string $prId): ?PurchaseRequest
    {
        if (!$prId) {
            return null;
        }

        return PurchaseRequest::with('items')->find($prId);
    }

    /**
     * Generate a PDF for the given purchase order.
     */
    public function generatePdf(PurchaseOrder $order)
    {
        // Load relationships needed for the PDF
        $order->load(['project', 'supplier', 'items']);

        // Lazy load requester and approver
        $order->loadMissing(['requester', 'approver']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('print.purchase-order', [
            'purchaseOrder' => $order
        ]);

        // Secure the PDF: Enforce printing only, prevent copy/paste, modification, and assembly
        $pdf->setEncryption('', config('app.key'), ['print']);

        return $pdf;
    }
}
