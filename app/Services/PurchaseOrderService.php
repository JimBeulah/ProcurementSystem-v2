<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class PurchaseOrderService
{
    public function __construct(
        protected SiteReleaseService $siteReleaseService
    ) {}

    /**
     * Create a new purchase order with its line items.
     */
    public function create(array $validated, int $requesterId): ?PurchaseOrder
    {
        return DB::transaction(function () use ($validated, $requesterId) {
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
            if (! empty($warehouseItems)) {
                $this->siteReleaseService->autoReleaseWarehouseItems($warehouseItems, $validated['project_id'], $requesterId);
            }

            // 2. Create the Purchase Order ONLY for the supplier items (if any exist)
            if (empty($supplierItems)) {
                // Entire order fulfilled from warehouse! No PO needed.
                return null;
            }

            $totalAmount = collect($supplierItems)->sum(fn ($i) => $i['quantity'] * $i['unit_price']);

            $po = PurchaseOrder::create([
                'project_id' => $validated['project_id'],
                'supplier_id' => $validated['supplier_id'],
                'purchase_request_id' => $validated['purchase_request_id'] ?? null,
                'requester_id' => $requesterId,
                'order_date' => now(),
                'status' => 'PENDING',
                'remarks' => $validated['remarks'] ?? null,
                'total_amount' => $totalAmount,
            ]);

            $itemsData = collect($supplierItems)->map(function ($item) {
                // If this is sourced from a PR, update the ordered_quantity
                if (! empty($item['purchase_request_item_id'])) {
                    $prItem = \App\Models\PurchaseRequestItem::find($item['purchase_request_item_id']);
                    if ($prItem) {
                        $prItem->increment('ordered_quantity', $item['quantity']);
                    }
                }

                return [
                    'purchase_request_item_id' => $item['purchase_request_item_id'] ?? null,
                    'material_name' => $item['material_name'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                    'unit' => $item['unit'] ?? 'pcs',
                ];
            })->toArray();

            $po->items()->createMany($itemsData);

            // Update parent PR status if applicable
            if ($validated['purchase_request_id']) {
                $this->updatePurchaseRequestStatus(PurchaseRequest::find($validated['purchase_request_id']));
            }

            $approvers = User::role(['admin', 'finance'])->get();
            if ($approvers->isNotEmpty()) {
                Notification::send($approvers, new \App\Notifications\NewPurchaseOrderSubmitted($po));
            }

            return $po;
        });
    }

    /**
     * Approve a purchase order.
     */
    public function approve(PurchaseOrder $order, int $approverId): void
    {
        $order->update([
            'status' => 'APPROVED',
            'approver_id' => $approverId,
        ]);

        if ($order->requester) {
            $order->requester->notify(new \App\Notifications\PurchaseOrderApproved($order));
        }
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
     * Cancel a purchase order and return its items to the PR queue.
     */
    public function cancel(PurchaseOrder $order, string $remarks): void
    {
        DB::transaction(function () use ($order, $remarks) {
            $order->update([
                'status' => 'CANCELLED',
                'remarks' => $remarks,
            ]);

            // Return the quantities to their respective PR items
            $prToUpdate = null;
            foreach ($order->items as $poItem) {
                if ($poItem->purchase_request_item_id) {
                    $prItem = $poItem->purchaseRequestItem;
                    if ($prItem) {
                        // Make sure we don't go below 0 just in case
                        $newQty = max(0, $prItem->ordered_quantity - $poItem->quantity);
                        $prItem->update(['ordered_quantity' => $newQty]);
                        $prToUpdate = $prItem->purchase_request_id;
                    }
                }
            }

            if ($prToUpdate) {
                $this->updatePurchaseRequestStatus(PurchaseRequest::find($prToUpdate));
            }
        });
    }

    /**
     * Re-evaluate and update the parent PurchaseRequest status based on fulfillment.
     */
    private function updatePurchaseRequestStatus(PurchaseRequest $pr): void
    {
        $pr->load('items');
        $allFulfilled = true;
        $someFulfilled = false;

        foreach ($pr->items as $item) {
            if ($item->ordered_quantity < $item->quantity) {
                $allFulfilled = false;
            }
            if ($item->ordered_quantity > 0) {
                $someFulfilled = true;
            }
        }

        if ($allFulfilled) {
            $pr->update(['status' => 'COMPLETED']);
        } elseif ($someFulfilled) {
            $pr->update(['status' => 'PARTIAL']);
        } else {
            // Revert to APPROVED if everything was cancelled
            $pr->update(['status' => 'APPROVED']);
        }
    }

    /**
     * Optionally find a purchase request for pre-filling the PO create form.
     */
    public function findPurchaseRequest(?string $prId): ?PurchaseRequest
    {
        if (! $prId) {
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
            'purchaseOrder' => $order,
        ]);

        // Secure the PDF: Enforce printing only, prevent copy/paste, modification, and assembly
        $pdf->setEncryption('', config('app.key'), ['print']);

        return $pdf;
    }
}
