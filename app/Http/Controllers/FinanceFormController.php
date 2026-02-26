<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\Supplier;
use App\Models\SupplierInvoice;
use App\Services\FinanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinanceFormController extends Controller
{
    public function __construct(
        protected FinanceService $service
    ) {
    }

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

        $this->service->recordInvoice($validated);

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

        $this->service->processDisbursement($validated);

        return redirect()->route('finance.disbursements')->with('success', 'Payment processed.');
    }
}
