<?php

namespace App\Services;

use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\User;

class DashboardService
{
    public function getAdminDashboardStats(): array
    {
        $ordersByStatus = PurchaseOrder::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        $spendAnalysis = [
            ['month' => 'Sep', 'budget' => 1200000, 'spend' => 1100000, 'profit' => 100000],
            ['month' => 'Oct', 'budget' => 1200000, 'spend' => 1150000, 'profit' => 50000],
            ['month' => 'Nov', 'budget' => 1200000, 'spend' => 900000, 'profit' => 300000],
            ['month' => 'Dec', 'budget' => 1500000, 'spend' => 1600000, 'profit' => -100000],
            ['month' => 'Jan', 'budget' => 1500000, 'spend' => 1350000, 'profit' => 150000],
            ['month' => 'Feb', 'budget' => 1500000, 'spend' => 1200000, 'profit' => 300000],
        ];

        return [
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'alerts' => PurchaseOrder::where('status', 'DECLINED')->count(),
            'totalUsers' => User::count(),
            'pendingPRs' => \App\Models\PurchaseRequest::where('status', 'PENDING')->count(),
            'totalInvoices' => class_exists(\App\Models\Invoice::class) ? \App\Models\Invoice::count() : 0,
            'ordersByStatus' => $ordersByStatus,
            'spendAnalysis' => $spendAnalysis,
        ];
    }

    public function getProjectManagerDashboardStats(): array
    {
        $materialRequestsOverTime = [
            ['name' => 'Oct', 'requests' => 12],
            ['name' => 'Nov', 'requests' => 19],
            ['name' => 'Dec', 'requests' => 15],
            ['name' => 'Jan', 'requests' => 22],
            ['name' => 'Feb', 'requests' => 28],
            ['name' => 'Mar', 'requests' => \App\Models\MaterialRequest::where('status', 'PENDING')->count()],
        ];

        $spendAnalysis = [
            ['month' => 'Sep', 'budget' => 800000, 'spend' => 750000, 'profit' => 50000],
            ['month' => 'Oct', 'budget' => 800000, 'spend' => 820000, 'profit' => -20000],
            ['month' => 'Nov', 'budget' => 800000, 'spend' => 600000, 'profit' => 200000],
            ['month' => 'Dec', 'budget' => 1000000, 'spend' => 950000, 'profit' => 50000],
            ['month' => 'Jan', 'budget' => 1000000, 'spend' => 900000, 'profit' => 100000],
            ['month' => 'Feb', 'budget' => 1000000, 'spend' => 780000, 'profit' => 220000],
        ];

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
            'pendingReceiving' => PurchaseOrder::where('status', 'APPROVED')->count(),
            'siteReleases' => \App\Models\SiteRelease::count(),
            'lowStockAlerts' => 0,
        ];
    }

    public function getFinanceDashboardStats(): array
    {
        return [
            'pendingInvoices' => 0,
            'pendingDisbursements' => 0,
            'totalInvoicedAmount' => '0',
            'reportsCount' => 0,
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
