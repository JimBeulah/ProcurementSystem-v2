<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::with('client')
            ->orderBy('created_at', 'desc')
            ->get();

        $clients = Client::orderBy('name')->get();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'clients' => $clients,
        ]);
    }

    public function show(Project $project)
    {
        $project->load(['client', 'boqItems', 'materialRequests', 'purchaseOrders']);

        return Inertia::render('Projects/Show', [
            'project' => $project,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'location' => 'nullable|string|max:255',
            'budget' => 'required|numeric|min:0',
            'duration' => 'nullable|string|max:100',
            'total_floor_area' => 'nullable|numeric|min:0',
            'carport_area' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:ACTIVE,COMPLETED,ON_HOLD',
            'project_type' => 'nullable|string|in:BUILDING,INFRASTRUCTURE,MAINTENANCE',
            'appropriation' => 'nullable|numeric|min:0',
            'source_of_fund' => 'nullable|string|max:255',
            'contract_id' => 'nullable|string|max:100',
            'project_component_id' => 'nullable|string|max:100',
            'net_length' => 'nullable|numeric|min:0',
        ]);

        Project::create($validated);

        return redirect()->route('projects.index');
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'location' => 'nullable|string|max:255',
            'budget' => 'required|numeric|min:0',
            'duration' => 'nullable|string|max:100',
            'total_floor_area' => 'nullable|numeric|min:0',
            'carport_area' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:ACTIVE,COMPLETED,ON_HOLD',
            'project_type' => 'nullable|string|in:BUILDING,INFRASTRUCTURE,MAINTENANCE',
            'appropriation' => 'nullable|numeric|min:0',
            'source_of_fund' => 'nullable|string|max:255',
            'contract_id' => 'nullable|string|max:100',
            'project_component_id' => 'nullable|string|max:100',
            'net_length' => 'nullable|numeric|min:0',
        ]);

        $project->update($validated);

        return redirect()->route('projects.index');
    }

    public function destroy(Project $project)
    {
        $project->boqItems()->delete();
        $project->delete();

        return redirect()->route('projects.index');
    }
}
