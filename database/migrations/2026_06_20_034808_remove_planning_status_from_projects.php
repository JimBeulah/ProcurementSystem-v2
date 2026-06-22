<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove PLANNING status from projects.
     *
     * The BOQ approval lock and PLANNING status were designed for client-facing workflows
     * but this system uses internal BOQ only. This migration:
     * - Converts all PLANNING projects to ACTIVE
     * - Changes status column default to ACTIVE
     * - Keeps approved_by/approved_at columns for historical preservation
     *
     * ⚠️ WARNING: This migration is ONE-WAY in production environments.
     * Rolling back will NOT restore original project statuses to PLANNING.
     * Only rollback if you need to restore the approval flow before data migration.
     */
    public function up(): void
    {
        DB::table('projects')->where('status', 'PLANNING')->update(['status' => 'ACTIVE']);

        Schema::table('projects', function (Blueprint $table) {
            $table->string('status')->default('ACTIVE')->change();
        });
    }

    public function down(): void
    {
        // NOTE: This only reverts the default. Existing ACTIVE records remain ACTIVE.
        // Use this only for local development if you need to restore the approval flow.
        // Do NOT use in production without manually restoring project statuses first.
        Schema::table('projects', function (Blueprint $table) {
            $table->string('status')->default('PLANNING')->change();
        });
    }
};
