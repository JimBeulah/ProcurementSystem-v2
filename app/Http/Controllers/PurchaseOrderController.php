<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseOrderRequest;
use App\Models\Material;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\SupplierReturn;
use App\Services\InventoryMatchingService;
use App\Services\PurchaseOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $this->authorize('viewAny', PurchaseOrder::class);
        $orders = PurchaseOrder::with(['project', 'supplier', 'requester', 'approver', 'items.purchaseRequestItem', 'siteReleases.inventoryItem'])
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $pr = $this->service->findPurchaseRequest($request->query('prId'));

        // Handle pre-filling from a Supplier Return
        $supplierReturn = null;
        if ($request->query('returnId')) {
            $supplierReturn = SupplierReturn::with(['project', 'items', 'supplier'])
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
        $this->authorize('view', $order);
        $order->load(['project', 'supplier', 'requester', 'approver', 'items.purchaseRequestItem', 'siteReleases.inventoryItem']);

        return Inertia::render('Purchasing/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', PurchaseOrder::class);
        $projects = Project::where('status', 'ACTIVE')->orderBy('name')->get();
        $suppliers = Supplier::orderBy('name')->get();
        $materials = Material::orderBy('name')->get();
        $pr = $this->service->findPurchaseRequest($request->query('prId'));

        // Handle pre-filling from a Supplier Return
        $supplierReturn = null;
        if ($request->query('returnId')) {
            $supplierReturn = SupplierReturn::with(['project', 'items', 'supplier'])
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
        $this->authorize('create', PurchaseOrder::class);
        $po = $this->service->create($request->validated(), Auth::id());

        if (! $po) {
            // Means 100% of the requested items were sourced from the internal warehouse
            return redirect()->route('purchasing.orders.index')
                ->with('success', 'Order fully fulfilled from warehouse stock. Site Releases have been auto-generated for the project site.');
        }

        return redirect()->route('purchasing.orders.index')->with('success', 'Purchase order created successfully.');
    }

    public function approve(PurchaseOrder $order): RedirectResponse
    {
        try {
            $this->authorize('approve', $order);
            $this->service->approve($order, Auth::id());

            return redirect()->back()->with('success', 'Purchase order approved successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function decline(Request $request, PurchaseOrder $order): RedirectResponse
    {
        try {
            $this->authorize('decline', $order);
            $this->service->decline($order, $request->input('remarks'));

            return redirect()->back()->with('success', 'Purchase order declined.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function cancel(Request $request, PurchaseOrder $order): RedirectResponse
    {
        $this->authorize('cancel', $order);
        $request->validate([
            'remarks' => 'required|string|max:500',
        ]);

        $this->service->cancel($order, $request->input('remarks'));

        return redirect()->back()->with('success', 'Purchase order cancelled successfully.');
    }

    public function print(PurchaseOrder $order)
    {
        $this->authorize('view', $order);
        // Delegate PDF generation to the Service layer
        $pdf = $this->service->generatePdf($order);

        return $pdf->stream('PO-'.str_pad($order->id, 5, '0', STR_PAD_LEFT).'.pdf');
    }
}
