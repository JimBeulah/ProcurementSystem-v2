<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('receiving_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders');
            $table->foreignId('received_by_id')->constrained('users');
            $table->timestamp('received_date')->useCurrent();
            $table->string('delivery_note_no')->nullable();
            $table->text('notes')->nullable();
        });

        Schema::create('receiving_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receiving_report_id')->constrained('receiving_reports');
            $table->string('material_name');
            $table->decimal('quantity_received', 10, 2);
            $table->string('status')->default('GOOD');
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('material_name');
            $table->foreignId('project_id')->nullable()->constrained('projects')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses');
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
            $table->timestamp('last_updated')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('receiving_items');
        Schema::dropIfExists('receiving_reports');
    }
};
