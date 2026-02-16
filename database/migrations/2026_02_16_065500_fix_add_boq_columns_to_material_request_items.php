<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('material_request_items', function (Blueprint $table) {
            if (!Schema::hasColumn('material_request_items', 'boq_item_id')) {
                $table->foreignId('boq_item_id')->nullable()->constrained('boq_items')->onDelete('set null');
            }
            if (!Schema::hasColumn('material_request_items', 'boq_item_component_id')) {
                $table->foreignId('boq_item_component_id')->nullable()->constrained('boq_item_components')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('material_request_items', function (Blueprint $table) {
            if (Schema::hasColumn('material_request_items', 'boq_item_id')) {
                $table->dropForeign(['boq_item_id']);
                $table->dropColumn('boq_item_id');
            }
            if (Schema::hasColumn('material_request_items', 'boq_item_component_id')) {
                $table->dropForeign(['boq_item_component_id']);
                $table->dropColumn('boq_item_component_id');
            }
        });
    }
};
