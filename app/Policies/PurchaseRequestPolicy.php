<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\PurchaseRequest;
use App\Models\User;

class PurchaseRequestPolicy
{
    /**
     * Admins and project managers can bypass most checks,
     * but we still want to enforce project ACTIVE status for them too
     * to ensure BOQ is finalized before any purchasing happens.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return null;
    }

    /**
     * Determine if the user can create a purchase request for a project.
     * All users (including PMs) must wait for the project to be ACTIVE.
     */
    public function create(User $user, Project $project): bool
    {
        // NO ONE can create a purchase request if the BOQ/Project is not ACTIVE.
        if ($project->status !== 'ACTIVE') {
            return false;
        }

        if ($user->hasRole('site_engineer')) {
            return $project->isMember($user);
        }

        return $user->hasAnyRole(['admin', 'project_manager', 'procurement_officer']);
    }

    public function view(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if ($user->hasRole('site_engineer')) {
            return $purchaseRequest->project->isMember($user);
        }

        return true;
    }

    public function manage(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->hasAnyRole(['admin', 'project_manager']);
    }
}
