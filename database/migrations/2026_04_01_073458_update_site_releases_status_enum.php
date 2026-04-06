<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The site_releases table was originally created with only ['IN_TRANSIT', 'RECEIVED']
     * as allowed status values. The application code now uses PENDING, AWAITING_APPROVAL,
     * and CANCELLED as additional states to support the warehouse dispatch workflow.
     * This migration updates the PostgreSQL check constraint to allow all valid statuses.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // Drop the old enum check constraint (PostgreSQL stores enum as a check constraint)
            DB::statement("ALTER TABLE site_releases DROP CONSTRAINT IF EXISTS site_releases_status_check");

            // Re-add the constraint with the full set of allowed values
            DB::statement("ALTER TABLE site_releases ADD CONSTRAINT site_releases_status_check CHECK (status IN ('AWAITING_APPROVAL', 'PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE site_releases DROP CONSTRAINT IF EXISTS site_releases_status_check");
            DB::statement("ALTER TABLE site_releases ADD CONSTRAINT site_releases_status_check CHECK (status IN ('IN_TRANSIT', 'RECEIVED'))");
        }
    }
};
