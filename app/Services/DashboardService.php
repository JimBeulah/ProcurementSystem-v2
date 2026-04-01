<?php

namespace App\Services;

use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getAdminDashboardStats(): array
    {
        $ordersByStatus = PurchaseOrder::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        $months = collect(range(5, 0))->map(function ($i) {
            return Carbon::now()->subMonths($i);
        });

        $spendAnalysis = $months->map(function ($date) {
            $monthName = $date->format('M');
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            // Total budget of projects created in this month
            $budget = Project::whereBetween('created_at', [$startOfMonth, $endOfMonth])->sum('budget') ?: 0;
            
            // Total spend of approved or delivered POs in this month
            $spend = PurchaseOrder::whereIn('status', ['APPROVED', 'DELIVERED', 'PARTIALLY DELIVERED'])
                ->whereBetween('order_date', [$startOfMonth, $endOfMonth])
                ->sum('total_amount') ?: 0;

            return [
                'month' => $monthName,
                'budget' => (float)$budget,
                'spend' => (float)$spend,
                'profit' => (float)($budget - $spend),
            ];
        })->toArray();

        return [
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'alerts' => PurchaseOrder::where('status', 'DECLINED')->count(),
            'totalUsers' => User::count(),
            'pendingPRs' => \App\Models\PurchaseRequest::where('status', 'PENDING')->count(),
            'totalInvoices' => \App\Models\SupplierInvoice::count(),
            'ordersByStatus' => $ordersByStatus,
            'spendAnalysis' => $spendAnalysis,
        ];
    }

    public function getProjectManagerDashboardStats(): array
    {
        $months = collect(range(5, 0))->map(function ($i) {
            return Carbon::now()->subMonths($i);
        });

        $materialRequestsOverTime = $months->map(function ($date) {
            return [
                'name' => $date->format('M'),
                'requests' => \App\Models\MaterialRequest::whereBetween('created_at', [
                    $date->copy()->startOfMonth(),
                    $date->copy()->endOfMonth()
                ])->count()
            ];
        })->toArray();

        $spendAnalysis = $months->map(function ($date) {
            $monthName = $date->format('M');
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            $budget = Project::whereBetween('created_at', [$startOfMonth, $endOfMonth])->sum('budget') ?: 0;
            $spend = PurchaseOrder::whereIn('status', ['APPROVED', 'DELIVERED', 'PARTIALLY DELIVERED'])
                ->whereBetween('order_date', [$startOfMonth, $endOfMonth])
                ->sum('total_amount') ?: 0;

            return [
                'month' => $monthName,
                'budget' => (float)$budget,
                'spend' => (float)$spend,
                'profit' => (float)($budget - $spend),
            ];
        })->toArray();

        return [
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'pendingMRs' => \App\Models\MaterialRequest::where('status', 'PENDING')->count(),
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'approvedThisMonth' => \App\Models\MaterialRequest::where('status', 'APPROVED')
                ->whereMonth('updated_at', now()->month)->count(),
            'materialRequestsOverTime' => $materialRequestsOverTime,
            'spendAnalysis' => $spendAnalysis,
        ];
    }

    public function getProcurementOfficerDashboardStats(): array
    {
        return [
            'pendingPRs' => \App\Models\PurchaseRequest::where('status', 'PENDING')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'deliveredOrders' => PurchaseOrder::where('status', 'DELIVERED')->count(),
        ];
    }

    public function getWarehouseDashboardStats(): array
    {
        return [
            'inventoryItems' => \App\Models\InventoryItem::count(),
            'pendingReceiving' => \App\Models\PurchaseOrder::whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED'])->count(),
            'pendingReturns' => \App\Models\MaterialReturn::where('status', 'PENDING')->count(),
            'siteReleases' => \App\Models\SiteRelease::count(),
        ];
    }

    public function getFinanceDashboardStats(): array
    {
        return [
            'pendingInvoices' => \App\Models\SupplierInvoice::where('status', 'PENDING')->count(),
            'pendingDisbursements' => \App\Models\Disbursement::where('status', 'PENDING')->count(),
            'totalInvoicedAmount' => (float)\App\Models\SupplierInvoice::sum('total_amount'),
            'reportsCount' => \App\Models\FinancialTransaction::count(),
        ];
    }

    public function getSiteEngineerDashboardStats(User $user): array
    {
        $projectIds = Project::where('site_engineer_id', $user->id)->pluck('id');

        $pendingSiteReleases = \App\Models\SiteRelease::whereIn('status', ['IN_TRANSIT', 'PENDING'])->count();
        $pendingPOs = PurchaseOrder::whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED'])
            ->whereIn('project_id', $projectIds)
            ->count();

        return [
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'myMRs' => \App\Models\MaterialRequest::where('requester_id', $user->id)->count(),
            'pendingMRs' => \App\Models\MaterialRequest::where('requester_id', $user->id)->where('status', 'PENDING')->count(),
            'pendingSiteReleases' => $pendingSiteReleases + $pendingPOs,
        ];
    }

    public function getGenericDashboardStats(): array
    {
        return [
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'alerts' => PurchaseOrder::where('status', 'DECLINED')->count(),
        ];
    }
}
