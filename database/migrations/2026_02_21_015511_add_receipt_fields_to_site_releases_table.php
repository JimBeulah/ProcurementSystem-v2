<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_releases', function (Blueprint $table) {
            $table->enum('status', ['IN_TRANSIT', 'RECEIVED'])->default('IN_TRANSIT')->after('release_date');
            $table->foreignId('received_by_id')->nullable()->constrained('users')->after('status');
            $table->timestamp('received_date')->nullable()->after('received_by_id');
            $table->decimal('quantity_received', 10, 2)->nullable()->after('received_date');
            $table->text('receipt_remarks')->nullable()->after('quantity_received');
        });
    }

    public function down(): void
    {
        Schema::table('site_releases', function (Blueprint $table) {
            $table->dropForeign(['received_by_id']);
            $table->dropColumn(['status', 'received_by_id', 'received_date', 'quantity_received', 'receipt_remarks']);
        });
    }
};
