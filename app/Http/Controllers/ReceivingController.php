<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReceivingRequest;
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
    ) {}

    public function index(): Response
    {
        $query = \App\Models\ReceivingReport::with(['purchaseOrder.supplier', 'purchaseOrder.project', 'items'])
            ->orderBy('received_date', 'desc');

        if (auth()->user()->hasRole('site_engineer')) {
            $projectIds = \App\Models\Project::where('site_engineer_id', auth()->id())->pluck('id');
            $query->whereHas('purchaseOrder', function ($q) use ($projectIds) {
                $q->whereIn('project_id', $projectIds);
            });
        }

        $reports = $query->get();

        return Inertia::render('Inventory/Receiving/Index', ['reports' => $reports]);
    }

    public function create(Request $request): Response
    {
        $query = PurchaseOrder::with(['supplier', 'items'])
            ->whereIn('status', [PurchaseOrder::STATUS_APPROVED, PurchaseOrder::STATUS_PARTIALLY_DELIVERED]);

        if (auth()->user()->hasRole('site_engineer')) {
            $projectIds = \App\Models\Project::where('site_engineer_id', auth()->id())->pluck('id');
            $query->whereIn('project_id', $projectIds);
        }

        $purchaseOrders = $query->get();

        return Inertia::render('Inventory/Receiving/Create', [
            'purchaseOrders' => $purchaseOrders,
            'selectedPoId' => $request->query('poId') ? (int) $request->query('poId') : null,
        ]);
    }

    public function store(StoreReceivingRequest $request): RedirectResponse
    {
        try {
            $this->service->receive($request->validated());

            return redirect()->route('receiving.index')
                ->with('success', 'Goods received and inventory updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function autoReceive(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        try {
            if ($purchaseOrder->status !== PurchaseOrder::STATUS_APPROVED && $purchaseOrder->status !== PurchaseOrder::STATUS_PARTIALLY_DELIVERED) {
                return redirect()->back()->with('error', 'Only approved or partially delivered POs can be received.');
            }

            $quantities = $request->input('quantities', []);
            $rejections = $request->input('rejections', []);
            $notes = $request->input('receipt_remarks');

            $this->service->autoReceiveFullOrder($purchaseOrder, $quantities, $notes, $rejections);

            return redirect()->back()->with('success', 'Delivery for PO-'.str_pad($purchaseOrder->id, 4, '0', STR_PAD_LEFT).' has been recorded.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
