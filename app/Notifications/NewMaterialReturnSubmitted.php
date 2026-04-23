<?php

namespace App\Notifications;

use App\Models\MaterialReturn;
use Illuminate\Notifications\Notification;

class NewMaterialReturnSubmitted extends Notification
{
    public $materialReturn;

    public function __construct(MaterialReturn $materialReturn)
    {
        $this->materialReturn = $materialReturn;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'message' => "New material return: {$this->materialReturn->quantity} {$this->materialReturn->unit} of {$this->materialReturn->material_name} from {$this->materialReturn->project->name} has been submitted.",
            'url' => route('inventory.material-returns.index', [], false),
            'type' => 'material_return'
        ];
    }
}
