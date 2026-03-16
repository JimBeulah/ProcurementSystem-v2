<?php
/**
 * Senior Laravel Engineer Principle: Move business logic into Services.
 */

namespace App\Services;

use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Disbursement;
use App\Models\FinancialTransaction;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * Get financial reports data.
     */
    public function getFinancialReportsData(?int $projectId = null): array
    {
        if ($projectId) {
            return $this->getProjectSpecificReport($projectId);
        }

        return $this->getAggregateReports();
    }

    /**
     * Get aggregate data for all projects.
     */
    protected function getAggregateReports(): array
    {
        $projects = Project::with(['client', 'purchaseOrders'])->get();

        return $projects->map(function ($p) {
            $budget = (float) $p->budget;
            $committed = $p->purchaseOrders->sum('total_amount');
            $paid = Disbursement::whereIn('purchase_order_id', $p->purchaseOrders->pluck('id'))->sum('amount');
            $invoiced = $p->purchaseOrders->flatMap->invoices->sum('total_amount');

            return [
                'id' => $p->id,
                'name' => $p->name,
                'clientName' => $p->client?->name ?? 'N/A',
                'budget' => $budget,
                'committed' => $committed,
                'invoiced' => $invoiced,
                'paid' => (float) $paid,
                'remaining' => $budget - $committed,
                'progress' => $budget > 0 ? ($committed / $budget) * 100 : 0,
            ];
        })->toArray();
    }

    /**
     * Get detailed Profit and Loss data for a specific project.
     */
    protected function getProjectSpecificReport(int $projectId): array
    {
        $project = Project::with(['client', 'purchaseOrders.invoices', 'purchaseOrders.disbursements'])->findOrFail($projectId);

        $budget = (float) $project->budget;

        // Income sources (FinancialTransactions of type INCOME + Project Budget as estimated revenue)
        $extraIncome = FinancialTransaction::where('project_id', $projectId)->where('type', 'INCOME')->sum('amount');
        $totalRevenue = $budget + $extraIncome;

        // Expenses (PO total + Extra Expenses)
        $committedExpenses = $project->purchaseOrders->sum('total_amount');
        $extraExpenses = FinancialTransaction::where('project_id', $projectId)->where('type', 'EXPENSE')->sum('amount');
        $totalExpenses = $committedExpenses + $extraExpenses;

        // Paid amounts
        $totalPaid = Disbursement::whereIn('purchase_order_id', $project->purchaseOrders->pluck('id'))->sum('amount');

        return [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'clientName' => $project->client?->name ?? 'N/A',
                'budget' => $budget,
            ],
            'revenue' => [
                'budget' => $budget,
                'extra' => (float) $extraIncome,
                'total' => (float) $totalRevenue,
            ],
            'expenses' => [
                'committed' => (float) $committedExpenses,
                'extra' => (float) $extraExpenses,
                'total' => (float) $totalExpenses,
                'paid' => (float) $totalPaid,
            ],
            'profit_loss' => [
                'amount' => (float) ($totalRevenue - $totalExpenses),
                'margin' => $totalRevenue > 0 ? (($totalRevenue - $totalExpenses) / $totalRevenue) * 100 : 0,
            ],
            // Breakdown for POs
            'purchase_orders' => $project->purchaseOrders->map(function ($po) {
                return [
                    'id' => $po->id,
                    'ref' => $po->id, // PO Number if exists
                    'supplier' => $po->supplier?->name ?? 'N/A',
                    'amount' => (float) $po->total_amount,
                    'paid' => (float) $po->disbursements->sum('amount'),
                    'status' => $po->status,
                ];
            }),
        ];
    }

    /**
     * Get list of all projects for selectors.
     */
    public function getProjectsList(): Collection
    {
        return Project::select('id', 'name')->orderBy('name')->get();
    }
}
