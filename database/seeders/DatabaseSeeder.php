<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Client;
use App\Models\Company;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create default company
        Company::create([
            'name' => 'Procurement System Inc.',
            'address' => 'Manila, Philippines',
            'currency' => 'PHP',
        ]);

        // Create admin user
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // Create test users for each role
        $roles = [
            ['name' => 'Project Manager', 'email' => 'pm@example.com', 'role' => 'project_manager'],
            ['name' => 'Site Engineer', 'email' => 'site_engineer@example.com', 'role' => 'site_engineer'],
            ['name' => 'Warehouse Officer', 'email' => 'warehouse@example.com', 'role' => 'warehouse'],
            ['name' => 'Procurement Officer', 'email' => 'procurement@example.com', 'role' => 'procurement_officer'],
            ['name' => 'Finance Officer', 'email' => 'finance@example.com', 'role' => 'finance'],
        ];

        foreach ($roles as $roleData) {
            User::create([
                'name' => $roleData['name'],
                'email' => $roleData['email'],
                'password' => Hash::make('password'),
                'role' => $roleData['role'],
            ]);
        }

        $this->call(RolesAndPermissionsSeeder::class);
    }
}
