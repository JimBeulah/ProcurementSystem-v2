<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_releases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('released_by_id')->constrained('users');
            $table->string('issued_to');
            $table->decimal('quantity_released', 10, 2);
            $table->string('unit');
            $table->text('purpose')->nullable();
            $table->timestamp('release_date')->useCurrent();
            $table->enum('status', ['IN_TRANSIT', 'RECEIVED'])->default('IN_TRANSIT');
            $table->foreignId('received_by_id')->nullable()->constrained('users');
            $table->timestamp('received_date')->nullable();
            $table->decimal('quantity_received', 10, 2)->nullable();
            $table->text('receipt_remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_releases');
    }
};
