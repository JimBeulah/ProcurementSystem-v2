<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\SiteRelease;
use App\Services\SiteReleaseService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiteReleaseController extends Controller
{
    public function __construct(
        protected SiteReleaseService $service
    ) {
    }

    public function index()
    {
        $inventoryQuery = InventoryItem::with('project')
            ->whereNotNull('project_id')
            ->where('quantity', '>', 0)
            ->orderBy('material_name', 'asc');

        if (auth()->user()->hasRole('site_engineer')) {
            $inventoryQuery->whereHas('project', function ($q) {
                $q->where('site_engineer_id', auth()->id());
            });
        }
        $inventory = $inventoryQuery->get();

        $releasesQuery = SiteRelease::with(['inventoryItem', 'project', 'releasedBy', 'receivedBy'])
            ->orderBy('release_date', 'desc')
            ->limit(50);

        if (auth()->user()->hasRole('site_engineer')) {
            $releasesQuery->whereHas('project', function ($q) {
                $q->where('site_engineer_id', auth()->id());
            });
        }
        $releases = $releasesQuery->get();

        return Inertia::render('SiteRelease/Index', [
            'inventory' => $inventory,
            'releases' => $releases,
        ]);
    }

    public function store(\App\Http\Requests\StoreSiteReleaseRequest $request)
    {
        $validated = $request->validated();
        $item = InventoryItem::findOrFail($validated['inventory_item_id']);

        if ($validated['quantity_released'] > $item->quantity) {
            return redirect()->back()->with('error', 'Release quantity exceeds available stock.');
        }

        $release = $this->service->release($item, $validated);

        return redirect()->back()->with(
            'success',
            "Released {$release->quantity_released} {$item->unit} of {$item->material_name}."
        );
    }

    public function confirmReceipt(Request $request, SiteRelease $siteRelease)
    {
        if ($siteRelease->status === 'RECEIVED') {
            return redirect()->back()->with('error', 'This release has already been confirmed.');
        }

        $validated = $request->validate([
            'quantity_received' => 'required|numeric|min:0|max:' . $siteRelease->quantity_released,
            'receipt_remarks' => 'nullable|string|max:500',
        ]);

        $this->service->confirmReceipt($siteRelease, $validated);

        return redirect()->back()->with(
            'success',
            "Receipt confirmed: {$validated['quantity_received']} {$siteRelease->unit} received."
        );
    }
}
