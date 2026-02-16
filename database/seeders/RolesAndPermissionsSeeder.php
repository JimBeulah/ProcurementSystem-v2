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

        // Create roles based on the enum in User model
        $roles = [
            'ADMIN',
            'PROJECT_MANAGER',
            'PROCUREMENT_OFFICER',
            'ENGINEER',
            'FINANCE',
            'AUDITOR',
            'HEAD_OF_ADMIN',
            'ENCODER',
            'PURCHASER',
            'APPROVER',
            'CASH_DISBURSEMENT',
            'WAREHOUSE',
            'SITE_ENGINEER',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        // Assign roles to existing users based on their 'role' column
        $users = User::all();
        foreach ($users as $user) {
            if ($user->role) {
                $user->assignRole($user->role);
            }
        }
    }
}
