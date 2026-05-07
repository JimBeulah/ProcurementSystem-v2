<?php

namespace App\Notifications;

use App\Models\PurchaseRequest;
use Illuminate\Notifications\Notification;

class PurchaseRequestApproved extends Notification
{
    public $purchaseRequest;

    /**
     * Create a new notification instance.
     */
    public function __construct(PurchaseRequest $purchaseRequest)
    {
        $this->purchaseRequest = $purchaseRequest;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $id = str_pad($this->purchaseRequest->id, 5, '0', STR_PAD_LEFT);

        return [
            'message' => "Your Resource Request (RQ-{$id}) has been approved.",
            'url' => route('purchasing.requests.index', [], false),
        ];
    }
}
