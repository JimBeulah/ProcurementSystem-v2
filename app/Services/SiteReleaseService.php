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
     * Confirm receipt of a released batch.
     */
    public function confirmReceipt(SiteRelease $siteRelease, array $validated): void
    {
        $siteRelease->update([
            'status' => 'RECEIVED',
            'received_by_id' => Auth::id(),
            'received_date' => now(),
            'quantity_received' => $validated['quantity_received'],
            'receipt_remarks' => $validated['receipt_remarks'] ?? null,
        ]);
    }
}
