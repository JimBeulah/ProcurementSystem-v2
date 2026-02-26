<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseOrderRequest;
use App\Models\Material;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Services\PurchaseOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(
        protected PurchaseOrderService $service
    ) {
    }

    public function index(): Response
    {
        $orders = PurchaseOrder::with(['project', 'supplier', 'requester'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Purchasing/Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function show(PurchaseOrder $order): Response
    {
        $order->load(['project', 'supplier', 'requester', 'approver', 'items']);

        return Inertia::render('Purchasing/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function create(Request $request): Response
    {
        $projects = Project::where('status', 'ACTIVE')->orderBy('name')->get();
        $suppliers = Supplier::orderBy('name')->get();
        $materials = Material::orderBy('name')->get();
        $pr = $this->service->findPurchaseRequest($request->query('prId'));

        return Inertia::render('Purchasing/Orders/Create', [
            'projects' => $projects,
            'suppliers' => $suppliers,
            'materials' => $materials,
            'rfqId' => $request->query('rfqId'),
            'quoteId' => $request->query('quoteId'),
            'purchaseRequest' => $pr,
        ]);
    }

    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        $this->service->create($request->validated());

        return redirect()->route('purchasing.orders.index')->with('success', 'Purchase order created successfully.');
    }

    public function approve(PurchaseOrder $order): RedirectResponse
    {
        $this->service->approve($order);

        return redirect()->back()->with('success', 'Purchase order approved successfully.');
    }
}
