<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user->getRoleNames()->first();

        return match ($role) {
            'admin' => $this->adminDashboard(),
            'project_manager' => $this->projectManagerDashboard(),
            'procurement_officer' => $this->procurementOfficerDashboard(),
            'warehouse' => $this->warehouseDashboard(),
            'finance' => $this->financeDashboard(),
            'site_engineer' => $this->siteEngineerDashboard(),
            default => $this->genericDashboard(),
        };
    }

    private function adminDashboard(): Response
    {
        // Add chart data: Purchase Orders grouped by status
        $ordersByStatus = PurchaseOrder::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        // Financial Metrics Mapping (Budget vs Spend vs Profit)
        $spendAnalysis = [
            ['month' => 'Sep', 'budget' => 1200000, 'spend' => 1100000, 'profit' => 100000],
            ['month' => 'Oct', 'budget' => 1200000, 'spend' => 1150000, 'profit' => 50000],
            ['month' => 'Nov', 'budget' => 1200000, 'spend' => 900000, 'profit' => 300000],
            ['month' => 'Dec', 'budget' => 1500000, 'spend' => 1600000, 'profit' => -100000],
            ['month' => 'Jan', 'budget' => 1500000, 'spend' => 1350000, 'profit' => 150000],
            ['month' => 'Feb', 'budget' => 1500000, 'spend' => 1200000, 'profit' => 300000],
        ];

        $stats = [
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

        return Inertia::render('Dashboards/AdminDashboard', ['stats' => $stats]);
    }

    private function projectManagerDashboard(): Response
    {
        // Create mock historical data for Material Requests over the last few months for the chart
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

        $stats = [
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'pendingMRs' => \App\Models\MaterialRequest::where('status', 'PENDING')->count(),
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'approvedThisMonth' => \App\Models\MaterialRequest::where('status', 'APPROVED')
                ->whereMonth('updated_at', now()->month)->count(),
            'materialRequestsOverTime' => $materialRequestsOverTime,
            'spendAnalysis' => $spendAnalysis,
        ];

        return Inertia::render('Dashboards/ProjectManagerDashboard', ['stats' => $stats]);
    }

    private function procurementOfficerDashboard(): Response
    {
        $stats = [
            'pendingPRs' => \App\Models\PurchaseRequest::where('status', 'PENDING')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'deliveredOrders' => PurchaseOrder::where('status', 'DELIVERED')->count(),
        ];

        return Inertia::render('Dashboards/ProcurementOfficerDashboard', ['stats' => $stats]);
    }

    private function warehouseDashboard(): Response
    {
        $stats = [
            'inventoryItems' => \App\Models\InventoryItem::count(),
            'pendingReceiving' => PurchaseOrder::where('status', 'APPROVED')->count(),
            'siteReleases' => \App\Models\SiteRelease::count(),
            'lowStockAlerts' => 0, // Extend with actual low-stock logic later
        ];

        return Inertia::render('Dashboards/WarehouseDashboard', ['stats' => $stats]);
    }

    private function financeDashboard(): Response
    {
        $stats = [
            'pendingInvoices' => 0,
            'pendingDisbursements' => 0,
            'totalInvoicedAmount' => '0',
            'reportsCount' => 0,
        ];

        return Inertia::render('Dashboards/FinanceDashboard', ['stats' => $stats]);
    }

    private function siteEngineerDashboard(): Response
    {
        $user = auth()->user();

        $projectIds = \App\Models\Project::where('site_engineer_id', $user->id)->pluck('id');

        // Count pending deliveries for the stat card link
        $pendingSiteReleases = \App\Models\SiteRelease::whereIn('status', ['IN_TRANSIT', 'PENDING'])->count();
        $pendingPOs = \App\Models\PurchaseOrder::whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED'])
            ->whereIn('project_id', $projectIds)
            ->count();

        $stats = [
            'activeProjects' => \App\Models\Project::where('status', 'ACTIVE')->count(),
            'myMRs' => \App\Models\MaterialRequest::where('requester_id', $user->id)->count(),
            'pendingMRs' => \App\Models\MaterialRequest::where('requester_id', $user->id)->where('status', 'PENDING')->count(),
            'pendingSiteReleases' => $pendingSiteReleases + $pendingPOs,
        ];

        return Inertia::render('Dashboards/SiteEngineerDashboard', [
            'stats' => $stats,
        ]);
    }

    private function genericDashboard(): Response
    {
        $stats = [
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'alerts' => PurchaseOrder::where('status', 'DECLINED')->count(),
        ];

        return Inertia::render('Dashboard', ['stats' => $stats]);
    }
}

