<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
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
     * Determine if the user can view any projects.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view projects');
    }

    /**
     * Determine if the user can view the project.
     * Site engineers may only view projects assigned to them.
     */
    public function view(User $user, Project $project): bool
    {
        if ($user->hasRole('site_engineer')) {
            return $project->isMember($user);
        }

        return $user->hasPermissionTo('view projects');
    }

    /**
     * Determine if the user can create projects.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create projects');
    }

    /**
     * Determine if the user can update the project.
     */
    public function update(User $user, Project $project): bool
    {
        return $user->hasPermissionTo('edit projects');
    }

    /**
     * Determine if the user can delete the project.
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->hasPermissionTo('delete projects');
    }
}
