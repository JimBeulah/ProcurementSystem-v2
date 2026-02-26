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
        return Disbursement::create(array_merge($validated, [
            'payment_date' => now(),
            'status' => 'COMPLETED',
            'processed_by_id' => Auth::id(),
        ]));
    }
}
