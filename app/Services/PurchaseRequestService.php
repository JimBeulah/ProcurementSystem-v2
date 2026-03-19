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

        $approvers = \App\Models\User::role(['admin', 'project_manager'])->get();
        if ($approvers->isNotEmpty()) {
            \Illuminate\Support\Facades\Notification::send($approvers, new \App\Notifications\NewPurchaseRequestSubmitted($pr));
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

        if ($purchaseRequest->requester) {
            $purchaseRequest->requester->notify(new \App\Notifications\PurchaseRequestApproved($purchaseRequest));
        }

        $procurementOfficers = \App\Models\User::role('procurement_officer')->get();
        if ($procurementOfficers->isNotEmpty()) {
            \Illuminate\Support\Facades\Notification::send($procurementOfficers, new \App\Notifications\PurchaseRequestReadyForSourcing($purchaseRequest));
        }
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

    /**
     * Generate a PDF for the given purchase request.
     */
    public function generatePdf(PurchaseRequest $purchaseRequest)
    {
        // Load relationships needed for the PDF
        $purchaseRequest->load(['project', 'items']);

        // We use requester instead of creator, based on the actual relation
        // We'll lazy load if they exist or just pass what we have
        $purchaseRequest->loadMissing(['requester', 'approver']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('print.purchase-request', [
            'purchaseRequest' => $purchaseRequest
        ]);

        // Secure the PDF: Enforce printing only, prevent copy/paste, modification, and assembly
        $pdf->setEncryption('', config('app.key'), ['print']);

        return $pdf;
    }
}
