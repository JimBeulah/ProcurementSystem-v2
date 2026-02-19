<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSiteReleaseRequest;
use App\Models\InventoryItem;
use App\Models\SiteRelease;
use Inertia\Inertia;

class SiteReleaseController extends Controller
{
    public function index()
    {
        $inventory = InventoryItem::with('project')
            ->whereNotNull('project_id')
            ->where('quantity', '>', 0)
            ->orderBy('material_name', 'asc')
            ->get();

        $releases = SiteRelease::with(['inventoryItem', 'project', 'releasedBy'])
            ->orderBy('release_date', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('SiteRelease/Index', [
            'inventory' => $inventory,
            'releases' => $releases,
        ]);
    }

    public function store(StoreSiteReleaseRequest $request)
    {
        $validated = $request->validated();
        $item = InventoryItem::findOrFail($validated['inventory_item_id']);

        if ($validated['quantity_released'] > $item->quantity) {
            return redirect()->back()->with('error', 'Release quantity exceeds available stock.');
        }

        SiteRelease::create([
            'inventory_item_id' => $item->id,
            'project_id' => $item->project_id,
            'released_by_id' => auth()->id(),
            'issued_to' => $validated['issued_to'],
            'quantity_released' => $validated['quantity_released'],
            'unit' => $item->unit,
            'purpose' => $validated['purpose'] ?? null,
            'release_date' => now(),
        ]);

        $item->decrement('quantity', $validated['quantity_released']);

        return redirect()->back()->with('success', "Released {$validated['quantity_released']} {$item->unit} of {$item->material_name}.");
    }
}
