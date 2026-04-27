<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDisbursementRequest;
use App\Http\Requests\StoreInvoiceRequest;
use App\Models\Disbursement;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\Supplier;
use App\Models\SupplierInvoice;
use App\Models\User;
use App\Services\FinanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceFormController extends Controller
{
    public function __construct(
        protected FinanceService $service
    ) {}

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

        $users = User::where('is_active', true)->orderBy('name')->get();

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

    public function liquidate(Request $request, Disbursement $disbursement): RedirectResponse
    {
        $validated = $request->validate([
            'actual_amount' => 'required|numeric|min:0',
            'receipt_number' => 'required|string|max:255',
            'receipt_date' => 'required|date',
            'receipt_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'receipt_url' => 'nullable|string',
            'liquidation_remarks' => 'nullable|string|max:1000',
        ]);

        if ($request->hasFile('receipt_file')) {
            $path = $request->file('receipt_file')->store('receipts', 'public');
            $validated['receipt_path'] = $path;
        } elseif (!empty($validated['receipt_url'])) {
            $validated['receipt_path'] = $validated['receipt_url'];
        }

        unset($validated['receipt_file'], $validated['receipt_url']);

        try {
            $this->service->liquidateDisbursement($disbursement, $validated);

            return redirect()->back()->with('success', 'Disbursement liquidated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function validateInvoice(SupplierInvoice $invoice): RedirectResponse
    {
        try {
            $this->service->validateInvoice($invoice);

            return redirect()->back()->with('success', 'Invoice validated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
