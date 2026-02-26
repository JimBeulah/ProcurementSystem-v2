<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReceivingRequest;
use App\Models\InventoryItem;
use App\Models\PurchaseOrder;
use App\Services\ReceivingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceivingController extends Controller
{
    public function __construct(
        protected ReceivingService $service
    ) {
    }

    public function index(): Response
    {
        $reports = \App\Models\ReceivingReport::with(['purchaseOrder.supplier', 'items'])
            ->orderBy('received_date', 'desc')
            ->get();

        return Inertia::render('Inventory/Receiving/Index', ['reports' => $reports]);
    }

    public function create(Request $request): Response
    {
        $purchaseOrders = PurchaseOrder::with(['supplier', 'items'])
            ->whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED'])
            ->get();

        return Inertia::render('Inventory/Receiving/Create', [
            'purchaseOrders' => $purchaseOrders,
            'selectedPoId' => $request->query('poId') ? (int) $request->query('poId') : null,
        ]);
    }

    public function store(StoreReceivingRequest $request): RedirectResponse
    {
        $this->service->receive($request->validated());

        return redirect()->route('receiving.index')
            ->with('success', 'Goods received and inventory updated successfully.');
    }
}
