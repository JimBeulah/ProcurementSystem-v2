<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReceivingReportRequest;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReceivingFormController extends Controller
{
    public function create(): Response
    {
        $orders = PurchaseOrder::with(['supplier', 'items'])
            ->where('status', 'APPROVED')
            ->get();

        return Inertia::render('Inventory/Receiving/Create', ['orders' => $orders]);
    }

    public function store(StoreReceivingReportRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $report = ReceivingReport::create([
            'purchase_order_id' => $validated['purchase_order_id'],
            'received_by_id' => auth()->id(),
            'received_date' => now(),
            'delivery_note_no' => $validated['delivery_note_no'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $report->items()->create($item);
        }

        return redirect()->route('receiving.index')->with('success', 'Goods received.');
    }
}
