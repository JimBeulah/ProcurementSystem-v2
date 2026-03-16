<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\Project;
use App\Models\SupplierInvoice;
use Illuminate\Http\Request;
use App\Services\ReportService;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    protected $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }
    public function invoices(): Response
    {
        $invoices = SupplierInvoice::with(['supplier', 'purchaseOrder'])
            ->orderBy('created_at', 'desc')
            ->get();

        $suppliers = \App\Models\Supplier::orderBy('name')->get();
        $orders = \App\Models\PurchaseOrder::with('supplier')->get();
        $grns = \App\Models\ReceivingReport::with('purchaseOrder')->get();

        return Inertia::render('Finance/Invoices/Index', [
            'invoices' => $invoices,
            'suppliers' => $suppliers,
            'orders' => $orders,
            'grns' => $grns,
        ]);
    }

    public function disbursements(): Response
    {
        $payments = Disbursement::with(['purchaseOrder.supplier', 'receivedBy'])
            ->orderBy('payment_date', 'desc')
            ->get();

        $orders = \App\Models\PurchaseOrder::with('supplier')
            ->where('status', 'APPROVED')
            ->get();

        $users = \App\Models\User::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Finance/Disbursements/Index', [
            'payments' => $payments,
            'orders' => $orders,
            'users' => $users,
        ]);
    }

    public function reports(Request $request): Response
    {
        $projectId = $request->input('project_id');

        return Inertia::render('Finance/Reports/Index', [
            'data' => $this->reportService->getFinancialReportsData($projectId),
            'projects' => $this->reportService->getProjectsList(),
            'filters' => [
                'project_id' => $projectId,
            ],
        ]);
    }
}
