<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\Rfq;
use App\Models\RfqItem;
use App\Models\Supplier;
use App\Models\SupplierQuotation;
use App\Models\QuotationItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RfqController extends Controller
{
    public function index()
    {
        $rfqs = Rfq::with(['createdBy', 'items'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Purchasing/Rfq/Index', [
            'rfqs' => $rfqs,
        ]);
    }

    public function show(Rfq $rfq)
    {
        $rfq->load(['items', 'quotations.supplier', 'quotations.items', 'createdBy']);
        $suppliers = Supplier::orderBy('name')->get();

        return Inertia::render('Purchasing/Rfq/Show', [
            'rfq' => $rfq,
            'suppliers' => $suppliers,
        ]);
    }

    public function create()
    {
        $materials = Material::orderBy('name')->get();
        $suppliers = Supplier::orderBy('name')->get();

        return Inertia::render('Purchasing/Rfq/Create', [
            'materials' => $materials,
            'suppliers' => $suppliers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'due_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.material_name' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'nullable|string|max:50',
        ]);

        $rfq = Rfq::create([
            'title' => $validated['title'],
            'due_date' => $validated['due_date'],
            'status' => 'OPEN',
            'created_by_id' => auth()->id(),
        ]);

        foreach ($validated['items'] as $item) {
            RfqItem::create([
                'rfq_id' => $rfq->id,
                'material_name' => $item['material_name'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? '',
            ]);
        }

        return redirect()->route('purchasing.rfq.show', $rfq);
    }

    public function addQuotation(Request $request, Rfq $rfq)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array',
            'items.*.material_name' => 'required|string',
            'items.*.quantity' => 'required|numeric',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $totalAmount = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);

        $quotation = SupplierQuotation::create([
            'rfq_id' => $rfq->id,
            'supplier_id' => $validated['supplier_id'],
            'quote_date' => now(),
            'total_amount' => $totalAmount,
            'is_selected' => false,
        ]);

        foreach ($validated['items'] as $item) {
            QuotationItem::create([
                'supplier_quotation_id' => $quotation->id,
                'material_name' => $item['material_name'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'remarks' => 'Manual Entry',
            ]);
        }

        return redirect()->back();
    }

    public function award(Rfq $rfq, SupplierQuotation $quotation)
    {
        $rfq->quotations()->update(['is_selected' => false]);
        $quotation->update(['is_selected' => true]);
        $rfq->update(['status' => 'AWARDED']);

        return redirect()->back();
    }
}
