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
        protected ProjectService $service,
        protected \App\Services\ReportService $reportService
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
        $this->authorize('view', $project);

        $project->load(['client', 'siteEngineer', 'boqItems', 'materialRequests', 'purchaseOrders']);

        return Inertia::render('Projects/Show', [
            'project' => $project,
        ]);
    }

    public function financials(Project $project)
    {
        $this->authorize('view', $project);

        return Inertia::render('Projects/Financials', [
            'project' => $project,
            'financialData' => $this->reportService->getFinancialReportsData($project->id),
        ]);
    }

    public function materialReturns(Project $project)
    {
        $this->authorize('view', $project);

        $returns = \App\Models\MaterialReturn::with(['returnedBy', 'receivedBy'])
            ->where('project_id', $project->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $inventory = \App\Models\InventoryItem::where('project_id', $project->id)
            ->where('quantity', '>', 0)
            ->orderBy('material_name', 'asc')
            ->get();

        return Inertia::render('Projects/MaterialReturns', [
            'project' => $project,
            'returns' => $returns,
            'inventory' => $inventory,
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
