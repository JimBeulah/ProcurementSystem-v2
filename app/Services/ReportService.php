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

        // 1. Operating Revenue
        $extraIncome = FinancialTransaction::where('project_id', $projectId)->where('type', 'INCOME')->sum('amount');
        $operatingRevenue = $budget + (float) $extraIncome;

        // 2. Cost of Goods Sold (Direct Costs)
        // Committed POs are usually direct costs (Materials/Subcontractors)
        $committedDirectCosts = (float) $project->purchaseOrders->sum('total_amount');
        // We'll treat other direct expenses from FinancialTransaction if they exist (need category check)
        $extraDirectCosts = FinancialTransaction::where('project_id', $projectId)
            ->where('type', 'EXPENSE')
            ->whereIn('category', ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR'])
            ->sum('amount');

        $cogs = $committedDirectCosts + (float) $extraDirectCosts;

        // 3. Gross Profit
        $grossProfit = $operatingRevenue - $cogs;

        // 4. Operating Expenses (Indirect Costs / Overhead)
        $operatingExpenses = FinancialTransaction::where('project_id', $projectId)
            ->where('type', 'EXPENSE')
            ->whereNotIn('category', ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR'])
            ->sum('amount');

        // 5. Net Income
        $netIncome = $grossProfit - (float) $operatingExpenses;

        // Paid amounts for cash flow tracking
        $totalPaid = Disbursement::whereIn('purchase_order_id', $project->purchaseOrders->pluck('id'))->sum('amount');

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
                    'other_income' => (float) $extraIncome,
                    'total_operating_revenue' => $operatingRevenue,
                ],
                'cogs' => [
                    'committed_pos' => $committedDirectCosts,
                    'other_direct_costs' => (float) $extraDirectCosts,
                    'total_cogs' => $cogs,
                ],
                'gross_profit' => [
                    'amount' => $grossProfit,
                    'margin' => $operatingRevenue > 0 ? ($grossProfit / $operatingRevenue) * 100 : 0,
                ],
                'operating_expenses' => [
                    'total' => (float) $operatingExpenses,
                ],
                'net_income' => [
                    'amount' => $netIncome,
                    'margin' => $operatingRevenue > 0 ? ($netIncome / $operatingRevenue) * 100 : 0,
                ],
            ],
            // Keep legacy keys for backward compatibility if needed, using the new structure
            'revenue' => [
                'budget' => $budget,
                'extra' => (float) $extraIncome,
                'total' => (float) $operatingRevenue,
            ],
            'expenses' => [
                'committed' => $committedDirectCosts,
                'extra' => (float) ($extraDirectCosts + $operatingExpenses),
                'total' => (float) ($cogs + $operatingExpenses),
                'paid' => (float) $totalPaid,
            ],
            'profit_loss' => [
                'amount' => (float) $netIncome,
                'margin' => $operatingRevenue > 0 ? ($netIncome / $operatingRevenue) * 100 : 0,
            ],
            'purchase_orders' => $project->purchaseOrders->map(function ($po) {
                return [
                    'id' => $po->id,
                    'ref' => $po->id,
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
