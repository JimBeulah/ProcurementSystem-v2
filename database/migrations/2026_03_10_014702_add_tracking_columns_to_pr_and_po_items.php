<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->decimal('ordered_quantity', 10, 2)->default(0)->after('quantity');
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->foreignId('purchase_request_item_id')->nullable()->after('purchase_order_id')->constrained('purchase_request_items')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropForeign(['purchase_request_item_id']);
            $table->dropColumn('purchase_request_item_id');
        });

        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->dropColumn('ordered_quantity');
        });
    }
};
