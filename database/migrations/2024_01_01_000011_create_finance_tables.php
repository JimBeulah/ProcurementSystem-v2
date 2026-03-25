<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->timestamp('invoice_date');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders');
            $table->foreignId('receiving_report_id')->nullable()->constrained('receiving_reports');
            $table->foreignId('recorded_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('total_amount', 15, 2);
            $table->string('status')->default('PENDING')->index();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('disbursements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders');
            $table->foreignId('processed_by_id')->constrained('users');
            $table->decimal('amount', 15, 2);
            $table->decimal('actual_amount', 15, 2)->nullable();
            $table->timestamp('payment_date')->useCurrent();
            $table->enum('method', ['CASH', 'CHECK', 'ONLINE']);
            $table->string('reference_number')->nullable();
            $table->string('status')->default('RELEASED')->index();
            $table->foreignId('received_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_liquidated')->default(false);
            $table->timestamp('liquidated_at')->nullable();
            $table->string('receipt_number')->nullable();
            $table->date('receipt_date')->nullable();
            $table->string('receipt_path')->nullable();
            $table->text('liquidation_remarks')->nullable();
        });

        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained('projects')->cascadeOnDelete();
            $table->timestamp('date')->useCurrent();
            $table->string('type');
            $table->string('category');
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('reference')->nullable();
            $table->json('metadata')->nullable();
        });

        Schema::create('workflow_rules', function (Blueprint $table) {
            $table->id();
            $table->string('process_type');
            $table->decimal('min_amount', 15, 2)->default(0);
            $table->decimal('max_amount', 15, 2)->nullable();
            $table->enum('approver_role', [
                'ADMIN',
                'PROJECT_MANAGER',
                'PROCUREMENT_OFFICER',
                'ENGINEER',
                'FINANCE',
                'AUDITOR',
                'HEAD_OF_ADMIN',
                'ENCODER',
                'PURCHASER',
                'APPROVER',
                'CASH_DISBURSEMENT',
                'WAREHOUSE',
                'SITE_ENGINEER',
            ]);
            $table->integer('step_order')->default(1);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_rules');
        Schema::dropIfExists('financial_transactions');
        Schema::dropIfExists('disbursements');
        Schema::dropIfExists('supplier_invoices');
    }
};
