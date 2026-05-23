<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('quantity_factor', 10, 4)->nullable()->change();
            $table->decimal('client_unit_rate', 10, 2)->nullable()->change();
            $table->decimal('client_total_cost', 15, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('boq_item_components', function (Blueprint $table) {
            $table->decimal('quantity_factor', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('client_unit_rate', 10, 2)->nullable(false)->default(0)->change();
            $table->decimal('client_total_cost', 15, 2)->nullable(false)->default(0)->change();
        });
    }
};
