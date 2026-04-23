<?php

namespace App\Notifications;

use App\Models\SiteRelease;
use Illuminate\Notifications\Notification;

class NewSiteReleasePending extends Notification
{
    public $siteRelease;

    public function __construct(SiteRelease $siteRelease)
    {
        $this->siteRelease = $siteRelease;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $materialName = $this->siteRelease->inventoryItem ? $this->siteRelease->inventoryItem->material_name : 'items';
        $projectName = $this->siteRelease->project ? $this->siteRelease->project->name : 'project';

        return [
            'message' => "New dispatch request: {$this->siteRelease->quantity_released} {$this->siteRelease->unit} of {$materialName} for {$projectName} is ready for release.",
            'url' => route('inventory.site-release.index', [], false),
            'type' => 'site_release'
        ];
    }
}
