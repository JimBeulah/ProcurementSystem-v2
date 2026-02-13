<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Project;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
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

        return Inertia::render('Purchasing/Orders/Create', [
            'projects' => $projects,
            'suppliers' => $suppliers,
            'materials' => $materials,
            'rfqId' => $request->query('rfqId'),
            'quoteId' => $request->query('quoteId'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'remarks' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.material_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.unit' => 'nullable|string|max:50',
        ]);

        $totalAmount = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);

        $po = PurchaseOrder::create([
            'project_id' => $validated['project_id'],
            'supplier_id' => $validated['supplier_id'],
            'requester_id' => auth()->id(),
            'order_date' => now(),
            'status' => 'PENDING',
            'remarks' => $validated['remarks'] ?? null,
            'total_amount' => $totalAmount,
        ]);

        foreach ($validated['items'] as $item) {
            PurchaseOrderItem::create([
                'purchase_order_id' => $po->id,
                'material_name' => $item['material_name'],
                'description' => $item['description'] ?? null,
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'unit' => $item['unit'] ?? 'pcs',
            ]);
        }

        return redirect()->route('purchasing.orders.index');
    }

    public function approve(PurchaseOrder $order)
    {
        $order->update([
            'status' => 'APPROVED',
            'approver_id' => auth()->id(),
        ]);

        return redirect()->back();
    }
}
