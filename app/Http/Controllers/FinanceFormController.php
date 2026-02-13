<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\Supplier;
use App\Models\SupplierInvoice;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinanceFormController extends Controller
{
    public function createInvoice()
    {
        $suppliers = Supplier::orderBy('name')->get();
        $orders = PurchaseOrder::with('supplier')->get();
        $grns = ReceivingReport::with('purchaseOrder')->get();

        return Inertia::render('Finance/Invoices/Create', [
            'suppliers' => $suppliers,
            'orders' => $orders,
            'grns' => $grns,
        ]);
    }

    public function storeInvoice(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string',
            'supplier_id' => 'required|integer',
            'purchase_order_id' => 'nullable|integer',
            'receiving_report_id' => 'nullable|integer',
            'total_amount' => 'required|numeric|min:0',
        ]);

        SupplierInvoice::create(array_merge($validated, [
            'invoice_date' => now(),
            'status' => 'PENDING',
            'recorded_by_id' => auth()->id(),
        ]));

        return redirect()->route('finance.invoices')->with('success', 'Invoice recorded.');
    }

    public function createDisbursement()
    {
        $orders = PurchaseOrder::with('supplier')
            ->where('status', 'APPROVED')
            ->get();

        return Inertia::render('Finance/Disbursements/Create', ['orders' => $orders]);
    }

    public function storeDisbursement(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_id' => 'nullable|integer',
            'amount' => 'required|numeric|min:0',
            'method' => 'required|string',
            'reference_number' => 'required|string',
        ]);

        Disbursement::create(array_merge($validated, [
            'payment_date' => now(),
            'status' => 'COMPLETED',
            'processed_by_id' => auth()->id(),
        ]));

        return redirect()->route('finance.disbursements')->with('success', 'Payment processed.');
    }
}
