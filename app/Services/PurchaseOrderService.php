<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\SiteRelease;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
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

            // Calculate total amount ONLY for supplier items
            $totalAmount = 0;
            foreach ($supplierItems as $item) {
                $totalAmount += $item['quantity'] * ($item['unit_price'] ?? 0);
            }

            // 1. Create the Purchase Order (the Fulfillment Plan)
            // This is ALWAYS created so the manager can approve the sourcing.
            $po = PurchaseOrder::create([
                'project_id' => $validated['project_id'],
                'purchase_request_id' => $validated['purchase_request_id'] ?? null,
                'supplier_id' => $validated['supplier_id'] ?? null, // Null for internal warehouse-only orders
                'requester_id' => $requesterId,
                'status' => 'PENDING',
                'remarks' => $validated['remarks'] ?? null,
                'total_amount' => $totalAmount,
            ]);

            // 2. Process Warehouse Items by auto-generating Site Releases
            if (! empty($warehouseItems)) {
                // Link the warehouse releases to the new PO for approval sync
                $this->siteReleaseService->autoReleaseWarehouseItems($warehouseItems, $validated['project_id'], $requesterId, $po->id);

                // Update ordered_quantity for items sourced from a PR
                foreach ($warehouseItems as $item) {
                    if (! empty($item['purchase_request_item_id'])) {
                        $prItem = PurchaseRequestItem::find($item['purchase_request_item_id']);
                        if ($prItem instanceof PurchaseRequestItem) {
                            $prItem->increment('ordered_quantity', $item['quantity']);
                        }
                    }
                }
            }

            // 3. Create PO Items for Supplier items
            foreach ($supplierItems as $item) {
                // Update ordered_quantity for items sourced from a PR
                if (! empty($item['purchase_request_item_id'])) {
                    $prItem = PurchaseRequestItem::find($item['purchase_request_item_id']);
                    if ($prItem instanceof PurchaseRequestItem) {
                        $prItem->increment('ordered_quantity', $item['quantity']);
                    }
                }

                $po->items()->create([
                    'purchase_request_item_id' => $item['purchase_request_item_id'] ?? null,
                    'material_name' => $item['material_name'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit' => $item['unit'] ?? 'pcs',
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            // 4. Update parent PR status
            if (! empty($validated['purchase_request_id'])) {
                $pr = PurchaseRequest::find($validated['purchase_request_id']);
                if ($pr instanceof PurchaseRequest) {
                    $this->updatePurchaseRequestStatus($pr);
                }
            }

            // 5. Notify approvers
            $approvers = User::role(['admin', 'finance'])->get();
            if ($approvers->isNotEmpty()) {
                Notification::send($approvers, new \App\Notifications\NewPurchaseOrderSubmitted($po));
            }

            return $po->load(['items', 'project', 'supplier']);
        });
    }

    /**
     * Approve a purchase order.
     */
    public function approve(PurchaseOrder $order, int $approverId): void
    {
        // Fix #5: Status Regression Guard
        if ($order->status !== 'PENDING') {
            throw new \Exception("Only PENDING orders can be approved. Current status: {$order->status}.");
        }

        // Fix #1: Four-eyes principle (PM restricted, Admin allowed)
        if (Auth::user()->hasRole('project_manager') && $order->requester_id === $approverId) {
            throw new \Exception('Project Managers cannot approve their own purchase orders. Please ask another manager or an admin.');
        }

        $order->update([
            'status' => 'APPROVED',
            'approver_id' => $approverId,
        ]);

        // Release associated warehouse items from "Awaiting Approval"
        SiteRelease::where('purchase_order_id', $order->id)
            ->where('status', SiteRelease::STATUS_AWAITING_APPROVAL)
            ->update(['status' => SiteRelease::STATUS_PENDING]);

        // Notify Warehouse users about the pending releases
        $warehouseUsers = User::role(['admin', 'warehouse'])->get();
        $pendingReleases = SiteRelease::where('purchase_order_id', $order->id)
            ->where('status', SiteRelease::STATUS_PENDING)
            ->get();

        foreach ($pendingReleases as $release) {
            Notification::send($warehouseUsers, new \App\Notifications\NewSiteReleasePending($release));
        }

        if ($order->requester) {
            $order->requester->notify(new \App\Notifications\PurchaseOrderApproved($order));
        }
    }

    /**
     * Decline a purchase order.
     */
    public function decline(PurchaseOrder $order, ?string $remarks = null): void
    {
        // Fix #5: Status Regression Guard
        if ($order->status !== 'PENDING') {
            throw new \Exception("Only PENDING orders can be declined. Current status: {$order->status}.");
        }

        DB::transaction(function () use ($order, $remarks) {
            $order->update([
                'status' => 'DECLINED',
                'remarks' => $remarks ?? $order->remarks,
            ]);

            // 1. Rollback Supplier Items
            foreach ($order->items as $poItem) {
                if ($poItem->purchase_request_item_id) {
                    $prItem = $poItem->purchaseRequestItem;
                    if ($prItem instanceof PurchaseRequestItem) {
                        $newQty = max(0, (float) $prItem->ordered_quantity - (float) $poItem->quantity);
                        $prItem->update(['ordered_quantity' => $newQty]);
                    }
                }
            }

            // 2. Rollback Warehouse Items
            $warehouseReleases = SiteRelease::where('purchase_order_id', $order->id)->get();
            /** @var SiteRelease $release */
            foreach ($warehouseReleases as $release) {
                if ($release->status === SiteRelease::STATUS_AWAITING_APPROVAL) {
                    // Return stock to inventory
                    if ($release->inventoryItem) {
                        $release->inventoryItem->increment('quantity', (float) $release->quantity_released);
                    }

                    // Return quantity to PR item
                    if ($release->purchase_request_item_id) {
                        $prItem = $release->purchaseRequestItem;
                        if ($prItem instanceof PurchaseRequestItem) {
                            $newQty = max(0, $prItem->ordered_quantity - $release->quantity_released);
                            $prItem->update(['ordered_quantity' => $newQty]);
                        }
                    }

                    $release->update(['status' => SiteRelease::STATUS_CANCELLED]);
                }
            }

            // 3. Update PR status
            if ($order->purchase_request_id) {
                $pr = PurchaseRequest::find($order->purchase_request_id);
                if ($pr instanceof PurchaseRequest) {
                    $this->updatePurchaseRequestStatus($pr);
                }
            }
        });
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

            $prToUpdate = $order->purchase_request_id;

            // 1. Rollback Supplier Items
            foreach ($order->items as $poItem) {
                if ($poItem->purchase_request_item_id) {
                    $prItem = $poItem->purchaseRequestItem;
                    if ($prItem instanceof PurchaseRequestItem) {
                        $newQty = max(0, (float) $prItem->ordered_quantity - (float) $poItem->quantity);
                        $prItem->update(['ordered_quantity' => $newQty]);
                    }
                }
            }

            // 2. Rollback Warehouse Items
            $warehouseReleases = SiteRelease::where('purchase_order_id', $order->id)->get();
            /** @var SiteRelease $release */
            foreach ($warehouseReleases as $release) {
                // Return stock to inventory
                if ($release->inventoryItem) {
                    $release->inventoryItem->increment('quantity', (float) $release->quantity_released);
                }

                // Return quantity to PR item
                if ($release->purchase_request_item_id) {
                    $prItem = $release->purchaseRequestItem;
                    if ($prItem instanceof PurchaseRequestItem) {
                        $newQty = max(0, (float) $prItem->ordered_quantity - (float) $release->quantity_released);
                        $prItem->update(['ordered_quantity' => $newQty]);
                    }
                }

                $release->update(['status' => SiteRelease::STATUS_CANCELLED]);
            }

            // 3. Update PR status
            if ($prToUpdate) {
                $pr = PurchaseRequest::find($prToUpdate);
                if ($pr instanceof PurchaseRequest) {
                    $this->updatePurchaseRequestStatus($pr);
                }
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
        $order->load(['project', 'supplier', 'items.purchaseRequestItem']);

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
