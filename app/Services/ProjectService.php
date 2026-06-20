<?php

namespace App\Services;

use App\Enums\MaterialRequestStatus;
use App\Models\BoqItemComponent;
use App\Models\MaterialRequestItem;
use App\Models\MaterialReturn;
use App\Models\Project;
use App\Models\SiteRelease;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class ProjectService
{
    /**
     * Get all projects visible to the given user, with relations.
     */
    public function getAllForUser(User $user): Collection
    {
        $projects = Project::with(['client', 'siteEngineer'])
            ->addSelect([
                'projects.*',
                'total_budget' => BoqItemComponent::selectRaw('COALESCE(SUM(total_cost), 0)')
                    ->join('boq_items', 'boq_items.id', '=', 'boq_item_components.boq_item_id')
                    ->whereColumn('boq_items.project_id', 'projects.id'),
                'total_actual_spend' => MaterialRequestItem::selectRaw('COALESCE(SUM(mri.quantity * (mri.material_unit_price + mri.labor_unit_price)), 0)')
                    ->from('material_request_items as mri')
                    ->join('material_requests as mr', 'mr.id', '=', 'mri.material_request_id')
                    ->whereColumn('mr.project_id', 'projects.id')
                    ->whereNotIn('mr.status', [
                        MaterialRequestStatus::REJECTED->value,
                        MaterialRequestStatus::CANCELLED->value,
                    ]),
            ])
            ->forUser($user)
            ->orderBy('created_at', 'desc')
            ->get();

        $projects->each(function ($project) {
            $project->profit_or_loss = (float) $project->total_budget - (float) $project->total_actual_spend;
        });

        return $projects;
    }

    public function create(array $data): Project
    {
        if (empty($data['status'])) {
            $data['status'] = 'ACTIVE';
        }

        return Project::create($data);
    }

    /**
     * Update an existing project.
     */
    public function update(Project $project, array $data): Project
    {
        $project->update($data);

        return $project;
    }

    /**
     * Delete a project and its BOQ items, but only if no transactions exist.
     *
     * @throws \Exception
     */
    public function delete(Project $project): void
    {
        // Check for active transactions
        $hasTransactions = $project->purchaseOrders()->exists() ||
            $project->materialRequests()->exists() ||
            $project->financialTransactions()->exists() ||
            $project->inventoryItems()->where('quantity', '>', 0)->exists() ||
            MaterialReturn::where('project_id', $project->id)->exists() ||
            SiteRelease::where('project_id', $project->id)->exists();

        if ($hasTransactions) {
            throw new \Exception('Cannot delete project because it has active transactions (Purchase Orders, Material Requests, or Inventory). Please archive or cancel the project instead.');
        }

        // If it only has BOQ items, we can safely delete them
        $project->boqItems()->delete();
        $project->delete();
    }
}
