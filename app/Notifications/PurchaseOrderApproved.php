<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\PurchaseOrder;

class PurchaseOrderApproved extends Notification implements ShouldQueue
{
    use Queueable;

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
            'url' => route('purchasing.orders.index', [], false)
        ];
    }
}
