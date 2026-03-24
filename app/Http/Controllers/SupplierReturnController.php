<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierReturnRequest;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\SupplierReturn;
use App\Services\SupplierReturnService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierReturnController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected SupplierReturnService $service
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', SupplierReturn::class);

        $query = SupplierReturn::with(['project', 'supplier', 'initiatedBy', 'purchaseOrder', 'items'])
            ->orderBy('created_at', 'desc');

        if (auth()->user()->hasRole('site_engineer')) {
            $projectIds = Project::where('site_engineer_id', auth()->id())->pluck('id');
            $query->whereIn('project_id', $projectIds);
        }

        $returns = $query->paginate(20)->withQueryString();

        $projects = Project::where('status', 'ACTIVE')->orderBy('name')->get();
        $suppliers = Supplier::orderBy('name')->get();
        $materials = \App\Models\Material::orderBy('name')->get();

        return Inertia::render('Purchasing/SupplierReturns/Index', [
            'returns' => $returns,
            'projects' => $projects,
            'suppliers' => $suppliers,
            'materials' => $materials,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', SupplierReturn::class);

        $projects = Project::where('status', 'ACTIVE')->orderBy('name')->get(['id', 'name']);
        $suppliers = Supplier::orderBy('name')->get(['id', 'name']);

        $po = null;
        if ($request->query('poId')) {
            $po = PurchaseOrder::with(['supplier', 'items', 'project'])->find($request->query('poId'));
        }

        return Inertia::render('Purchasing/SupplierReturns/Create', [
            'projects' => $projects,
            'suppliers' => $suppliers,
            'purchaseOrder' => $po,
        ]);
    }

    public function store(StoreSupplierReturnRequest $request): RedirectResponse
    {
        $this->service->create($request->validated());

        return redirect()->route('supplier-returns.index')
            ->with('success', 'Supplier return request submitted and is pending approval.');
    }

    public function show(SupplierReturn $supplierReturn): Response
    {
        $this->authorize('view', $supplierReturn);

        $supplierReturn->load(['project', 'supplier', 'initiatedBy', 'approvedBy', 'purchaseOrder', 'items']);

        return Inertia::render('Purchasing/SupplierReturns/Show', [
            'supplierReturn' => $supplierReturn,
        ]);
    }

    public function approve(SupplierReturn $supplierReturn): RedirectResponse
    {
        $this->authorize('update', $supplierReturn);

        try {
            $this->service->approve($supplierReturn);

            return redirect()->back()->with('success', 'Return approved.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function markReturned(Request $request, SupplierReturn $supplierReturn): RedirectResponse
    {
        $this->authorize('update', $supplierReturn);

        $validated = $request->validate([
            'return_reference' => 'nullable|string|max:255',
            'returned_date' => 'required|date',
        ]);

        try {
            $this->service->markAsReturned($supplierReturn, $validated);

            return redirect()->back()->with('success', 'Items marked as returned to supplier.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function cancel(SupplierReturn $supplierReturn): RedirectResponse
    {
        $this->authorize('delete', $supplierReturn);

        try {
            $this->service->cancel($supplierReturn);

            return redirect()->back()->with('success', 'Return cancelled and inventory restored.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
