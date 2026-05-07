<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            // Update receipt_path to text to handle long cloud URLs
            $table->text('receipt_path')->nullable()->change();
        });

        // Update method enum if on PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            // Drop old check constraint
            DB::statement('ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS disbursements_method_check');

            // Re-add with expanded options
            DB::statement("ALTER TABLE disbursements ADD CONSTRAINT disbursements_method_check CHECK (method IN ('CASH', 'CHECK', 'ONLINE', 'BANK_TRANSFER', 'GCASH'))");
        }
    }

    public function down(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            $table->string('receipt_path', 255)->nullable()->change();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS disbursements_method_check');
            DB::statement("ALTER TABLE disbursements ADD CONSTRAINT disbursements_method_check CHECK (method IN ('CASH', 'CHECK', 'ONLINE'))");
        }
    }
};
