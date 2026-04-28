<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\Supplier;
use App\Models\SupplierInvoice;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Http\Request;
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

        $suppliers = Supplier::orderBy('name')->get();
        $orders = PurchaseOrder::with('supplier')
            ->whereDoesntHave('invoices')
            ->get();
        $grns = ReceivingReport::with('purchaseOrder')->get();

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

        $orders = PurchaseOrder::with('supplier')
            ->where('status', 'APPROVED')
            ->whereDoesntHave('disbursements')
            ->get();

        $users = User::where('role', 'procurement_officer')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

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

    public function print(Request $request)
    {
        $projectId = $request->input('project_id');

        if ($projectId) {
            $project = \App\Models\Project::findOrFail($projectId);
            $this->authorize('view', $project);
        } else {
            $this->authorize('view financial reports');
        }

        $pdf = $this->reportService->generatePdf($projectId);
        $filename = $projectId ? 'Project-Report-'.$projectId : 'Aggregate-Finance-Report';

        return $pdf->stream($filename.'.pdf');
    }
}
