<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProjectType;

class ProjectTypesSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'BUILDING', 'label' => 'Building', 'color' => 'cyan'],
            ['name' => 'INFRASTRUCTURE', 'label' => 'Infrastructure', 'color' => 'orange'],
            ['name' => 'MAINTENANCE', 'label' => 'Maintenance', 'color' => 'blue'],
        ];

        foreach ($types as $type) {
            ProjectType::firstOrCreate(['name' => $type['name']], $type);
        }
    }
}
