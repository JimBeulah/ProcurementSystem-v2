<?php

namespace App\Services;

use App\Models\Client;
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
                    ->whereColumn('boq_items.project_id', 'projects.id')
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
     * Delete a project and its BOQ items.
     */
    public function delete(Project $project): void
    {
        $project->boqItems()->delete();
        $project->delete();
    }
}
