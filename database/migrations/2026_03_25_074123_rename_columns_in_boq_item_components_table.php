<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            if (Schema::hasColumn('boq_item_components', 'unit_rate')) {
                $table->renameColumn('unit_rate', 'client_unit_rate');
            }
            if (Schema::hasColumn('boq_item_components', 'total_component_cost')) {
                $table->renameColumn('total_component_cost', 'client_total_cost');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            if (Schema::hasColumn('boq_item_components', 'client_unit_rate')) {
                $table->renameColumn('client_unit_rate', 'unit_rate');
            }
            if (Schema::hasColumn('boq_item_components', 'client_total_cost')) {
                $table->renameColumn('client_total_cost', 'total_component_cost');
            }
        });
    }
};
