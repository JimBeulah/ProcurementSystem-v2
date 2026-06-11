<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boq_items', function (Blueprint $table) {
            $table->enum('nature', ['DIRECT_MATERIAL', 'SERVICE', 'BUNDLE'])
                  ->default('BUNDLE')
                  ->after('is_carport');
        });
    }

    public function down(): void
    {
        Schema::table('boq_items', function (Blueprint $table) {
            $table->dropColumn('nature');
        });
    }
};
