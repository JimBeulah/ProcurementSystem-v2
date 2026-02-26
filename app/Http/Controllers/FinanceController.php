<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\Project;
use App\Models\SupplierInvoice;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function invoices(): Response
    {
        $invoices = SupplierInvoice::with(['supplier', 'purchaseOrder'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Finance/Invoices/Index', ['invoices' => $invoices]);
    }

    public function disbursements(): Response
    {
        $payments = Disbursement::with(['purchaseOrder.supplier'])
            ->orderBy('payment_date', 'desc')
            ->get();

        return Inertia::render('Finance/Disbursements/Index', ['payments' => $payments]);
    }

    public function reports(): Response
    {
        $projects = Project::with(['purchaseOrders', 'boqItems'])->get();

        $data = $projects->map(function ($p) {
            $budget = (float) $p->budget;
            $committed = $p->purchaseOrders->sum('total_amount');
            $paid = 0; // Compute from disbursements if needed
            return [
                'id' => $p->id,
                'name' => $p->name,
                'clientName' => $p->client?->name ?? 'N/A',
                'budget' => $budget,
                'committed' => $committed,
                'invoiced' => 0,
                'paid' => $paid,
                'remaining' => $budget - $committed,
                'progress' => $budget > 0 ? ($committed / $budget) * 100 : 0,
            ];
        });

        return Inertia::render('Finance/Reports/Index', ['data' => $data]);
    }
}
