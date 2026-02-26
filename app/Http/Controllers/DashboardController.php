<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\Project;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
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

    private function adminDashboard()
    {
        $stats = [
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'alerts' => PurchaseOrder::where('status', 'DECLINED')->count(),
            'totalUsers' => User::count(),
            'pendingPRs' => \App\Models\PurchaseRequest::where('status', 'PENDING')->count(),
            'totalInvoices' => class_exists(\App\Models\Invoice::class) ? \App\Models\Invoice::count() : 0,
        ];

        return Inertia::render('Dashboards/AdminDashboard', ['stats' => $stats]);
    }

    private function projectManagerDashboard()
    {
        $stats = [
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'pendingMRs' => \App\Models\MaterialRequest::where('status', 'PENDING')->count(),
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'approvedThisMonth' => \App\Models\MaterialRequest::where('status', 'APPROVED')
                ->whereMonth('updated_at', now()->month)->count(),
        ];

        return Inertia::render('Dashboards/ProjectManagerDashboard', ['stats' => $stats]);
    }

    private function procurementOfficerDashboard()
    {
        $stats = [
            'pendingPRs' => \App\Models\PurchaseRequest::where('status', 'PENDING')->count(),
            'openRFQs' => \App\Models\Rfq::where('status', 'OPEN')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'deliveredOrders' => PurchaseOrder::where('status', 'DELIVERED')->count(),
        ];

        return Inertia::render('Dashboards/ProcurementOfficerDashboard', ['stats' => $stats]);
    }

    private function warehouseDashboard()
    {
        $stats = [
            'inventoryItems' => \App\Models\InventoryItem::count(),
            'pendingReceiving' => PurchaseOrder::where('status', 'APPROVED')->count(),
            'siteReleases' => \App\Models\SiteRelease::count(),
            'lowStockAlerts' => 0, // Extend with actual low-stock logic later
        ];

        return Inertia::render('Dashboards/WarehouseDashboard', ['stats' => $stats]);
    }

    private function financeDashboard()
    {
        $stats = [
            'pendingInvoices' => 0,
            'pendingDisbursements' => 0,
            'totalInvoicedAmount' => '0',
            'reportsCount' => 0,
        ];

        return Inertia::render('Dashboards/FinanceDashboard', ['stats' => $stats]);
    }

    private function siteEngineerDashboard()
    {
        $stats = [
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'myMRs' => \App\Models\MaterialRequest::count(),
            'pendingMRs' => \App\Models\MaterialRequest::where('status', 'PENDING')->count(),
            'pendingSiteReleases' => \App\Models\SiteRelease::where('status', 'PENDING')->count(),
        ];

        return Inertia::render('Dashboards/SiteEngineerDashboard', ['stats' => $stats]);
    }

    private function genericDashboard()
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

