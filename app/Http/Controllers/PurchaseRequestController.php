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
    ) {
    }

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

        $projects = Project::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Purchasing/Requests/Index', [
            'requests' => $requests,
            'projects' => $projects,
            'filters' => request()->only(['search', 'date', 'status']),
        ]);
    }

    public function store(StorePurchaseRequestRequest $request): RedirectResponse
    {
        $this->service->create($request->validated());

        return redirect()->route('purchasing.requests.index')
            ->with('success', 'Purchase Request submitted successfully.');
    }

    public function approve(PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->service->approve($purchaseRequest);

        return redirect()->back()->with('success', 'Purchase Request approved.');
    }

    public function decline(PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->service->decline($purchaseRequest);

        return redirect()->back()->with('success', 'Purchase Request declined.');
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

        return $pdf->stream('PR-' . str_pad($purchaseRequest->id, 5, '0', STR_PAD_LEFT) . '.pdf');
    }
}
