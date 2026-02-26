<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\Rfq;
use App\Models\Supplier;
use App\Models\SupplierQuotation;
use App\Services\RfqService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RfqController extends Controller
{
    public function __construct(
        protected RfqService $service
    ) {
    }

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

        $rfq = $this->service->create($validated);

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

        $this->service->addQuotation($rfq, $validated);

        return redirect()->back();
    }

    public function award(Rfq $rfq, SupplierQuotation $quotation)
    {
        $this->service->award($rfq, $quotation);

        return redirect()->back();
    }
}
