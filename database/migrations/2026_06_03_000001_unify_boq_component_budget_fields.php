<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('unit_rate', 10, 2)->nullable()->after('quantity_factor');
            $table->decimal('total_cost', 15, 2)->nullable()->after('unit_rate');
        });

        DB::statement('UPDATE boq_item_components SET unit_rate = COALESCE(client_unit_rate, 0) + COALESCE(altapil_unit_rate, 0)');
        DB::statement('UPDATE boq_item_components SET total_cost = COALESCE(client_total_cost, 0) + COALESCE(altapil_total_cost, 0)');

        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('unit_rate', 10, 2)->default(0)->nullable(false)->change();
            $table->decimal('total_cost', 15, 2)->default(0)->nullable(false)->change();
            $table->dropColumn(['client_unit_rate', 'client_total_cost', 'altapil_unit_rate', 'altapil_total_cost']);
        });
    }

    public function down(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('client_unit_rate', 10, 2)->nullable()->after('quantity_factor');
            $table->decimal('client_total_cost', 15, 2)->nullable()->after('client_unit_rate');
            $table->decimal('altapil_unit_rate', 10, 2)->default(0)->after('client_total_cost');
            $table->decimal('altapil_total_cost', 15, 2)->default(0)->after('altapil_unit_rate');
        });

        DB::statement('UPDATE boq_item_components SET client_unit_rate = COALESCE(unit_rate, 0), client_total_cost = COALESCE(total_cost, 0), altapil_unit_rate = 0, altapil_total_cost = 0');

        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->dropColumn(['unit_rate', 'total_cost']);
        });
    }
};
