<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE purchase_requests MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'PARTIAL', 'COMPLETED', 'DECLINED', 'CANCELLED') DEFAULT 'PENDING'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE purchase_requests MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED') DEFAULT 'PENDING'");
    }
};
