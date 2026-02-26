<?php

namespace App\Http\Controllers;

use App\Models\BoqItem;
use App\Models\MaterialRequest;
use App\Models\Project;
use App\Services\MaterialRequestService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MaterialRequestController extends Controller
{
    public function __construct(
        protected MaterialRequestService $service
    ) {
    }

    public function index(Project $project)
    {
        if (auth()->user()->hasRole('site_engineer') && $project->site_engineer_id !== auth()->id()) {
            abort(403, 'Unauthorized access to this project.');
        }

        $project->load('client');

        $materialRequests = $project->materialRequests()
            ->with(['requester', 'items.boqItem', 'items.boqItemComponent'])
            ->orderBy('request_date', 'desc')
            ->get();

        $boqItems = BoqItem::where('project_id', $project->id)
            ->with('components')
            ->get();

        return Inertia::render('Projects/MaterialRequests', [
            'project' => $project,
            'materialRequests' => $materialRequests,
            'boqItems' => $boqItems,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        if (auth()->user()->hasRole('site_engineer') && $project->site_engineer_id !== auth()->id()) {
            abort(403, 'Unauthorized access to this project.');
        }

        $validated = $request->validate([
            'remarks' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.boq_item_id' => 'nullable|exists:boq_items,id',
            'items.*.boq_item_component_id' => 'nullable|exists:boq_item_components,id',
            'items.*.item_description' => 'required|string|max:500',
            'items.*.unit' => 'required|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.material_unit_price' => 'nullable|numeric|min:0',
            'items.*.labor_unit_price' => 'nullable|numeric|min:0',
        ]);

        $violations = $this->service->checkBudgetViolations($validated['items']);

        if (!empty($violations)) {
            $itemsList = implode('; ', $violations);
            return redirect()->back()->with('warning', "Budget Exceeded! The request exceeds the Altapil budget for: $itemsList. Request blocked.");
        }

        $this->service->create($project, $validated);

        return redirect()->back()->with('success', 'Material request submitted successfully.');
    }

    public function approve(MaterialRequest $materialRequest)
    {
        if (!in_array(auth()->user()->role, ['admin', 'project_manager'])) {
            abort(403, 'Unauthorized. Only Admins and Project Managers can approve requests.');
        }

        if ($materialRequest->status !== 'PENDING') {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $pr = $this->service->approve($materialRequest);

        return redirect()->back()->with(
            'success',
            "Material Request MR-{$materialRequest->id} approved and Purchase Request PR-" . str_pad($pr->id, 5, '0', STR_PAD_LEFT) . " generated."
        );
    }

    public function reject(Request $request, MaterialRequest $materialRequest)
    {
        if (!in_array(auth()->user()->role, ['admin', 'project_manager'])) {
            abort(403, 'Unauthorized. Only Admins and Project Managers can reject requests.');
        }

        if ($materialRequest->status !== 'PENDING') {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $this->service->reject($materialRequest, $request->input('remarks'));

        return redirect()->back()->with('success', "Material Request MR-{$materialRequest->id} rejected.");
    }
}
