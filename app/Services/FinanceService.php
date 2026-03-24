<?php

namespace App\Services;

use App\Models\Disbursement;
use App\Models\SupplierInvoice;
use Illuminate\Support\Facades\Auth;

class FinanceService
{
    /**
     * Record a supplier invoice.
     */
    public function recordInvoice(array $validated): SupplierInvoice
    {
        return SupplierInvoice::create(array_merge($validated, [
            'invoice_date' => now(),
            'status' => 'PENDING',
            'recorded_by_id' => Auth::id(),
        ]));
    }

    /**
     * Process a disbursement/payment.
     */
    public function processDisbursement(array $validated): Disbursement
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            // Check overpayment risk against Purchase Order
            if (! empty($validated['purchase_order_id'])) {
                $po = \App\Models\PurchaseOrder::find($validated['purchase_order_id']);
                if ($po) {
                    if ($po->status !== 'APPROVED') {
                        throw new \Exception('Disbursement cannot be processed. Purchase Order must be APPROVED.');
                    }

                    $existingDisbursed = \App\Models\Disbursement::where('purchase_order_id', $po->id)
                        ->where('status', '!=', 'CANCELLED')
                        ->sum('amount');
                    if (($existingDisbursed + $validated['amount']) > $po->total_amount) {
                        throw new \Exception('Disbursement amount exceeds Purchase Order total amount.');
                    }
                }
            }

            $disbursement = Disbursement::create(array_merge($validated, [
                'payment_date' => now(),
                'status' => 'RELEASED',
                'processed_by_id' => Auth::id(),
            ]));

            // Record Financial Transaction (Ledger)
            $projectId = null;
            if ($disbursement->purchase_order_id && $disbursement->purchaseOrder) {
                $projectId = $disbursement->purchaseOrder->project_id;
            }

            \App\Models\FinancialTransaction::create([
                'project_id' => $projectId,
                'date' => now(),
                'type' => 'DISBURSEMENT',
                'category' => 'PAYABLE',
                'description' => 'Disbursement released for PO: '.$disbursement->purchase_order_id,
                'amount' => $disbursement->amount,
                'reference' => 'DISB-'.$disbursement->id,
                'metadata' => [
                    'disbursement_id' => $disbursement->id,
                    'purchase_order_id' => $disbursement->purchase_order_id,
                ],
            ]);

            return $disbursement;
        });
    }

    /**
     * Liquidate a disbursement with receipt details.
     */
    public function liquidateDisbursement(Disbursement $disbursement, array $data): void
    {
        // Prevent Double Liquidation
        if ($disbursement->is_liquidated) {
            throw new \Exception('Already liquidated');
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($disbursement, $data) {
            $actualAmount = $data['actual_amount'] ?? $disbursement->amount;

            $disbursement->update(array_merge($data, [
                'actual_amount' => $actualAmount,
                'is_liquidated' => true,
                'liquidated_at' => now(),
                'status' => 'LIQUIDATED',
            ]));

            $change = $disbursement->amount - $actualAmount;

            // Automatically record an invoice for audit and reporting
            if ($disbursement->purchase_order_id) {
                $po = $disbursement->purchaseOrder;
                if ($po && $po->supplier_id) {
                    SupplierInvoice::create([
                        'invoice_number' => $data['receipt_number'],
                        'invoice_date' => $data['receipt_date'],
                        'supplier_id' => $po->supplier_id,
                        'purchase_order_id' => $po->id,
                        'total_amount' => $actualAmount,
                        'status' => 'PENDING',
                        'recorded_by_id' => Auth::id(),
                    ]);
                }
            }

            // Record change returned into Ledger if actual spend was less than disbursed
            if ($change > 0) {
                $projectId = null;
                if ($disbursement->purchase_order_id && $disbursement->purchaseOrder) {
                    $projectId = $disbursement->purchaseOrder->project_id;
                }

                \App\Models\FinancialTransaction::create([
                    'project_id' => $projectId,
                    'date' => now(),
                    'type' => 'REFUND',
                    'category' => 'LIQUIDATION_RETURN',
                    'description' => 'Change returned from disbursement liquidation (DISB-'.$disbursement->id.')',
                    'amount' => $change,
                    'reference' => 'DISB-REF-'.$disbursement->id,
                    'metadata' => [
                        'disbursement_id' => $disbursement->id,
                        'purchase_order_id' => $disbursement->purchase_order_id,
                    ],
                ]);
            }
        });
    }

    /**
     * Mark an invoice as validated (matched).
     */
    public function validateInvoice(SupplierInvoice $invoice): void
    {
        $invoice->update(['status' => 'MATCHED']);
    }
}
