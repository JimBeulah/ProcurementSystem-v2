<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\PurchaseOrder;

class NewPurchaseOrderSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    public $purchaseOrder;

    public function __construct(PurchaseOrder $purchaseOrder)
    {
        $this->purchaseOrder = $purchaseOrder;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $id = str_pad($this->purchaseOrder->id, 4, '0', STR_PAD_LEFT);
        return [
            'message' => "A new Purchase Order (PO-{$id}) has been submitted and awaits your review.",
            'url' => route('purchasing.orders.index', [], false)
        ];
    }
}
