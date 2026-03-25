<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boq_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('item_description');
            $table->string('unit');
            $table->decimal('material_unit_price', 10, 2);
            $table->decimal('labor_unit_price', 10, 2)->default(0);
            $table->decimal('quantity', 10, 2);
            $table->boolean('is_carport')->default(false);

            $table->unique(['project_id', 'item_description']);
        });

        Schema::create('boq_item_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boq_item_id')->constrained('boq_items')->cascadeOnDelete();
            $table->enum('resource_type', ['MATERIAL', 'LABOR', 'EQUIPMENT']);
            $table->string('name');
            $table->string('unit')->nullable();
            $table->decimal('quantity_factor', 10, 4);
            $table->decimal('unit_rate', 10, 2);
            $table->decimal('altapil_unit_rate', 10, 2)->default(0);
            $table->decimal('total_component_cost', 15, 2);
            $table->decimal('altapil_total_cost', 15, 2)->default(0);
            $table->decimal('no_of_persons', 10, 2)->nullable();
            $table->decimal('hours', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boq_item_components');
        Schema::dropIfExists('boq_items');
    }
};
