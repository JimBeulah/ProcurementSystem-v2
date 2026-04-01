<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConfirmReceiptRequest;
use App\Models\InventoryItem;
use App\Models\SiteRelease;
use App\Services\SiteReleaseService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SiteReleaseController extends Controller
{
    public function __construct(
        protected SiteReleaseService $service
    ) {}

    public function index(): Response
    {
        // Restrict access to Warehouse and Admin only as requested
        if (!auth()->user()->hasRole(['admin', 'warehouse'])) {
            return Inertia::render('Errors/403', [
                'message' => 'Only Warehouse Officers and Admins can access the Dispatch Queue.'
            ]);
        }

        // Show ONLY pending dispatches from the warehouse
        $pendingReleases = SiteRelease::with(['inventoryItem.warehouse', 'project', 'releasedBy'])
            ->where('status', SiteRelease::STATUS_PENDING)
            ->orderBy('created_at', 'asc')
            ->get();

        // Historical releases for reference
        $recentReleases = SiteRelease::with(['inventoryItem', 'project', 'releasedBy', 'receivedBy'])
            ->where('status', '!=', SiteRelease::STATUS_PENDING)
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('SiteRelease/Index', [
            'pendingReleases' => $pendingReleases,
            'recentReleases' => $recentReleases,
        ]);
    }

    public function dispatch(SiteRelease $siteRelease): RedirectResponse
    {
        if ($siteRelease->status !== SiteRelease::STATUS_PENDING) {
            return redirect()->back()->with('error', 'This item is not pending dispatch.');
        }

        $this->service->dispatch($siteRelease, auth()->id());

        return redirect()->back()->with(
            'success',
            "Item dispatched successfully. It is now In Transit to {$siteRelease->project->name}."
        );
    }

    public function store(\App\Http\Requests\StoreSiteReleaseRequest $request): RedirectResponse
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

    public function confirmReceipt(ConfirmReceiptRequest $request, SiteRelease $siteRelease): RedirectResponse
    {
        if ($siteRelease->status === 'RECEIVED') {
            return redirect()->back()->with('error', 'This release has already been confirmed.');
        }

        $siteRelease->load('inventoryItem');

        $this->service->confirmReceipt($siteRelease, $request->validated());

        return redirect()->back()->with(
            'success',
            "Receipt confirmed: {$request->validated()['quantity_received']} {$siteRelease->unit} received."
        );
    }
}
