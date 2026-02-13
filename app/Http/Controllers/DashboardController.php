<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\Project;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'pendingPOs' => PurchaseOrder::where('status', 'PENDING')->count(),
            'activeProjects' => Project::where('status', 'ACTIVE')->count(),
            'totalOrders' => PurchaseOrder::count(),
            'alerts' => PurchaseOrder::where('status', 'DECLINED')->count(),
        ];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
        ]);
    }
}
