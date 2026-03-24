<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('name');
            $table->string('location')->nullable();
            $table->string('duration')->nullable();
            $table->decimal('budget', 15, 2);
            $table->string('status')->default('PLANNING');
            $table->decimal('total_floor_area', 10, 2)->nullable();
            $table->decimal('carport_area', 10, 2)->nullable();
            $table->decimal('appropriation', 15, 2)->nullable();
            $table->string('source_of_fund')->nullable();
            $table->string('contract_id')->nullable();
            $table->string('project_component_id')->nullable();
            $table->decimal('net_length', 10, 2)->nullable();
            $table->string('project_type')->default('BUILDING');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
