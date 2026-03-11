<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\SiteRelease;
use Illuminate\Support\Facades\Auth;

class SiteReleaseService
{
    /**
     * Issue items from inventory to the site.
     */
    public function release(InventoryItem $item, array $validated): SiteRelease
    {
        $release = SiteRelease::create([
            'inventory_item_id' => $item->id,
            'project_id' => $item->project_id,
            'released_by_id' => Auth::id(),
            'issued_to' => $validated['issued_to'],
            'quantity_released' => $validated['quantity_released'],
            'unit' => $item->unit,
            'purpose' => $validated['purpose'] ?? null,
            'release_date' => now(),
            'status' => 'IN_TRANSIT',
        ]);

        $item->decrement('quantity', $validated['quantity_released']);

        return $release;
    }

    /**
     * Confirm receipt of a released batch and merge received quantity into the
     * project site's inventory so the material is available for issuance to workers.
     */
    public function confirmReceipt(SiteRelease $siteRelease, array $validated): void
    {
        $qtyReceived = (float) $validated['quantity_received'];

        $siteRelease->update([
            'status' => 'RECEIVED',
            'received_by_id' => Auth::id(),
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
                    'project_id'    => $siteRelease->project_id,
                    'warehouse_id'  => null,
                ],
                [
                    'quantity' => 0,
                    'unit'     => $sourceItem->unit,
                ]
            );

            $siteInventory->increment('quantity', $qtyReceived);
        }
    }
}
