<?php

namespace App\Http\Controllers;

use App\Enums\MaterialRequestStatus;
use App\Http\Requests\StoreMaterialRequestRequest;
use App\Models\BoqItem;
use App\Models\MaterialRequest;
use App\Models\Project;
use App\Services\MaterialRequestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaterialRequestController extends Controller
{
    public function __construct(
        protected MaterialRequestService $service
    ) {}

    public function index(Project $project): Response
    {
        $this->authorize('viewAny', [MaterialRequest::class, $project]);

        $project->load('client');

        $materialRequests = $project->materialRequests()
            ->with(['requester', 'items.boqItem', 'items.boqItemComponent'])
            ->orderBy('request_date', 'desc')
            ->get()
            ->map(function ($mr) {
                return array_merge($mr->toArray(), [
                    'can' => [
                        'cancel' => auth()->user()->can('cancel', $mr),
                        'approve' => auth()->user()->can('approve', $mr),
                        'reject' => auth()->user()->can('reject', $mr),
                    ],
                ]);
            });

        $boqItems = BoqItem::where('project_id', $project->id)
            ->with([
                'components',
                'components.materialRequestItems' => function ($q) {
                    $q->whereHas('materialRequest', function ($q2) {
                        $q2->whereNotIn('status', ['REJECTED', 'CANCELLED']);
                    });
                },
            ])
            ->get()
            ->map(function ($boqItem) {
                $clientBudget = ((float) $boqItem->material_unit_price + (float) $boqItem->labor_unit_price) * (float) $boqItem->quantity;

                $totalRequested = $boqItem->components->flatMap(fn ($c) => $c->materialRequestItems)
                    ->sum(fn ($mri) => (float) $mri->quantity * ((float) $mri->material_unit_price + (float) $mri->labor_unit_price));

                $item = $boqItem->toArray();
                $item['budget'] = $clientBudget;
                $item['total_requested'] = $totalRequested;
                $item['remaining_budget'] = $clientBudget - $totalRequested;

                return $item;
            });

        return Inertia::render('Projects/MaterialRequests', [
            'project' => $project,
            'materialRequests' => $materialRequests,
            'boqItems' => $boqItems,
        ]);
    }

    public function store(StoreMaterialRequestRequest $request, Project $project): RedirectResponse
    {
        $this->authorize('create', [MaterialRequest::class, $project]);

        $validated = $request->validated();
        $violations = $this->service->checkBudgetViolations($validated['items']);

        if (! empty($violations)) {
            $isAuthorizedToOverride = in_array(auth()->user()->role, ['admin', 'project_manager']);

            if ($isAuthorizedToOverride && $request->input('authorize_override')) {
                // Proceed with creation but log the override
                $mr = $this->service->create($project, $validated);

                activity()
                    ->performedOn($mr)
                    ->causedBy(auth()->user())
                    ->withProperty('violations', $violations)
                    ->log('Material Request created with Budget Override.');

                return redirect()->back()->with('success', 'Resource request submitted successfully with Budget Override.');
            }

            $itemsList = implode('; ', $violations);
            $msg = "Budget Exceeded! The request exceeds the budget for: $itemsList.";

            if ($isAuthorizedToOverride) {
                return redirect()->back()->with('warning', "$msg You may choose to Authorize Override if this price increase is necessary.");
            }

            return redirect()->back()->with('warning', "$msg Request blocked. Please contact your Project Manager.");
        }

        $this->service->create($project, $validated);

        return redirect()->back()->with('success', 'Resource request submitted successfully.');
    }

    public function approve(MaterialRequest $materialRequest): RedirectResponse
    {
        $this->authorize('approve', $materialRequest);

        if ($materialRequest->status !== MaterialRequestStatus::PENDING) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $pr = $this->service->approve($materialRequest);

        return redirect()->back()->with(
            'success',
            "Resource Request RQ-{$materialRequest->id} approved and Purchase Request PR-".str_pad($pr->id, 5, '0', STR_PAD_LEFT).' generated.'
        );
    }

    public function reject(Request $request, MaterialRequest $materialRequest): RedirectResponse
    {
        $this->authorize('reject', $materialRequest);

        if ($materialRequest->status !== MaterialRequestStatus::PENDING) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $this->service->reject($materialRequest, $request->input('remarks'));

        return redirect()->back()->with('success', "Resource Request RQ-{$materialRequest->id} rejected.");
    }

    public function cancel(MaterialRequest $materialRequest): RedirectResponse
    {
        $this->authorize('cancel', $materialRequest);

        if ($materialRequest->status !== MaterialRequestStatus::PENDING) {
            return redirect()->back()->with('error', 'Only pending requests can be cancelled.');
        }

        $this->service->cancel($materialRequest);

        return redirect()->back()->with('success', "Resource Request RQ-{$materialRequest->id} has been cancelled.");
    }
}
