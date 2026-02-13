<?php

namespace App\Http\Controllers;

use App\Models\BoqItem;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MaterialRequestController extends Controller
{
    public function index(Project $project)
    {
        $project->load('client');

        $materialRequests = MaterialRequest::where('project_id', $project->id)
            ->with(['requester', 'items'])
            ->orderBy('request_date', 'desc')
            ->get();

        $boqItems = BoqItem::where('project_id', $project->id)->get();

        return Inertia::render('Projects/MaterialRequests', [
            'project' => $project,
            'materialRequests' => $materialRequests,
            'boqItems' => $boqItems,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.item_description' => 'required|string|max:500',
            'items.*.unit' => 'required|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.material_unit_price' => 'nullable|numeric|min:0',
            'items.*.labor_unit_price' => 'nullable|numeric|min:0',
        ]);

        $mr = MaterialRequest::create([
            'project_id' => $project->id,
            'requester_id' => auth()->id(),
            'request_date' => now(),
            'status' => 'PENDING',
            'remarks' => $validated['remarks'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            MaterialRequestItem::create([
                'material_request_id' => $mr->id,
                'item_description' => $item['item_description'],
                'unit' => $item['unit'],
                'quantity' => $item['quantity'],
                'material_unit_price' => $item['material_unit_price'] ?? 0,
                'labor_unit_price' => $item['labor_unit_price'] ?? 0,
            ]);
        }

        return redirect()->back()->with('success', 'Material request submitted successfully.');
    }
}
