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
     * Determine if the user can view the list of purchase orders.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view purchase orders');
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

        // Other roles rely on the 'view purchase orders' permission
        return $user->hasPermissionTo('view purchase orders');
    }

    /**
     * Determine if the user can create a purchase order.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create purchase orders');
    }

    /**
     * Determine if the user can approve the purchase order.
     */
    public function approve(User $user, PurchaseOrder $order): bool
    {
        // Handled by before() for admin/project_manager
        return false;
    }

    /**
     * Determine if the user can decline the purchase order.
     */
    public function decline(User $user, PurchaseOrder $order): bool
    {
        // Handled by before() for admin/project_manager
        return false;
    }

    /**
     * Determine if the user can cancel the purchase order.
     */
    public function cancel(User $user, PurchaseOrder $order): bool
    {
        // Procurement Officers can cancel their own PENDING or APPROVED orders
        // (But NOT partially delivered or completed ones)
        if ($user->hasRole('procurement_officer') &&
            in_array($order->status, [PurchaseOrder::STATUS_PENDING, PurchaseOrder::STATUS_APPROVED]) &&
            $order->requester_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can update the purchase order.
     */
    public function update(User $user, PurchaseOrder $order): bool
    {
        return false;
    }
}
