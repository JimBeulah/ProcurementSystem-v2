<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Company;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Company::firstOrCreate(['name' => 'Procurement System Inc.'], [
            'address' => 'Manila, Philippines',
            'currency' => 'PHP',
        ]);

        $users = [
            ['name' => 'Admin', 'email' => 'admin@example.com', 'username' => 'admin', 'role' => 'admin', 'password' => 'password'],
            ['name' => 'Project Manager', 'email' => 'pm@example.com', 'username' => 'pm', 'role' => 'project_manager', 'password' => 'password'],
            ['name' => 'Site Engineer', 'email' => 'site_engineer@example.com', 'username' => 'site_engineer', 'role' => 'site_engineer', 'password' => 'password'],
            ['name' => 'Warehouse Officer', 'email' => 'warehouse@example.com', 'username' => 'warehouse', 'role' => 'warehouse', 'password' => 'password'],
            ['name' => 'Procurement Officer', 'email' => 'procurement@example.com', 'username' => 'procurement', 'role' => 'procurement_officer', 'password' => 'password'],
            ['name' => 'Finance Officer', 'email' => 'finance@example.com', 'username' => 'finance', 'role' => 'finance', 'password' => 'password'],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(['email' => $userData['email']], [
                'name' => $userData['name'],
                'username' => $userData['username'],
                'password' => Hash::make($userData['password']),
                'role' => $userData['role'],
                'is_active' => true,
            ]);
        }

        $this->call(RolesAndPermissionsSeeder::class);
    }
}
