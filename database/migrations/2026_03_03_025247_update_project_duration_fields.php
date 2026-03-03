<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('duration');
            $table->date('target_start_date')->nullable();
            $table->date('target_end_date')->nullable();
            $table->integer('duration_days')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('duration')->nullable();
            $table->dropColumn(['target_start_date', 'target_end_date', 'duration_days']);
        });
    }
};
