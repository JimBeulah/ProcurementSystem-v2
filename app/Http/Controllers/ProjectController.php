<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::with(['client', 'siteEngineer'])
            ->forUser(auth()->user())
            ->orderBy('created_at', 'desc')
            ->get();

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

        $project->load(['client', 'siteEngineer', 'boqItems', 'materialRequests', 'purchaseOrders']);

        return Inertia::render('Projects/Show', [
            'project' => $project,
        ]);
    }

    public function store(StoreProjectRequest $request)
    {
        Project::create($request->validated());

        return redirect()->route('projects.index')->with('success', 'Project created successfully.');
    }

    public function update(UpdateProjectRequest $request, Project $project)
    {
        $project->update($request->validated());

        return redirect()->route('projects.index')->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project)
    {
        $project->boqItems()->delete();
        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Project deleted successfully.');
    }
}
