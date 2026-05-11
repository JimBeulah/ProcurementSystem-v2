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

        $permissions = [
            // System
            'view dashboard',
            'view settings',
            'manage users',

            // Clients
            'view clients',
            'manage clients',

            // Projects
            'view projects',
            'create projects',
            'edit projects',
            'delete projects',

            // BOQ
            'view boq',
            'manage boq',
            'approve boq',

            // Material Requests
            'view material requests',
            'create material requests',
            'approve material requests',
            'reject material requests',

            // Purchase Requests
            'view purchase requests',
            'manage purchase requests',

            // Purchase Orders
            'view purchase orders',
            'create purchase orders',
            'approve purchase orders',

            // Suppliers
            'view suppliers',
            'manage suppliers',

            // Inventory
            'view inventory',
            'manage inventory',

            // Receiving
            'view receiving',
            'create receiving',

            // Finance
            'view invoices',
            'manage invoices',
            'view disbursements',
            'manage disbursements',
            'view financial reports',

            // Site Release
            'view site release',
            'create site release',
            'confirm site release',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $roles = [
            'admin' => $permissions, // Super Admin gets everything

            'project_manager' => [
                'view dashboard',
                'view clients',
                'manage clients',
                'view projects',
                'create projects',
                'edit projects',
                'delete projects',
                'view boq',
                'manage boq',
                'approve boq',
                'view material requests',
                'create material requests',
                'approve material requests',
                'reject material requests',
                'view purchase requests',
                'manage purchase requests',
                'view purchase orders',
                'approve purchase orders',
                'view inventory',
                'view receiving',
                'view financial reports',
                'view site release',
            ],

            'site_engineer' => [
                'view dashboard',
                'view projects',
                'view boq',
                'view material requests',
                'create material requests',
                'view site release',
                'confirm site release',
            ],

            'warehouse' => [
                'view dashboard',
                'view projects',
                'view material requests',
                'view purchase orders',
                'view inventory',
                'manage inventory',
                'view receiving',
                'create receiving',
                'view site release',
                'create site release',
            ],

            'procurement_officer' => [
                'view dashboard',
                'view clients',
                'manage clients',
                'view projects',
                'view boq',
                'view material requests',
                'view purchase requests',
                'view purchase orders',
                'create purchase orders',
                'view suppliers',
                'manage suppliers',
                'view inventory',
                'view receiving',
            ],

            'finance' => [
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
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);

            if ($roleName === 'admin') {
                $role->syncPermissions(Permission::all());
            } else {
                $role->syncPermissions($rolePermissions);
            }
        }

        // Assign roles to users based on their 'role' column
        $roleMapping = [
            'admin' => 'admin',
            'project_manager' => 'project_manager',
            'procurement_officer' => 'procurement_officer',
            'site_engineer' => 'site_engineer',
            'finance' => 'finance',
            'warehouse' => 'warehouse',
        ];

        $users = User::all();
        foreach ($users as $user) {
            if ($user->role) {
                $mappedRole = $roleMapping[$user->role] ?? null;

                if ($mappedRole && Role::where('name', $mappedRole)->exists()) {
                    // 1. Assign granular permissions via Spatie
                    $user->syncRoles([$mappedRole]);

                    // 2. Officially update their string 'role' column
                    if ($user->role !== $mappedRole) {
                        $user->update(['role' => $mappedRole]);
                    }
                }
            }
        }
    }
}
