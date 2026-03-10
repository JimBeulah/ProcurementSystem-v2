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

        // Smart Inventory Match: for each PR item, check warehouse stock with matching name
        $inventoryMatches = [];
        if ($pr && $pr->items) {
            foreach ($pr->items as $item) {
                $matches = \App\Models\InventoryItem::where('quantity', '>', 0)
                    ->whereNull('project_id')
                    ->where('material_name', 'LIKE', '%' . $item->item_description . '%')
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
        }

        return Inertia::render('Purchasing/Orders/Create', [
            'projects' => $projects,
            'suppliers' => $suppliers,
            'materials' => $materials,
            'rfqId' => $request->query('rfqId'),
            'quoteId' => $request->query('quoteId'),
            'purchaseRequest' => $pr,
            'inventoryMatches' => $inventoryMatches,
        ]);
    }

    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        $po = $this->service->create($request->validated());

        if (!$po) {
            // Means 100% of the requested items were sourced from the internal warehouse
            return redirect()->route('purchasing.orders.index')
                ->with('success', 'Order fully fulfilled from warehouse stock. Site Releases have been auto-generated for the project site.');
        }

        return redirect()->route('purchasing.orders.index')->with('success', 'Purchase order created successfully.');
    }

    public function approve(PurchaseOrder $order): RedirectResponse
    {
        $this->service->approve($order);

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
