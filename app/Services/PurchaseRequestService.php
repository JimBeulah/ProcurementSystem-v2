<?php

namespace App\Services;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\User;
use App\Notifications\NewPurchaseRequestSubmitted;
use App\Notifications\PurchaseRequestApproved;
use App\Notifications\PurchaseRequestReadyForSourcing;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class PurchaseRequestService
{
    /**
     * Create a new purchase request with its line items.
     */
    public function create(array $validated): PurchaseRequest
    {
        $totalCost = collect($validated['items'])
            ->sum(fn ($item) => $item['quantity'] * $item['estimated_unit_cost']);

        $pr = PurchaseRequest::create([
            'project_id' => $validated['project_id'],
            'requester_id' => Auth::id(),
            'request_date' => now(),
            'status' => PurchaseRequestStatus::PENDING,
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

        $approvers = User::role(['admin', 'project_manager'])->get();
        if ($approvers->isNotEmpty()) {
            Notification::send($approvers, new NewPurchaseRequestSubmitted($pr));
        }

        return $pr;
    }

    /**
     * Approve a purchase request.
     */
    public function approve(PurchaseRequest $purchaseRequest): ?string
    {
        // Fix #5: Status Regression Guard
        if ($purchaseRequest->status !== PurchaseRequestStatus::PENDING) {
            throw new \Exception("Only PENDING requests can be approved. Current status: {$purchaseRequest->status->label()}.");
        }

        // Fix #1: Four-eyes principle (PM only, per user instruction)
        if (Auth::user()->hasRole('project_manager') && $purchaseRequest->requester_id === Auth::id()) {
            throw new \Exception('Project Managers cannot approve their own requests. Please ask another manager or an admin.');
        }

        // Fix #2: Soft Budget Warning Logic
        $warning = null;
        $project = $purchaseRequest->project;
        if ($project && $project->budget > 0) {
            $totalCommitted = PurchaseOrder::where('project_id', $project->id)
                ->whereNotIn('status', [PurchaseOrderStatus::DECLINED, PurchaseOrderStatus::CANCELLED])
                ->sum('total_amount');

            $totalPending = PurchaseRequest::where('project_id', $project->id)
                ->where('status', PurchaseRequestStatus::APPROVED)
                ->sum('total_estimated_cost');

            $remaining = (float) $project->budget - (float) $totalCommitted - (float) $totalPending;

            if ($purchaseRequest->total_estimated_cost > $remaining) {
                $overAmount = (float) $purchaseRequest->total_estimated_cost - $remaining;
                $warning = 'Budget Warning: This PR (₱'.number_format((float) $purchaseRequest->total_estimated_cost, 2).') '.
                           'is ₱'.number_format($overAmount, 2).' over the remaining budget.';
            }
        }

        $purchaseRequest->update([
            'status' => PurchaseRequestStatus::APPROVED,
            'approver_id' => Auth::id(),
        ]);

        if ($purchaseRequest->requester) {
            $purchaseRequest->requester->notify(new PurchaseRequestApproved($purchaseRequest));
        }

        $procurementOfficers = User::role('procurement_officer')->get();
        if ($procurementOfficers->isNotEmpty()) {
            Notification::send($procurementOfficers, new PurchaseRequestReadyForSourcing($purchaseRequest));
        }

        return $warning;
    }

    /**
     * Decline a purchase request.
     */
    public function decline(PurchaseRequest $purchaseRequest): void
    {
        // Fix #5: Status Regression Guard
        if ($purchaseRequest->status !== PurchaseRequestStatus::PENDING) {
            throw new \Exception("Only PENDING requests can be declined. Current status: {$purchaseRequest->status->label()}.");
        }

        $purchaseRequest->update([
            'status' => PurchaseRequestStatus::DECLINED,
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

        $pdf = Pdf::loadView('print.purchase-request', [
            'purchaseRequest' => $purchaseRequest,
        ]);

        // Secure the PDF: Enforce printing only, prevent copy/paste, modification, and assembly
        $pdf->setEncryption('', config('app.key'), ['print']);

        return $pdf;
    }
}
