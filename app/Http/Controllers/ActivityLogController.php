<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(): \Inertia\Response
    {
        $logs = Activity::with(['causer', 'subject'])
            ->latest()
            ->paginate(50);

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
        ]);
    }
}
