<?php

namespace App\Services;

use App\Enums\PurchaseOrderStatus;
use App\Models\Disbursement;
use App\Models\FinancialTransaction;
use App\Models\PurchaseOrder;
use App\Models\SupplierInvoice;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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
        return DB::transaction(function () use ($validated) {
            // Check overpayment risk against Purchase Order
            if (! empty($validated['purchase_order_id'])) {
                $po = PurchaseOrder::find($validated['purchase_order_id']);
                if ($po) {
                    if (! in_array($po->status, [PurchaseOrderStatus::APPROVED, PurchaseOrderStatus::PARTIALLY_DELIVERED, PurchaseOrderStatus::COMPLETED])) {
                        throw new \Exception('Disbursement cannot be processed. Purchase Order must be APPROVED, PARTIALLY DELIVERED, or COMPLETED.');
                    }

                    $existingDisbursed = Disbursement::where('purchase_order_id', $po->id)
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

            FinancialTransaction::create([
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
            \Log::warning("Attempted to liquidate already liquidated disbursement ID: {$disbursement->id}");
            throw new \Exception('Already liquidated');
        }

        try {
            DB::transaction(function () use ($disbursement, $data) {
                $actualAmount = $data['actual_amount'] ?? $disbursement->amount;

                $disbursement->update(array_merge($data, [
                    'actual_amount' => $actualAmount,
                    'is_liquidated' => true,
                    'liquidated_at' => now(),
                    'status' => 'LIQUIDATED',
                ]));

                $change = $disbursement->amount - $actualAmount;

                // Record change returned into Ledger if actual spend was less than disbursed
                if ($change > 0) {
                    $projectId = null;
                    if ($disbursement->purchase_order_id && $disbursement->purchaseOrder) {
                        $projectId = $disbursement->purchaseOrder->project_id;
                    }

                    FinancialTransaction::create([
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
        } catch (\Exception $e) {
            \Log::error("Liquidation failed for disbursement ID: {$disbursement->id}. Error: ".$e->getMessage());
            throw $e;
        }
    }

    /**
     * Mark an invoice as validated (matched).
     */
    public function validateInvoice(SupplierInvoice $invoice): void
    {
        $invoice->update(['status' => 'MATCHED']);
    }
}
