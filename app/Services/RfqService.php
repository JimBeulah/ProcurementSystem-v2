<?php

namespace App\Services;

use App\Models\Rfq;
use App\Models\RfqItem;
use App\Models\SupplierQuotation;
use App\Models\QuotationItem;
use Illuminate\Support\Facades\Auth;

class RfqService
{
    /**
     * Create a new Request for Quotation with its items.
     */
    public function create(array $validated): Rfq
    {
        $rfq = Rfq::create([
            'title' => $validated['title'],
            'due_date' => $validated['due_date'],
            'status' => 'OPEN',
            'created_by_id' => Auth::id(),
        ]);

        foreach ($validated['items'] as $item) {
            RfqItem::create([
                'rfq_id' => $rfq->id,
                'material_name' => $item['material_name'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? '',
            ]);
        }

        return $rfq;
    }

    /**
     * Add a supplier quotation to an RFQ.
     */
    public function addQuotation(Rfq $rfq, array $validated): SupplierQuotation
    {
        $totalAmount = collect($validated['items'])
            ->sum(fn($i) => $i['quantity'] * $i['unit_price']);

        $quotation = SupplierQuotation::create([
            'rfq_id' => $rfq->id,
            'supplier_id' => $validated['supplier_id'],
            'quote_date' => now(),
            'total_amount' => $totalAmount,
            'is_selected' => false,
        ]);

        foreach ($validated['items'] as $item) {
            QuotationItem::create([
                'supplier_quotation_id' => $quotation->id,
                'material_name' => $item['material_name'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'remarks' => 'Manual Entry',
            ]);
        }

        return $quotation;
    }

    /**
     * Award an RFQ to the selected quotation.
     */
    public function award(Rfq $rfq, SupplierQuotation $quotation): void
    {
        $rfq->quotations()->update(['is_selected' => false]);
        $quotation->update(['is_selected' => true]);
        $rfq->update(['status' => 'AWARDED']);
    }
}
