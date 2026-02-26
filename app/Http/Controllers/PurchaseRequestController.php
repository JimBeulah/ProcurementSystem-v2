<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\PurchaseRequest;
use App\Services\PurchaseRequestService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseRequestController extends Controller
{
    public function __construct(
        protected PurchaseRequestService $service
    ) {
    }

    public function index()
    {
        $requests = PurchaseRequest::with(['project', 'requester', 'approver', 'items'])
            ->orderBy('created_at', 'desc')
            ->get();

        $projects = Project::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Purchasing/Requests/Index', [
            'requests' => $requests,
            'projects' => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'purpose' => 'nullable|string|max:500',
            'remarks' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.item_description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string|max:50',
            'items.*.estimated_unit_cost' => 'required|numeric|min:0',
        ]);

        $this->service->create($validated);

        return redirect()->route('purchasing.requests.index')
            ->with('success', 'Purchase Request submitted successfully.');
    }

    public function approve(PurchaseRequest $purchaseRequest)
    {
        $this->service->approve($purchaseRequest);

        return redirect()->back()->with('success', 'Purchase Request approved.');
    }

    public function decline(PurchaseRequest $purchaseRequest)
    {
        $this->service->decline($purchaseRequest);

        return redirect()->back()->with('success', 'Purchase Request declined.');
    }

    public function destroy(PurchaseRequest $purchaseRequest)
    {
        $purchaseRequest->delete();

        return redirect()->back()->with('success', 'Purchase Request deleted.');
    }
}
