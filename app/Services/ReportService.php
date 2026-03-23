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
     * Get aggregate data for all projects using DB-level aggregations.
     */
    protected function getAggregateReports(): array
    {
        $projects = Project::with('client')
            ->withSum('purchaseOrders as committed_amount', 'total_amount')
            ->withSum('disbursements as paid_amount', 'amount')
            ->withSum('invoices as invoiced_amount', 'total_amount')
            ->get();

        return $projects->map(function ($p) {
            $budget = (float) $p->budget;
            $committed = (float) $p->committed_amount;
            $invoiced = (float) $p->invoiced_amount;
            $paid = (float) $p->paid_amount;

            return [
                'id' => $p->id,
                'name' => $p->name,
                'clientName' => $p->client?->name ?? 'N/A',
                'budget' => $budget,
                'committed' => $committed,
                'invoiced' => $invoiced,
                'paid' => $paid,
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
        $project = Project::with(['client'])
            ->withSum('purchaseOrders as committed_direct_costs', 'total_amount')
            ->withSum('disbursements as total_paid', 'amount')
            ->findOrFail($projectId);

        $budget = (float) $project->budget;

        // DB level aggregation for financial transactions
        $transactions = FinancialTransaction::selectRaw("
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as extra_income,
            SUM(CASE WHEN type = 'EXPENSE' AND category IN ('MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR') THEN amount ELSE 0 END) as extra_direct_costs,
            SUM(CASE WHEN type = 'EXPENSE' AND category NOT IN ('MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR') THEN amount ELSE 0 END) as operating_expenses
        ")->where('project_id', $projectId)->first();

        $extraIncome = (float) ($transactions->extra_income ?? 0);
        $extraDirectCosts = (float) ($transactions->extra_direct_costs ?? 0);
        $operatingExpenses = (float) ($transactions->operating_expenses ?? 0);
        
        $committedDirectCosts = (float) $project->committed_direct_costs;
        $totalPaid = (float) $project->total_paid;

        // Derived calculations
        $operatingRevenue = $budget + $extraIncome;
        $cogs = $committedDirectCosts + $extraDirectCosts;
        $grossProfit = $operatingRevenue - $cogs;
        $netIncome = $grossProfit - $operatingExpenses;

        $boqBaselineCogs = (float) $project->total_altapil_budget;
        $variance = $committedDirectCosts - $boqBaselineCogs;

        // Fetch POs with their DB-aggregated paid amount
        $purchaseOrders = PurchaseOrder::where('project_id', $projectId)
            ->with('supplier')
            ->withSum('disbursements as amount_paid', 'amount')
            ->get()
            ->map(function ($po) {
                return [
                    'id' => $po->id,
                    'ref' => $po->id,
                    'supplier' => $po->supplier?->name ?? 'N/A',
                    'amount' => (float) $po->total_amount,
                    'paid' => (float) $po->amount_paid,
                    'status' => $po->status,
                ];
            });

        return [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'clientName' => $project->client?->name ?? 'N/A',
                'budget' => $budget,
            ],
            'income_statement' => [
                'revenue' => [
                    'contract_amount' => $budget,
                    'other_income' => $extraIncome,
                    'total_operating_revenue' => $operatingRevenue,
                ],
                'cogs' => [
                    'committed_pos' => $committedDirectCosts,
                    'boq_baseline' => $boqBaselineCogs,
                    'variance' => $variance,
                    'other_direct_costs' => $extraDirectCosts,
                    'total_cogs' => $cogs,
                ],
                'gross_profit' => [
                    'amount' => $grossProfit,
                    'margin' => $operatingRevenue > 0 ? ($grossProfit / $operatingRevenue) * 100 : 0,
                ],
                'operating_expenses' => [
                    'total' => $operatingExpenses,
                ],
                'net_income' => [
                    'amount' => $netIncome,
                    'margin' => $operatingRevenue > 0 ? ($netIncome / $operatingRevenue) * 100 : 0,
                ],
            ],
            // Keep legacy keys for backward compatibility
            'revenue' => [
                'budget' => $budget,
                'extra' => $extraIncome,
                'total' => $operatingRevenue,
            ],
            'expenses' => [
                'committed' => $committedDirectCosts,
                'extra' => $extraDirectCosts + $operatingExpenses,
                'total' => $cogs + $operatingExpenses,
                'paid' => $totalPaid,
            ],
            'profit_loss' => [
                'amount' => $netIncome,
                'margin' => $operatingRevenue > 0 ? ($netIncome / $operatingRevenue) * 100 : 0,
            ],
            'purchase_orders' => $purchaseOrders,
        ];
    }

    /**
     * Get list of all projects for selectors.
     */
    public function getProjectsList(): Collection
    {
        return Project::select('id', 'name')->orderBy('name')->get();
    }

    /**
     * Generate a PDF for the financial report.
     */
    public function generatePdf(?int $projectId = null)
    {
        $data = $this->getFinancialReportsData($projectId);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('print.finance-report', [
            'data' => $data,
            'isProjectView' => $projectId !== null,
        ]);

        // Secure the PDF: Enforce printing only
        $pdf->setEncryption('', config('app.key'), ['print']);

        return $pdf;
    }
}
