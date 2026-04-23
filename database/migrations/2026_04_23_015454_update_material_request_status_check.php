<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE material_requests DROP CONSTRAINT IF EXISTS material_requests_status_check');
            DB::statement("ALTER TABLE material_requests ADD CONSTRAINT material_requests_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE material_requests DROP CONSTRAINT IF EXISTS material_requests_status_check');
            DB::statement("ALTER TABLE material_requests ADD CONSTRAINT material_requests_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_FULFILLED', 'FULFILLED'))");
        }
    }
};
