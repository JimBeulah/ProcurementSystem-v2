<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->timestamp('order_date')->useCurrent();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
            $table->foreignId('requester_id')->constrained('users');
            $table->foreignId('approver_id')->nullable()->constrained('users');
            $table->enum('status', ['PENDING', 'APPROVED', 'DECLINED', 'COMPLETED', 'CANCELLED'])->default('PENDING');
            $table->text('remarks')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders');
            $table->string('material_name');
            $table->string('description')->nullable();
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
    }
};
