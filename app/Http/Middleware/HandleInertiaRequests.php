<?php

namespace App\Http\Middleware;

use App\Enums\MaterialRequestStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Models\MaterialRequest;
use App\Models\MaterialReturn;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\SiteRelease;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'is_vercel' => env('VERCEL') || env('BLOB_READ_WRITE_TOKEN'),
            'auth' => [
                'user' => $request->user(),
                'permissions' => $request->user() ? $request->user()->getAllPermissions()->pluck('name') : [],
                'roles' => $request->user() ? $request->user()->getRoleNames() : [],
                'notifications_count' => $request->user() ? $request->user()->unreadNotifications()->count() : 0,
                'notifications' => $request->user() ? $request->user()->unreadNotifications()->latest()->take(5)->get() : [],
            ],
            'search_projects' => Inertia::defer(fn () => ($request->user() && $request->user()->can('view projects'))
                ? Project::forUser($request->user())
                    ->select('id', 'name')
                    ->orderBy('created_at', 'desc')
                    ->get()
                : []),
            'sidebar_badges' => Inertia::defer(fn () => [
                'requests' => $request->user() ? PurchaseRequest::where(function ($query) use ($request) {
                    $hasAny = false;
                    if ($request->user()->can('manage purchase requests')) {
                        $query->orWhere('status', PurchaseRequestStatus::PENDING);
                        $hasAny = true;
                    }
                    if ($request->user()->can('create purchase orders')) {
                        $query->orWhereIn('status', [PurchaseRequestStatus::APPROVED, PurchaseRequestStatus::PARTIAL]);
                        $hasAny = true;
                    }
                    if (! $hasAny) {
                        $query->whereRaw('1 = 0');
                    }
                })->count() : 0,
                'approvals' => $request->user() ? (
                    PurchaseRequest::where('status', PurchaseRequestStatus::PENDING)->count() +
                    PurchaseOrder::where('status', PurchaseOrderStatus::PENDING)->count() +
                    MaterialRequest::where('status', MaterialRequestStatus::PENDING)->count()
                ) : 0,
                'warehouse' => $request->user() && $request->user()->hasRole(['admin', 'warehouse']) ? (
                    SiteRelease::where('status', 'PENDING')->count() +
                    MaterialReturn::where('status', 'PENDING')->count()
                ) : 0,
                'site_release' => $request->user() && $request->user()->hasRole(['admin', 'warehouse']) ? SiteRelease::where('status', 'PENDING')->count() : 0,
                'material_returns' => $request->user() && $request->user()->hasRole(['admin', 'warehouse']) ? MaterialReturn::where('status', 'PENDING')->count() : 0,
            ]),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
                'message' => $request->session()->get('message'),
            ],
        ];
    }
}
