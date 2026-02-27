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

    private function projectManagerDashboard(): Response
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

    private function procurementOfficerDashboard(): Response
    {
        $stats = [
            'pendingPRs' => \App\Models\PurchaseRequest::where('status', 'PENDING')->count(),
            'openRFQs' => \App\Models\Rfq::where('status', 'OPEN')->count(),
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

        // 1. Fetch pending site releases (from warehouse)
        $pendingSiteReleases = \App\Models\SiteRelease::with('project')
            ->where('status', 'PENDING')
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'type' => 'site_release',
                'title' => 'Warehouse Dispatch #' . str_pad($r->id, 4, '0', STR_PAD_LEFT),
                'project_name' => $r->project?->name ?? 'N/A',
                'created_at' => $r->created_at->diffForHumans(),
            ]);

        // 2. Fetch approved purchase orders (direct supplier delivery)
        // We look for POs linked to the Site Engineer's projects
        $projectIds = \App\Models\Project::where('site_engineer_id', $user->id)->pluck('id');

        $pendingPOs = PurchaseOrder::with('project')
            ->whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED'])
            ->whereIn('project_id', $projectIds)
            ->latest()
            ->get()
            ->map(fn($po) => [
                'id' => $po->id,
                'type' => 'purchase_order',
                'title' => 'PO-' . str_pad($po->id, 4, '0', STR_PAD_LEFT) . ' Delivery',
                'project_name' => $po->project?->name ?? 'N/A',
                'created_at' => $po->updated_at->diffForHumans(), // Using updated_at since it's when it was approved
            ]);

        // Merge both streams for the dashboard widget
        $allDeliveries = $pendingSiteReleases->concat($pendingPOs)->sortByDesc('created_at')->values();

        $stats = [
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'myMRs' => \App\Models\MaterialRequest::where('requester_id', $user->id)->count(),
            'pendingMRs' => \App\Models\MaterialRequest::where('requester_id', $user->id)->where('status', 'PENDING')->count(),
            'pendingSiteReleases' => $allDeliveries->count(),
        ];

        return Inertia::render('Dashboards/SiteEngineerDashboard', [
            'stats' => $stats,
            'pendingReleases' => $allDeliveries,
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

