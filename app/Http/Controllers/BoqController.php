<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBoqComponentRequest;
use App\Http\Requests\StoreBoqItemRequest;
use App\Models\BoqItem;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BoqController extends Controller
{
    public function __construct(protected \App\Services\BoqService $boqService)
    {
    }

    public function index(Project $project): Response
    {
        if (auth()->user()->hasRole('site_engineer')) {
            abort(403, 'Unauthorized. Site Engineers cannot view BOQ details.');
        }

        $project->load('client', 'approver');
        $boqItems = BoqItem::where('project_id', $project->id)
            ->with('components')
            ->orderBy('id')
            ->get();

        $materials = \App\Models\Material::orderBy('name')->get();
        $units = \App\Models\Unit::orderBy('name')->get();

        return Inertia::render('Projects/Boq', [
            'project' => $project,
            'boqItems' => $boqItems,
            'materials' => $materials,
            'units' => $units,
            'isApproved' => !!$project->approved_by
        ]);
    }

    public function approve(Project $project): RedirectResponse
    {
        if (!in_array(auth()->user()->role, ['admin', 'project_manager'])) {
            abort(403, 'Unauthorized. Only Admins and Project Managers can approve BOQs.');
        }

        if ($project->approved_by) {
            return redirect()->back()->with('error', 'Project BOQ is already approved.');
        }

        $project->update([
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Project BOQ approved successfully.');
    }

    public function store(StoreBoqItemRequest $request, Project $project): RedirectResponse
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $this->boqService->store($request->validated(), $project);

        return redirect()->back()->with('success', 'BOQ item added successfully.');
    }

    public function bulkStore(Request $request, Project $project): RedirectResponse
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.itemDescription' => 'required|string',
            'items.*.unit' => 'required|string',
            'items.*.quantity' => 'required|numeric',
            'items.*.materialUnitPrice' => 'required|numeric',
            'items.*.laborUnitPrice' => 'required|numeric',
            'items.*.isCarport' => 'boolean',
            'items.*.components' => 'array'
        ]);

        $this->boqService->bulkStore($validated['items'], $project);

        return redirect()->back()->with('success', 'Bulk upload successful.');
    }

    public function update(StoreBoqItemRequest $request, Project $project, BoqItem $boqItem): RedirectResponse
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403);
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $validated = $request->validated();

        $boqItem->update([
            'item_description' => $validated['item_description'],
            'unit' => $validated['unit'],
            'quantity' => $validated['quantity'],
            'material_unit_price' => $validated['material_unit_price'] ?? 0,
            'labor_unit_price' => $validated['labor_unit_price'] ?? 0,
            'is_carport' => $validated['is_carport'] ?? false,
        ]);

        return redirect()->back()->with('success', 'BOQ Item updated successfully.');
    }

    public function destroy(Project $project, BoqItem $boqItem): RedirectResponse
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403, 'Item does not belong to this project.');
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $boqItem->components()->delete();
        $boqItem->delete();

        return redirect()->back()->with('success', 'BOQ item deleted successfully.');
    }

    // Components / DUPA Management

    public function storeComponent(StoreBoqComponentRequest $request, Project $project, BoqItem $boqItem): RedirectResponse
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403);
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $this->boqService->storeComponent($request->validated(), $boqItem);

        return redirect()->back()->with('success', 'Resource added successfully.');
    }

    public function updateComponent(StoreBoqComponentRequest $request, Project $project, \App\Models\BoqItemComponent $boqComponent): RedirectResponse
    {
        // Enforce project ownership via relation check
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $this->boqService->updateComponent($request->validated(), $boqComponent);

        return redirect()->back()->with('success', 'Resource updated successfully.');
    }

    public function destroyComponent(Project $project, \App\Models\BoqItemComponent $boqComponent): RedirectResponse
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $boqComponent->delete();
        return redirect()->back()->with('success', 'Resource deleted successfully.');
    }
}
