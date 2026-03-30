<?php

namespace App\Http\Controllers;

use App\Models\MaterialRequest;
use App\Models\PurchaseOrder;
use Inertia\Inertia;

class ApprovalController extends Controller
{
    public function index()
    {
        $pendingPos = PurchaseOrder::with(['project', 'requester', 'items'])
            ->where('status', 'PENDING')
            ->orderBy('created_at', 'asc')
            ->get();

        $pendingMrs = MaterialRequest::with(['project', 'requester', 'items'])
            ->where('status', 'PENDING')
            ->orderBy('created_at', 'asc')
            ->get();

        return Inertia::render('Purchasing/Approvals/Index', [
            'pendingPos' => $pendingPos,
            'pendingMrs' => $pendingMrs,
        ]);
    }
}
