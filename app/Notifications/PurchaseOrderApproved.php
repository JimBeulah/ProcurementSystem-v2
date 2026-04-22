<?php

namespace App\Notifications;

use App\Models\PurchaseOrder;
use Illuminate\Notifications\Notification;

class PurchaseOrderApproved extends Notification
{
    public $purchaseOrder;

    /**
     * Create a new notification instance.
     */
    public function __construct(PurchaseOrder $purchaseOrder)
    {
        $this->purchaseOrder = $purchaseOrder;
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
        $id = str_pad($this->purchaseOrder->id, 4, '0', STR_PAD_LEFT);

        return [
            'message' => "Your Purchase Order (PO-{$id}) has been approved.",
            'url' => route('purchasing.orders.index', [], false),
        ];
    }
}
