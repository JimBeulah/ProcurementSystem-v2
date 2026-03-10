<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
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
            'auth' => [
                'user' => $request->user(),
                'permissions' => $request->user() ? $request->user()->getAllPermissions()->pluck('name') : [],
                'roles' => $request->user() ? $request->user()->getRoleNames() : [],
                'notifications_count' => $request->user() ? $request->user()->unreadNotifications()->count() : 0,
                'notifications' => $request->user() ? $request->user()->notifications()->take(5)->get() : [],
            ],
            'search_projects' => ($request->user() && $request->user()->can('view projects'))
                ? \App\Models\Project::forUser($request->user())
                    ->select('id', 'name')
                    ->orderBy('created_at', 'desc')
                    ->get()
                : [],
            'sidebar_badges' => [
                'requests' => $request->user() ? \App\Models\PurchaseRequest::where(function ($query) use ($request) {
                    $hasAny = false;
                    if ($request->user()->can('manage purchase requests')) {
                        $query->orWhere('status', 'PENDING');
                        $hasAny = true;
                    }
                    if ($request->user()->can('create purchase orders')) {
                        $query->orWhereIn('status', ['APPROVED', 'PARTIAL']);
                        $hasAny = true;
                    }
                    if (!$hasAny) {
                        $query->whereRaw('1 = 0');
                    }
                })->count() : 0,
                'rfqs' => $request->user() && $request->user()->can('view rfq') ? \App\Models\Rfq::where('status', 'OPEN')->count() : 0,
                'approvals' => $request->user() ? (
                    \App\Models\PurchaseRequest::where('status', 'PENDING')->count() +
                    \App\Models\PurchaseOrder::where('status', 'PENDING')->count() +
                    \App\Models\MaterialRequest::where('status', 'PENDING')->count()
                ) : 0,
            ],
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
