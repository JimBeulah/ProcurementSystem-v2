<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use App\Services\ProjectService;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function __construct(
        protected ProjectService $service
    ) {
    }

    public function index()
    {
        $projects = $this->service->getAllForUser(auth()->user());
        $clients = Client::orderBy('name')->get();
        $siteEngineers = User::role('site_engineer')->get();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'clients' => $clients,
            'siteEngineers' => $siteEngineers,
        ]);
    }

    public function show(Project $project)
    {
        if (auth()->user()->hasRole('site_engineer') && $project->site_engineer_id !== auth()->id()) {
            abort(403, 'Unauthorized access to this project.');
        }

        // Add the total_profit attribute via a raw query to avoid loading all BOQ components
        $project->total_profit = \App\Models\BoqItemComponent::join('boq_items', 'boq_items.id', '=', 'boq_item_components.boq_item_id')
            ->where('boq_items.project_id', $project->id)
            ->sum(\Illuminate\Support\Facades\DB::raw('client_total_cost - altapil_total_cost'));

        $project->load(['client', 'siteEngineer', 'boqItems', 'materialRequests', 'purchaseOrders']);

        return Inertia::render('Projects/Show', [
            'project' => $project,
        ]);
    }

    public function store(StoreProjectRequest $request)
    {
        $this->service->create($request->validated());

        return redirect()->route('projects.index')->with('success', 'Project created successfully.');
    }

    public function update(UpdateProjectRequest $request, Project $project)
    {
        $this->service->update($project, $request->validated());

        return redirect()->route('projects.index')->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project)
    {
        $this->service->delete($project);

        return redirect()->route('projects.index')->with('success', 'Project deleted successfully.');
    }
}
