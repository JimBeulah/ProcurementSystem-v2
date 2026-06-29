<?php

namespace App\Services;

use App\Models\BoqItem;
use App\Models\Disbursement;
use App\Models\FinancialTransaction;
use App\Models\InventoryItem;
use App\Models\MaterialRequest;
use App\Models\MaterialReturn;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\SiteRelease;
use App\Models\SupplierInvoice;
use App\Models\User;
use Carbon\Carbon;

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
            $endOfMonth = $date->copy()->endOfMonth();

            // Cumulative BOQ budget: quantity × (material+labor unit price) for all projects created up to this month
            $budget = BoqItem::join('projects', 'projects.id', '=', 'boq_items.project_id')
                ->where('projects.created_at', '<=', $endOfMonth)
                ->whereNull('projects.deleted_at')
                ->whereNull('boq_items.deleted_at')
                ->selectRaw('SUM(boq_items.quantity * (boq_items.material_unit_price + boq_items.labor_unit_price)) as total')
                ->value('total') ?: 0;

            // Cumulative spend: approved/partially-delivered/completed POs up to end of this month
            $spend = PurchaseOrder::whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED', 'COMPLETED'])
                ->where('order_date', '<=', $endOfMonth)
                ->sum('total_amount') ?: 0;

            return [
                'month' => $date->format('M'),
                'budget' => (float) $budget,
                'spend' => (float) $spend,
                'profit' => (float) ($budget - $spend),
            ];
        })->toArray();

        return [
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'alerts' => PurchaseOrder::where('status', 'DECLINED')->count(),
            'totalUsers' => User::count(),
            'pendingPRs' => PurchaseRequest::where('status', 'PENDING')->count(),
            'totalInvoices' => SupplierInvoice::count(),
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
                'requests' => MaterialRequest::whereBetween('created_at', [
                    $date->copy()->startOfMonth(),
                    $date->copy()->endOfMonth(),
                ])->count(),
            ];
        })->toArray();

        $spendAnalysis = $months->map(function ($date) {
            $endOfMonth = $date->copy()->endOfMonth();

            // Cumulative BOQ budget: quantity × (material+labor unit price) for all projects created up to this month
            $budget = BoqItem::join('projects', 'projects.id', '=', 'boq_items.project_id')
                ->where('projects.created_at', '<=', $endOfMonth)
                ->whereNull('projects.deleted_at')
                ->whereNull('boq_items.deleted_at')
                ->selectRaw('SUM(boq_items.quantity * (boq_items.material_unit_price + boq_items.labor_unit_price)) as total')
                ->value('total') ?: 0;

            // Cumulative spend: approved/partially-delivered/completed POs up to end of this month
            $spend = PurchaseOrder::whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED', 'COMPLETED'])
                ->where('order_date', '<=', $endOfMonth)
                ->sum('total_amount') ?: 0;

            return [
                'month' => $date->format('M'),
                'budget' => (float) $budget,
                'spend' => (float) $spend,
                'profit' => (float) ($budget - $spend),
            ];
        })->toArray();

        return [
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'pendingMRs' => MaterialRequest::where('status', 'PENDING')->count(),
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'approvedThisMonth' => MaterialRequest::where('status', 'APPROVED')
                ->whereMonth('updated_at', now()->month)->count(),
            'materialRequestsOverTime' => $materialRequestsOverTime,
            'spendAnalysis' => $spendAnalysis,
        ];
    }

    public function getProcurementOfficerDashboardStats(): array
    {
        return [
            'pendingPRs' => PurchaseRequest::where('status', 'PENDING')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'deliveredOrders' => PurchaseOrder::where('status', 'COMPLETED')->count(),
        ];
    }

    public function getWarehouseDashboardStats(): array
    {
        return [
            'inventoryItems' => InventoryItem::count(),
            'pendingReceiving' => PurchaseOrder::whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED'])->count(),
            'pendingReturns' => MaterialReturn::where('status', 'PENDING')->count(),
            'siteReleases' => SiteRelease::count(),
        ];
    }

    public function getFinanceDashboardStats(): array
    {
        return [
            'pendingInvoices' => SupplierInvoice::where('status', 'PENDING')->count(),
            'pendingDisbursements' => Disbursement::where('status', 'PENDING')->count(),
            'totalInvoicedAmount' => (float) SupplierInvoice::sum('total_amount'),
            'reportsCount' => FinancialTransaction::count(),
        ];
    }

    public function getSiteEngineerDashboardStats(User $user): array
    {
        $projectIds = Project::where('site_engineer_id', $user->id)->pluck('id');

        $pendingSiteReleases = SiteRelease::whereIn('status', ['IN_TRANSIT', 'PENDING'])->count();
        $pendingPOs = PurchaseOrder::whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED'])
            ->whereIn('project_id', $projectIds)
            ->count();

        return [
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'myMRs' => MaterialRequest::where('requester_id', $user->id)->count(),
            'pendingMRs' => MaterialRequest::where('requester_id', $user->id)->where('status', 'PENDING')->count(),
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
