<?php

namespace App\Http\Controllers;

use App\Models\ReceivingReport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReceivingController extends Controller
{
    public function index()
    {
        $reports = ReceivingReport::with(['purchaseOrder.supplier', 'items'])
            ->orderBy('received_date', 'desc')
            ->get();

        return Inertia::render('Inventory/Receiving/Index', ['reports' => $reports]);
    }
}
