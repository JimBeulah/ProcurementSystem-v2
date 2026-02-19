<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->timestamp('request_date')->useCurrent();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('requester_id')->constrained('users');
            $table->foreignId('approver_id')->nullable()->constrained('users');
            $table->enum('status', ['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED'])->default('PENDING');
            $table->text('purpose')->nullable();
            $table->text('remarks')->nullable();
            $table->decimal('total_estimated_cost', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained('purchase_requests')->cascadeOnDelete();
            $table->string('item_description');
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
            $table->decimal('estimated_unit_cost', 10, 2)->default(0);
            $table->decimal('estimated_total_cost', 10, 2)->default(0);
            $table->text('remarks')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
        Schema::dropIfExists('purchase_requests');
    }
};
