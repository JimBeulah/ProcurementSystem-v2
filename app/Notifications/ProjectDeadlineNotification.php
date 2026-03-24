<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ProjectDeadlineNotification extends Notification
{
    use Queueable;

    protected $project;

    protected $daysRemaining;

    /**
     * Create a new notification instance.
     */
    public function __construct($project, $daysRemaining)
    {
        $this->project = $project;
        $this->daysRemaining = $daysRemaining;
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
        $message = "Project '{$this->project->name}' is approaching its deadline in {$this->daysRemaining} day(s).";

        return [
            'project_id' => $this->project->id,
            'message' => $message,
            'url' => route('projects.show', $this->project->id),
            'type' => 'project_deadline',
        ];
    }
}
