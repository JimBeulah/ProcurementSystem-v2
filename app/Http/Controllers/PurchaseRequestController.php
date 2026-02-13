<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseRequestController extends Controller
{
    public function index()
    {
        $requests = PurchaseOrder::with(['project', 'requester'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Purchasing/Requests/Index', [
            'requests' => $requests,
        ]);
    }
}
