<?php

namespace App\Policies;

use App\Models\MaterialRequest;
use App\Models\Project;
use App\Models\User;

class MaterialRequestPolicy
{
    /**
     * Admins and project managers can always do anything.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasAnyRole(['admin', 'project_manager'])) {
            return true;
        }

        return null;
    }

    /**
     * Determine if the user can view material requests for a project.
     * Site engineers may only view requests for their assigned projects.
     */
    public function viewAny(User $user, Project $project): bool
    {
        if ($user->hasRole('site_engineer')) {
            return $project->isMember($user);
        }

        return $user->hasPermissionTo('view material requests');
    }

    public function create(User $user, Project $project): bool
    {
        if ($project->status !== 'ACTIVE') {
            return false;
        }

        if ($user->hasRole('site_engineer')) {
            return $project->isMember($user);
        }

        return $user->hasPermissionTo('create material requests');
    }

    /**
     * Determine if the user can approve a material request.
     * Requires the admin or project_manager role.
     */
    public function approve(User $user, MaterialRequest $materialRequest): bool
    {
        return $user->hasAnyRole(['admin', 'project_manager']);
    }

    /**
     * Determine if the user can reject a material request.
     * Requires the admin or project_manager role.
     */
    public function reject(User $user, MaterialRequest $materialRequest): bool
    {
        return $user->hasAnyRole(['admin', 'project_manager']);
    }

    /**
     * Determine if the user can cancel their own material request.
     * Allowed if the user is the requester and the status is PENDING.
     */
    public function cancel(User $user, MaterialRequest $materialRequest): bool
    {
        // Admins and PMs are already covered by before() returning true.
        // For others (Site Engineers), check if they are the requester and it's pending.
        return $materialRequest->requester_id === $user->id && $materialRequest->status === 'PENDING';
    }
}
