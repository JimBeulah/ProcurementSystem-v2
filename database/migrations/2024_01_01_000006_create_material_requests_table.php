<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('requester_id')->constrained('users');
            $table->foreignId('approver_id')->nullable()->constrained('users');
            $table->timestamp('request_date')->useCurrent();
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_FULFILLED', 'FULFILLED'])->default('PENDING');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('material_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_request_id')->constrained('material_requests');
            $table->string('item_description');
            $table->string('description')->nullable();
            $table->decimal('quantity', 10, 2);
            $table->decimal('material_unit_price', 10, 2)->default(0);
            $table->decimal('labor_unit_price', 10, 2)->default(0);
            $table->string('unit');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_request_items');
        Schema::dropIfExists('material_requests');
    }
};
