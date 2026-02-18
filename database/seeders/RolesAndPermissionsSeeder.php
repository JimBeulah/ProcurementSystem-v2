<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Define Permissions
        $permissions = [
            // System
            'view dashboard',
            'view settings',
            'manage users',
            'manage master data',

            // Clients
            'view clients',
            'manage clients', // create, edit, delete

            // Projects
            'view projects',
            'create projects',
            'edit projects',
            'delete projects',
            'approve projects', // if applicable

            // BOQ
            'view boq',
            'manage boq', // create, edit items
            'approve boq',

            // Material Requests
            'view material requests',
            'create material requests',
            'approve material requests',
            'reject material requests',

            // Purchase Orders
            'view purchase orders',
            'create purchase orders',
            'approve purchase orders',

            // RFQ
            'view rfq',
            'manage rfq',
            'award rfq',

            // Inventory
            'view inventory',
            'manage inventory', // adjust stock

            // Receiving
            'view receiving',
            'create receiving', // receive items

            // Finance
            'view invoices',
            'manage invoices', // process invoices
            'view disbursements',
            'manage disbursements', // process payments
            'view financial reports',

            // Site Release
            'view site release',
            'create site release',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. Define Roles and Assign Granuslar Permissions
        $roles = [
            'ADMIN' => $permissions, // Super Admin gets everything by default in logic below, but explicit here too
            'PROJECT_MANAGER' => [
                'view dashboard',
                'view clients',
                'view projects',
                'edit projects',
                'view boq',
                'manage boq',
                'view material requests',
                'create material requests',
                'approve material requests',
                'view purchase orders',
                'view receiving',
                'view financial reports',
                'view site release',
                'create site release',
            ],
            'PROCUREMENT_OFFICER' => [
                'view dashboard',
                'view clients',
                'manage clients',
                'view projects',
                'view boq',
                'view material requests',
                'view purchase orders',
                'create purchase orders',
                'view rfq',
                'manage rfq',
                'award rfq', // Key role for RFQ
                'view inventory',
                'view receiving',
            ],
            'ENGINEER' => [
                'view dashboard',
                'view projects',
                'view boq',
                'manage boq',
                'view material requests',
                'create material requests',
            ],
            'FINANCE' => [
                'view dashboard',
                'view projects',
                'view boq',
                'view purchase orders',
                'view inventory',
                'view receiving',
                'view invoices',
                'manage invoices',
                'view disbursements',
                'manage disbursements',
                'view financial reports',
            ],
            'AUDITOR' => [
                'view dashboard',
                'view clients',
                'view projects',
                'view boq',
                'view material requests',
                'view purchase orders',
                'view rfq',
                'view inventory',
                'view receiving',
                'view invoices',
                'view disbursements',
                'view financial reports',
                'view site release',
            ],
            'HEAD_OF_ADMIN' => [ // Assuming similar to Admin/HR but maybe less tech
                'view dashboard',
                'view settings',
                'manage users',
                'view projects',
            ],
            'ENCODER' => [
                'view dashboard',
                'view clients',
                'manage clients',
                'view projects',
                'create projects',
            ],
            'PURCHASER' => [
                'view dashboard',
                'view projects',
                'view purchase orders',
                'create purchase orders',
                'view rfq',
                'manage rfq',
            ],
            'APPROVER' => [ // General approver role, likely for high-level overrides
                'view dashboard',
                'view projects',
                'view boq',
                'approve boq',
                'view material requests',
                'approve material requests',
                'view purchase orders',
                'approve purchase orders',
            ],
            'CASH_DISBURSEMENT' => [
                'view dashboard',
                'view disbursements',
                'manage disbursements',
            ],
            'WAREHOUSE' => [
                'view dashboard',
                'view material requests',
                'view purchase orders',
                'view inventory',
                'manage inventory',
                'view receiving',
                'create receiving',
                'view site release',
                'create site release',
            ],
            'SITE_ENGINEER' => [
                'view dashboard',
                'view projects',
                'view boq',
                'view material requests',
                'create material requests',
                'view site release',
                'create site release',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName]);

            if ($roleName === 'ADMIN') {
                $role->syncPermissions(Permission::all()); // Give all perms
            } else {
                $role->syncPermissions($rolePermissions);
            }
        }

        // 3. Assign roles to users
        $users = User::all();
        foreach ($users as $user) {
            if ($user->role) {
                // Ensure the role exists before assigning (safety check)
                if (Role::where('name', $user->role)->exists()) {
                    $user->assignRole($user->role);
                }
            }
        }
    }
}
