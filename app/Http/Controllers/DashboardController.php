<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user->getRoleNames()->first();

        return match ($role) {
            'admin' => Inertia::render('Dashboards/AdminDashboard', [
                'stats' => $this->dashboardService->getAdminDashboardStats(),
            ]),
            'project_manager' => Inertia::render('Dashboards/ProjectManagerDashboard', [
                'stats' => $this->dashboardService->getProjectManagerDashboardStats(),
            ]),
            'procurement_officer' => Inertia::render('Dashboards/ProcurementOfficerDashboard', [
                'stats' => $this->dashboardService->getProcurementOfficerDashboardStats(),
            ]),
            'warehouse' => Inertia::render('Dashboards/WarehouseDashboard', [
                'stats' => $this->dashboardService->getWarehouseDashboardStats(),
            ]),
            'finance' => Inertia::render('Dashboards/FinanceDashboard', [
                'stats' => $this->dashboardService->getFinanceDashboardStats(),
            ]),
            'site_engineer' => Inertia::render('Dashboards/SiteEngineerDashboard', [
                'stats' => $this->dashboardService->getSiteEngineerDashboardStats($user),
            ]),
            default => Inertia::render('Dashboard', [
                'stats' => $this->dashboardService->getGenericDashboardStats(),
            ]),
        };
    }
}
