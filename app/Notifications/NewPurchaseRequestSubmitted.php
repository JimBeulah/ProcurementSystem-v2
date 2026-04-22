<?php

namespace App\Notifications;

use App\Models\PurchaseRequest;
use Illuminate\Notifications\Notification;

class NewPurchaseRequestSubmitted extends Notification
{
    public $purchaseRequest;

    public function __construct(PurchaseRequest $purchaseRequest)
    {
        $this->purchaseRequest = $purchaseRequest;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $id = str_pad($this->purchaseRequest->id, 5, '0', STR_PAD_LEFT);

        return [
            'message' => "A new Material Request (PR-{$id}) has been submitted and awaits your review.",
            'url' => route('purchasing.requests.index', [], false),
        ];
    }
}
