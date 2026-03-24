<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('initiated_by_id')->constrained('users');
            $table->foreignId('approved_by_id')->nullable()->constrained('users');
            $table->enum('status', ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RETURNED', 'CANCELLED'])->default('DRAFT');
            $table->text('reason')->nullable(); // e.g. "Wrong item delivered", "Damaged"
            $table->text('remarks')->nullable();
            $table->string('return_reference')->nullable(); // Vendor's RMA/Return number
            $table->date('returned_date')->nullable();
            $table->timestamps();
        });

        Schema::create('supplier_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_return_id')->constrained('supplier_returns')->cascadeOnDelete();
            $table->foreignId('purchase_order_item_id')->nullable()->constrained('purchase_order_items')->nullOnDelete();
            $table->string('material_name');
            $table->string('unit');
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_return_items');
        Schema::dropIfExists('supplier_returns');
    }
};
