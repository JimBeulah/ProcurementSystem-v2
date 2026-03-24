<?php

namespace App\Policies;

use App\Models\PurchaseOrder;
use App\Models\User;

class PurchaseOrderPolicy
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
     * Determine if the user can view the purchase order.
     */
    public function view(User $user, PurchaseOrder $order): bool
    {
        // Site engineers can only view POs for their assigned projects
        if ($user->hasRole('site_engineer')) {
            return $order->project->site_engineer_id === $user->id;
        }

        // Other roles rely on the 'view purchase orders' permission (already checked by route middleware)
        return $user->hasPermissionTo('view purchase orders');
    }

    /**
     * Determine if the user can approve/decline the purchase order.
     */
    public function update(User $user, PurchaseOrder $order): bool
    {
        // Only admins and project managers (handled by before()) should update/approve POs
        return false;
    }
}
