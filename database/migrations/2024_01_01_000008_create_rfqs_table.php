<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rfqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mr_id')->nullable()->constrained('material_requests');
            $table->foreignId('created_by_id')->constrained('users');
            $table->string('title');
            $table->enum('status', ['OPEN', 'CLOSED', 'AWARDED'])->default('OPEN');
            $table->timestamp('due_date')->nullable();
            $table->timestamps();
        });

        Schema::create('rfq_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained('rfqs');
            $table->string('material_name');
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
        });

        Schema::create('supplier_quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained('rfqs');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->timestamp('quote_date')->useCurrent();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('currency')->default('PHP');
            $table->boolean('is_selected')->default(false);
        });

        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_quotation_id')->constrained('supplier_quotations');
            $table->string('material_name');
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->text('remarks')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
        Schema::dropIfExists('supplier_quotations');
        Schema::dropIfExists('rfq_items');
        Schema::dropIfExists('rfqs');
    }
};
