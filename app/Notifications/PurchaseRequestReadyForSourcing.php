<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\PurchaseRequest;

class PurchaseRequestReadyForSourcing extends Notification implements ShouldQueue
{
    use Queueable;

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
            'message' => "A new Material Request (PR-{$id}) has been approved and is ready for sourcing.",
            'url' => route('purchasing.requests.index', [], false)
        ];
    }
}
