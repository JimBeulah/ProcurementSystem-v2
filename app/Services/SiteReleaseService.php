<?php

namespace App\Services;

use App\Enums\SiteReleaseStatus;
use App\Models\InventoryItem;
use App\Models\SiteRelease;
use Illuminate\Support\Facades\Auth;

class SiteReleaseService
{
    /**
     * Issue items from inventory to the site.
     */
    public function release(InventoryItem $item, array $validated, ?int $userId = null): SiteRelease
    {
        $userId = $userId ?? Auth::id();

        $release = SiteRelease::create([
            'inventory_item_id' => $item->id,
            'project_id' => $item->project_id,
            'released_by_id' => $userId,
            'issued_to' => $validated['issued_to'],
            'quantity_released' => $validated['quantity_released'],
            'unit' => $item->unit,
            'purpose' => $validated['purpose'] ?? null,
            'release_date' => now(),
            'status' => SiteReleaseStatus::RECEIVED, // If issued to workers, it's immediately "received" by them
        ]);

        $item->decrement('quantity', $validated['quantity_released']);

        return $release;
    }

    /**
     * Confirm receipt of a released batch and merge received quantity into the
     * project site's inventory so the material is available for issuance to workers.
     */
    public function confirmReceipt(SiteRelease $siteRelease, array $validated, ?int $userId = null): void
    {
        $qtyReceived = (float) $validated['quantity_received'];
        $userId = $userId ?? Auth::id();

        $siteRelease->update([
            'status' => SiteReleaseStatus::RECEIVED,
            'received_by_id' => $userId,
            'received_date' => now(),
            'quantity_received' => $qtyReceived,
            'receipt_remarks' => $validated['receipt_remarks'] ?? null,
        ]);

        // Add received quantity to the project's site inventory so it is
        // available for further issuance on the Site Release page.
        $sourceItem = $siteRelease->inventoryItem;

        if ($siteRelease->project_id && $sourceItem) {
            $siteInventory = InventoryItem::firstOrCreate(
                [
                    'material_name' => $sourceItem->material_name,
                    'project_id' => $siteRelease->project_id,
                    'warehouse_id' => null,
                ],
                [
                    'quantity' => 0,
                    'unit' => $sourceItem->unit,
                ]
            );

            $siteInventory->increment('quantity', $qtyReceived);
        }
    }

    /**
     * Auto-release items from warehouse inventory directly to a project site.
     * Used when fulfilling PRs directly from warehouse stock.
     */
    public function autoReleaseWarehouseItems(array $warehouseItems, int $projectId, int $requesterId, ?int $purchaseOrderId = null): void
    {
        foreach ($warehouseItems as $wItem) {
            // Find matching warehouse inventory (stock not yet assigned to any project)
            $inventory = InventoryItem::where('material_name', $wItem['material_name'])
                ->where('quantity', '>', 0)
                ->whereNull('project_id')
                ->first();

            if ($inventory) {
                // Determine how much to release (limited by stock)
                $qtyToRelease = min($wItem['quantity'], $inventory->quantity);

                SiteRelease::create([
                    'inventory_item_id' => $inventory->id,
                    'purchase_order_id' => $purchaseOrderId,
                    'purchase_request_item_id' => $wItem['purchase_request_item_id'] ?? null,
                    'project_id' => $projectId,
                    'released_by_id' => $requesterId, // Initial requestor/preparer
                    'issued_to' => 'Site Engineer',
                    'quantity_released' => $qtyToRelease,
                    'unit' => $wItem['unit'] ?? 'pcs',
                    'purpose' => 'Auto-sourced from warehouse stock',
                    'release_date' => now(),
                    'status' => SiteReleaseStatus::AWAITING_APPROVAL, // Wait for manager approval
                ]);

                // Deduct from warehouse stock immediately to reserve it
                $inventory->decrement('quantity', $qtyToRelease);
            }
        }
    }

    /**
     * Manually dispatch a pending warehouse release.
     */
    public function dispatch(SiteRelease $siteRelease, int $userId): void
    {
        $siteRelease->update([
            'status' => SiteReleaseStatus::IN_TRANSIT,
            'released_by_id' => $userId, // The officer who dispatched it
            'release_date' => now(),
        ]);
    }
}
