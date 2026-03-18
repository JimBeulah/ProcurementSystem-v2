<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDisbursementRequest;
use App\Http\Requests\StoreInvoiceRequest;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\Supplier;
use App\Services\FinanceService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FinanceFormController extends Controller
{
    public function __construct(
        protected FinanceService $service
    ) {
    }

    public function createInvoice(): Response
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

    public function storeInvoice(StoreInvoiceRequest $request): RedirectResponse
    {
        try {
            $this->service->recordInvoice($request->validated());
            return redirect()->route('finance.invoices')->with('success', 'Invoice recorded.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage())->withInput();
        }
    }

    public function createDisbursement(): Response
    {
        $orders = PurchaseOrder::with('supplier')
            ->where('status', 'APPROVED')
            ->get();

        $users = \App\Models\User::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Finance/Disbursements/Create', [
            'orders' => $orders,
            'users' => $users,
        ]);
    }

    public function storeDisbursement(StoreDisbursementRequest $request): RedirectResponse
    {
        try {
            $this->service->processDisbursement($request->validated());
            return redirect()->route('finance.disbursements')->with('success', 'Payment processed.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage())->withInput();
        }
    }

    public function liquidate(Request $request, \App\Models\Disbursement $disbursement): RedirectResponse
    {
        $validated = $request->validate([
            'actual_amount' => 'nullable|numeric|min:0',
            'receipt_number' => 'required|string|max:255',
            'receipt_date' => 'required|date',
            'liquidation_remarks' => 'nullable|string|max:1000',
        ]);

        try {
            $this->service->liquidateDisbursement($disbursement, $validated);
            return redirect()->back()->with('success', 'Disbursement liquidated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function validateInvoice(\App\Models\SupplierInvoice $invoice): RedirectResponse
    {
        try {
            $this->service->validateInvoice($invoice);
            return redirect()->back()->with('success', 'Invoice validated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
