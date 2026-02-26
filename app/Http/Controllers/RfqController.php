<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddRfqQuotationRequest;
use App\Http\Requests\StoreRfqRequest;
use App\Models\Material;
use App\Models\Rfq;
use App\Models\Supplier;
use App\Models\SupplierQuotation;
use App\Services\RfqService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RfqController extends Controller
{
    public function __construct(
        protected RfqService $service
    ) {
    }

    public function index(): Response
    {
        $rfqs = Rfq::with(['createdBy', 'items'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Purchasing/Rfq/Index', [
            'rfqs' => $rfqs,
        ]);
    }

    public function show(Rfq $rfq): Response
    {
        $rfq->load(['items', 'quotations.supplier', 'quotations.items', 'createdBy']);
        $suppliers = Supplier::orderBy('name')->get();

        return Inertia::render('Purchasing/Rfq/Show', [
            'rfq' => $rfq,
            'suppliers' => $suppliers,
        ]);
    }

    public function create(): Response
    {
        $materials = Material::orderBy('name')->get();
        $suppliers = Supplier::orderBy('name')->get();

        return Inertia::render('Purchasing/Rfq/Create', [
            'materials' => $materials,
            'suppliers' => $suppliers,
        ]);
    }

    public function store(StoreRfqRequest $request): RedirectResponse
    {
        $rfq = $this->service->create($request->validated());

        return redirect()->route('purchasing.rfq.show', $rfq);
    }

    public function addQuotation(AddRfqQuotationRequest $request, Rfq $rfq): RedirectResponse
    {
        $this->service->addQuotation($rfq, $request->validated());

        return redirect()->back();
    }

    public function award(Rfq $rfq, SupplierQuotation $quotation): RedirectResponse
    {
        $this->service->award($rfq, $quotation);

        return redirect()->back();
    }
}
