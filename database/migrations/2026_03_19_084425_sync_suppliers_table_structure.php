<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            if (! Schema::hasColumn('suppliers', 'contact_person')) {
                $table->string('contact_person')->nullable()->after('name');
            }
            if (! Schema::hasColumn('suppliers', 'email')) {
                $table->string('email')->nullable()->after('contact_person');
            }
            if (! Schema::hasColumn('suppliers', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (! Schema::hasColumn('suppliers', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('address');
            }
            if (Schema::hasColumn('suppliers', 'rating')) {
                $table->dropColumn('rating');
            }
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            if (! Schema::hasColumn('suppliers', 'rating')) {
                $table->integer('rating')->nullable()->after('address');
            }
            // We keep the added columns for now as they are in the original migration
        });
    }
};
