<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseOrderRequest;
use App\Models\Material;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Services\PurchaseOrderService;
use App\Services\InventoryMatchingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(
        protected PurchaseOrderService $service,
        protected InventoryMatchingService $inventoryMatching
    ) {}

    public function index(Request $request): Response
    {
        $orders = PurchaseOrder::with(['project', 'supplier', 'requester', 'approver', 'items'])
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $pr = $this->service->findPurchaseRequest($request->query('prId'));

        // Handle pre-filling from a Supplier Return
        $supplierReturn = null;
        if ($request->query('returnId')) {
            $supplierReturn = \App\Models\SupplierReturn::with(['project', 'items', 'supplier'])
                ->find($request->query('returnId'));
        }

        $inventoryMatches = $this->inventoryMatching->matchForPurchaseRequest($pr);

        return Inertia::render('Purchasing/Orders/Index', [
            'orders' => $orders,
            'projects' => Inertia::lazy(fn () => Project::where('status', 'ACTIVE')->orderBy('name')->get()),
            'suppliers' => Inertia::lazy(fn () => Supplier::orderBy('name')->get()),
            'materials' => Inertia::lazy(fn () => Material::orderBy('name')->get()),
            'purchaseRequest' => $pr,
            'supplierReturn' => $supplierReturn,
            'inventoryMatches' => $inventoryMatches,
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

        // Handle pre-filling from a Supplier Return
        $supplierReturn = null;
        if ($request->query('returnId')) {
            $supplierReturn = \App\Models\SupplierReturn::with(['project', 'items', 'supplier'])
                ->find($request->query('returnId'));
        }

        $inventoryMatches = $this->inventoryMatching->matchForPurchaseRequest($pr);

        return Inertia::render('Purchasing/Orders/Create', [
            'projects' => $projects,
            'suppliers' => $suppliers,
            'materials' => $materials,
            'purchaseRequest' => $pr,
            'supplierReturn' => $supplierReturn,
            'inventoryMatches' => $inventoryMatches,
        ]);
    }

    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        $po = $this->service->create($request->validated(), \Illuminate\Support\Facades\Auth::id());

        if (!$po) {
            // Means 100% of the requested items were sourced from the internal warehouse
            return redirect()->route('purchasing.orders.index')
                ->with('success', 'Order fully fulfilled from warehouse stock. Site Releases have been auto-generated for the project site.');
        }

        return redirect()->route('purchasing.orders.index')->with('success', 'Purchase order created successfully.');
    }

    public function approve(PurchaseOrder $order): RedirectResponse
    {
        $this->service->approve($order, \Illuminate\Support\Facades\Auth::id());

        return redirect()->back()->with('success', 'Purchase order approved successfully.');
    }

    public function decline(Request $request, PurchaseOrder $order): RedirectResponse
    {
        $this->service->decline($order, $request->input('remarks'));

        return redirect()->back()->with('success', 'Purchase order declined.');
    }

    public function cancel(Request $request, PurchaseOrder $order): RedirectResponse
    {
        $request->validate([
            'remarks' => 'required|string|max:500'
        ]);

        $this->service->cancel($order, $request->input('remarks'));

        return redirect()->back()->with('success', 'Purchase order cancelled successfully.');
    }

    public function print(PurchaseOrder $order)
    {
        // Delegate PDF generation to the Service layer
        $pdf = $this->service->generatePdf($order);

        return $pdf->stream('PO-' . str_pad($order->id, 5, '0', STR_PAD_LEFT) . '.pdf');
    }
}
