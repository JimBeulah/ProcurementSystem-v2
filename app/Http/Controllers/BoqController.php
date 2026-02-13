<?php

namespace App\Http\Controllers;

use App\Models\BoqItem;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BoqController extends Controller
{
    public function index(Project $project)
    {
        $project->load('client');
        $boqItems = BoqItem::where('project_id', $project->id)
            ->with('components')
            ->orderBy('id')
            ->get();

        return Inertia::render('Projects/Boq', [
            'project' => $project,
            'boqItems' => $boqItems,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'item_description' => 'required|string|max:500',
            'unit' => 'required|string|max:50',
            'quantity' => 'required|numeric|min:0',
            'material_unit_price' => 'nullable|numeric|min:0',
            'labor_unit_price' => 'nullable|numeric|min:0',
            'is_carport' => 'nullable|boolean',
        ]);

        $validated['project_id'] = $project->id;

        BoqItem::create($validated);

        return redirect()->back();
    }

    public function destroy(Project $project, BoqItem $boqItem)
    {
        if ($boqItem->project_id !== $project->id) {
            abort(403, 'Item does not belong to this project.');
        }

        $boqItem->components()->delete();
        $boqItem->delete();

        return redirect()->back();
    }
}
