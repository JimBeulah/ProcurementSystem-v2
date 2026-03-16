<?php

namespace App\Policies;

use App\Models\SupplierReturn;
use App\Models\User;

class SupplierReturnPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view purchase orders');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SupplierReturn $supplierReturn): bool
    {
        if ($user->hasRole('site_engineer')) {
            return $user->id === $supplierReturn->project->site_engineer_id;
        }

        return $user->can('view purchase orders');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('create purchase orders');
    }

    /**
     * Determine whether the user can update the model (approve/mark returned).
     */
    public function update(User $user, SupplierReturn $supplierReturn): bool
    {
        return $user->can('approve purchase orders');
    }

    /**
     * Determine whether the user can delete the model (cancel).
     */
    public function delete(User $user, SupplierReturn $supplierReturn): bool
    {
        // Initiator can cancel if it's still pending
        if ($user->id === $supplierReturn->initiated_by_id && $supplierReturn->status === 'PENDING_APPROVAL') {
            return true;
        }

        return $user->can('create purchase orders');
    }
}
