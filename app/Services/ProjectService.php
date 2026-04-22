<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;

class ProjectService
{
    /**
     * Get all projects visible to the given user, with relations.
     */
    public function getAllForUser(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return Project::with(['client', 'siteEngineer'])
            ->addSelect([
                'projects.*',
                'total_profit' => \App\Models\BoqItemComponent::selectRaw('COALESCE(SUM(client_total_cost - altapil_total_cost), 0)')
                    ->join('boq_items', 'boq_items.id', '=', 'boq_item_components.boq_item_id')
                    ->whereColumn('boq_items.project_id', 'projects.id'),
            ])
            ->forUser($user)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function create(array $data): Project
    {
        if (empty($data['status'])) {
            $data['status'] = 'PLANNING';
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
            \App\Models\MaterialReturn::where('project_id', $project->id)->exists() ||
            \App\Models\SiteRelease::where('project_id', $project->id)->exists();

        if ($hasTransactions) {
            throw new \Exception('Cannot delete project because it has active transactions (Purchase Orders, Material Requests, or Inventory). Please archive or cancel the project instead.');
        }

        // If it only has BOQ items, we can safely delete them
        $project->boqItems()->delete();
        $project->delete();
    }
}
