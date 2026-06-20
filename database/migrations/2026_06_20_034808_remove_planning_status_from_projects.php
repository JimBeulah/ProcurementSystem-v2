<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('projects')->where('status', 'PLANNING')->update(['status' => 'ACTIVE']);

        Schema::table('projects', function (Blueprint $table) {
            $table->string('status')->default('ACTIVE')->change();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('status')->default('PLANNING')->change();
        });
    }
};
