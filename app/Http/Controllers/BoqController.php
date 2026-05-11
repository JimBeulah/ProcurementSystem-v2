<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBoqComponentRequest;
use App\Http\Requests\StoreBoqItemRequest;
use App\Models\BoqItem;
use App\Models\BoqItemComponent;
use App\Models\Material;
use App\Models\Project;
use App\Models\Unit;
use App\Services\BoqService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BoqController extends Controller
{
    public function __construct(protected BoqService $boqService) {}

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

        $materialNames = Material::pluck('name')->toArray();
        $inventoryNames = \App\Models\InventoryItem::pluck('material_name')->toArray();
        
        $allNames = array_unique(array_merge($materialNames, $inventoryNames));
        sort($allNames);
        
        $materialSuggestions = collect($allNames)->map(function($name, $index) {
            return ['id' => $index + 1, 'name' => $name];
        });

        $units = Unit::orderBy('name')->get();

        return Inertia::render('Projects/Boq', [
            'project' => $project,
            'boqItems' => $boqItems,
            'materials' => $materialSuggestions,
            'units' => $units,
            'isApproved' => (bool) $project->approved_by,
        ]);
    }

    public function approve(Project $project): RedirectResponse
    {
        if (! in_array(auth()->user()->role, ['admin', 'project_manager'])) {
            abort(403, 'Unauthorized. Only Admins and Project Managers can approve BOQs.');
        }

        if ($project->approved_by) {
            return redirect()->back()->with('error', 'Project BOQ is already approved.');
        }

        $project->update([
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'status' => 'ACTIVE',
        ]);

        return redirect()->back()->with('success', 'Project BOQ approved successfully. The project is now ACTIVE.');
    }

    public function revise(Project $project, Request $request): RedirectResponse
    {
        if (! in_array(auth()->user()->role, ['admin', 'project_manager'])) {
            abort(403, 'Unauthorized. Only Admins and Project Managers can request BOQ revisions.');
        }

        $request->validate([
            'reason' => 'required|string|min:5',
        ]);

        $project->update([
            'approved_by' => null,
            'approved_at' => null,
            'status' => 'PLANNING',
        ]);

        // Log the revision reason in activity log
        activity()
            ->performedOn($project)
            ->causedBy(auth()->user())
            ->withProperty('reason', $request->reason)
            ->log('BOQ revision requested. Project status reverted to PLANNING.');

        return redirect()->back()->with('success', 'BOQ has been unlocked for revision. Project status reverted to PLANNING.');
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
            'items.*.components' => 'array',
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

    public function updateComponent(StoreBoqComponentRequest $request, Project $project, BoqItemComponent $boqComponent): RedirectResponse
    {
        // Enforce project ownership via relation check
        if ($boqComponent->boqItem->project_id !== $project->id) {
            abort(403, 'Component does not belong to this project.');
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $this->boqService->updateComponent($request->validated(), $boqComponent);

        return redirect()->back()->with('success', 'Resource updated successfully.');
    }

    public function destroyComponent(Project $project, BoqItemComponent $boqComponent): RedirectResponse
    {
        if ($boqComponent->boqItem->project_id !== $project->id) {
            abort(403, 'Component does not belong to this project.');
        }

        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $boqComponent->delete();

        return redirect()->back()->with('success', 'Resource deleted successfully.');
    }
}
