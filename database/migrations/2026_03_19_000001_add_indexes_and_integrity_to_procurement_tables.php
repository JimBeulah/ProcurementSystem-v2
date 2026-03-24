<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('material_requests', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('supplier_invoices', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('disbursements', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->unique(['project_id', 'warehouse_id', 'material_name'], 'inventory_items_unique');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropUnique('inventory_items_unique');
        });

        Schema::table('disbursements', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('supplier_invoices', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('material_requests', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
    }
};
