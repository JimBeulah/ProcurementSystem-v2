<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseRequestRequest;
use App\Models\Project;
use App\Models\PurchaseRequest;
use App\Services\PurchaseRequestService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequestController extends Controller
{
    public function __construct(
        protected PurchaseRequestService $service
    ) {}

    public function index(): Response
    {
        $query = PurchaseRequest::with(['project', 'requester', 'approver', 'items'])
            ->orderBy('created_at', 'desc');

        if (request('search')) {
            $search = request('search');
            $cleanSearch = ltrim(str_ireplace('PR-', '', $search), '0');

            $query->where(function ($q) use ($search, $cleanSearch) {
                $q->where('purpose', 'like', "%{$search}%")
                    ->orWhereHas('project', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('requester', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });

                if (is_numeric($cleanSearch) && $cleanSearch > 0) {
                    $q->orWhere('id', $cleanSearch);
                }
            });
        }

        if (request('date')) {
            $query->whereDate('request_date', request('date'));
        }

        if (request('status') && request('status') !== 'ALL') {
            $query->where('status', request('status'));
        }

        $requests = $query->paginate(15)->withQueryString();

        $projects = Project::where('status', 'ACTIVE')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Purchasing/Requests/Index', [
            'requests' => $requests,
            'projects' => $projects,
            'filters' => request()->only(['search', 'date', 'status']),
            'suppliers' => Inertia::lazy(fn () => \App\Models\Supplier::orderBy('name')->get()),
            'materials' => Inertia::lazy(fn () => \App\Models\Material::orderBy('name')->get()),
            'purchaseRequest' => Inertia::lazy(fn () => PurchaseRequest::with('items')->find(request('prId'))),
            'inventoryMatches' => Inertia::lazy(function () {
                $prId = request('prId');
                if (! $prId) {
                    return [];
                }
                $pr = PurchaseRequest::with('items')->find($prId);
                $inventoryMatches = [];
                if ($pr && $pr->items) {
                    foreach ($pr->items as $item) {
                        $matches = \App\Models\InventoryItem::where('quantity', '>', 0)
                            ->whereNull('project_id')
                            ->where('material_name', 'LIKE', '%'.$item->item_description.'%')
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

                return $inventoryMatches;
            }),
        ]);
    }

    public function store(StorePurchaseRequestRequest $request): RedirectResponse
    {
        $project = Project::findOrFail($request->project_id);
        $this->authorize('create', [PurchaseRequest::class, $project]);

        $this->service->create($request->validated());

        return redirect()->route('purchasing.requests.index')
            ->with('success', 'Purchase Request submitted successfully.');
    }

    public function approve(PurchaseRequest $purchaseRequest): RedirectResponse
    {
        try {
            $warning = $this->service->approve($purchaseRequest);

            if ($warning) {
                return redirect()->back()
                    ->with('success', 'Purchase Request approved.')
                    ->with('warning', $warning);
            }

            return redirect()->back()->with('success', 'Purchase Request approved.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function decline(PurchaseRequest $purchaseRequest): RedirectResponse
    {
        try {
            $this->service->decline($purchaseRequest);
            return redirect()->back()->with('success', 'Purchase Request declined.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function destroy(PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $purchaseRequest->delete();

        return redirect()->back()->with('success', 'Purchase Request deleted.');
    }

    public function print(PurchaseRequest $purchaseRequest)
    {
        // Delegate PDF generation to the Service layer
        $pdf = $this->service->generatePdf($purchaseRequest);

        return $pdf->stream('PR-'.str_pad($purchaseRequest->id, 5, '0', STR_PAD_LEFT).'.pdf');
    }
}
