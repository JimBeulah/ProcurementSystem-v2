<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\PurchaseRequest;

class InventoryMatchingService
{
    /**
     * Find available warehouse inventory that matches the requested items in a PR.
     */
    public function matchForPurchaseRequest(?PurchaseRequest $pr): array
    {
        $inventoryMatches = [];

        if (! $pr || ! $pr->items) {
            return $inventoryMatches;
        }

        foreach ($pr->items as $item) {
            $matches = InventoryItem::where('quantity', '>', 0)
                ->whereNull('project_id') // Ensure it's warehouse stock, not project stock
                ->where('material_name', '=', $item->item_description)
                ->get(['id', 'material_name', 'quantity', 'unit', 'project_id'])
                ->toArray();

            if (count($matches) > 0) {
                $inventoryMatches[$item->item_description] = [
                    'requested_qty' => (float) $item->quantity,
                    'unit' => $item->unit,
                    'stock' => $matches,
                ];
            }
        }

        return $inventoryMatches;
    }
}
