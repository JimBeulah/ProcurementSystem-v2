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

            if (! Schema::hasColumn('boq_item_components', 'altapil_unit_rate')) {
                $table->decimal('altapil_unit_rate', 10, 2)->default(0)->after('client_unit_rate');
            }
            if (! Schema::hasColumn('boq_item_components', 'altapil_total_cost')) {
                $table->decimal('altapil_total_cost', 15, 2)->default(0)->after('client_total_cost');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->dropColumn(['altapil_unit_rate', 'altapil_total_cost']);
            $table->renameColumn('client_unit_rate', 'unit_rate');
            $table->renameColumn('client_total_cost', 'total_component_cost');
        });
    }
};
