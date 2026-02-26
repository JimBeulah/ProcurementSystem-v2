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
        $totalAmount = collect($validated['items'])
            ->sum(fn($i) => $i['quantity'] * $i['unit_price']);

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

        foreach ($validated['items'] as $item) {
            PurchaseOrderItem::create([
                'purchase_order_id' => $po->id,
                'material_name' => $item['material_name'],
                'description' => $item['description'] ?? null,
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['quantity'] * $item['unit_price'],
                'unit' => $item['unit'] ?? 'pcs',
            ]);
        }

        return $po;
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
