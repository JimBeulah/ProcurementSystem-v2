<?php

namespace App\Services;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use Illuminate\Support\Facades\Auth;

class PurchaseRequestService
{
    /**
     * Create a new purchase request with its line items.
     */
    public function create(array $validated): PurchaseRequest
    {
        $totalCost = collect($validated['items'])
            ->sum(fn($item) => $item['quantity'] * $item['estimated_unit_cost']);

        $pr = PurchaseRequest::create([
            'project_id' => $validated['project_id'],
            'requester_id' => Auth::id(),
            'request_date' => now(),
            'status' => 'PENDING',
            'purpose' => $validated['purpose'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
            'total_estimated_cost' => $totalCost,
        ]);

        foreach ($validated['items'] as $item) {
            $pr->items()->create([
                'item_description' => $item['item_description'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'],
                'estimated_unit_cost' => $item['estimated_unit_cost'],
                'estimated_total_cost' => $item['quantity'] * $item['estimated_unit_cost'],
            ]);
        }

        return $pr;
    }

    /**
     * Approve a purchase request.
     */
    public function approve(PurchaseRequest $purchaseRequest): void
    {
        $purchaseRequest->update([
            'status' => 'APPROVED',
            'approver_id' => Auth::id(),
        ]);
    }

    /**
     * Decline a purchase request.
     */
    public function decline(PurchaseRequest $purchaseRequest): void
    {
        $purchaseRequest->update([
            'status' => 'DECLINED',
            'approver_id' => Auth::id(),
        ]);
    }
}
