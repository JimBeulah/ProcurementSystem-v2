<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('boq_items', function (Blueprint $table) {
            // Drop the old unique constraint
            $table->dropUnique(['project_id', 'item_description']);
        });

        // Add partial unique index for PostgreSQL
        DB::statement('CREATE UNIQUE INDEX boq_items_project_id_item_description_unique ON boq_items (project_id, item_description) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        // Drop the partial index
        DB::statement('DROP INDEX IF EXISTS boq_items_project_id_item_description_unique');

        Schema::table('boq_items', function (Blueprint $table) {
            // Restore the original unique constraint
            $table->unique(['project_id', 'item_description']);
        });
    }
};
