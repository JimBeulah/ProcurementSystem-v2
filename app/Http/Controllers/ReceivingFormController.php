<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\ReceivingItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReceivingFormController extends Controller
{
    public function create()
    {
        $orders = PurchaseOrder::with(['supplier', 'items'])
            ->where('status', 'APPROVED')
            ->get();

        return Inertia::render('Inventory/Receiving/Create', ['orders' => $orders]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|integer',
            'delivery_note_no' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.material_name' => 'required|string',
            'items.*.quantity_received' => 'required|numeric|min:0',
            'items.*.status' => 'required|string',
        ]);

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
