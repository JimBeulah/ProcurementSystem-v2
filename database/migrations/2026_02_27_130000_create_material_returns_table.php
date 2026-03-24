<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->nullable()->constrained('inventory_items')->nullOnDelete();
            $table->foreignId('returned_by_id')->constrained('users');
            $table->foreignId('received_by_id')->nullable()->constrained('users');
            $table->string('material_name');
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
            $table->text('remarks')->nullable();
            $table->enum('status', ['PENDING', 'RECEIVED'])->default('PENDING');
            $table->timestamp('received_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_returns');
    }
};
