<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\PurchaseOrder;
use App\Models\Project;
use App\Models\Supplier;
use App\Services\PurchaseOrderService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function __construct(
        protected PurchaseOrderService $service
    ) {
    }

    public function index()
    {
        $orders = PurchaseOrder::with(['project', 'supplier', 'requester'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Purchasing/Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function show(PurchaseOrder $order)
    {
        $order->load(['project', 'supplier', 'requester', 'approver', 'items']);

        return Inertia::render('Purchasing/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function create(Request $request)
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_request_id' => 'nullable|exists:purchase_requests,id',
            'remarks' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.material_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.unit' => 'nullable|string|max:50',
        ]);

        $this->service->create($validated);

        return redirect()->route('purchasing.orders.index')->with('success', 'Purchase order created successfully.');
    }

    public function approve(PurchaseOrder $order)
    {
        $this->service->approve($order);

        return redirect()->back()->with('success', 'Purchase order approved successfully.');
    }
}
