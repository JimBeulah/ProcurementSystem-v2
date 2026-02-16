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
            'role' => 'ADMIN',
        ]);

        // Create test users for each role
        $roles = [
            ['name' => 'Project Manager', 'email' => 'pm@example.com', 'role' => 'PROJECT_MANAGER'],
            ['name' => 'Procurement Officer', 'email' => 'procurement@example.com', 'role' => 'PROCUREMENT_OFFICER'],
            ['name' => 'Engineer', 'email' => 'engineer@example.com', 'role' => 'ENGINEER'],
            ['name' => 'Finance Officer', 'email' => 'finance@example.com', 'role' => 'FINANCE'],
            ['name' => 'Encoder', 'email' => 'encoder@example.com', 'role' => 'ENCODER'],
        ];

        foreach ($roles as $roleData) {
            User::create([
                'name' => $roleData['name'],
                'email' => $roleData['email'],
                'password' => Hash::make('password'),
                'role' => $roleData['role'],
            ]);
        }

        // Create sample client
        Client::create([
            'name' => 'Sample Client Corp.',
            'contact_person' => 'Juan Dela Cruz',
            'contract_type' => 'Lump Sum',
            'payment_terms' => 'Net 30',
        ]);

        $this->call(RolesAndPermissionsSeeder::class);
    }
}
