<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Project;
use App\Models\User;
use App\Notifications\ProjectDeadlineNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CheckProjectDeadlines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'projects:check-deadlines';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for projects approaching their deadline and notify admins and site engineers.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting project deadline check...');

        $today = Carbon::today();

        // Define the thresholds for notifications
        $thresholds = [7, 3];

        $projects = Project::whereNotIn('status', ['Completed', 'Cancelled', 'On Hold'])
            ->whereNotNull('target_end_date')
            ->get();

        $notificationsSent = 0;

        foreach ($projects as $project) {
            $endDate = Carbon::parse($project->target_end_date)->startOfDay();
            $daysRemaining = (int) $today->diffInDays($endDate, false);

            if (in_array($daysRemaining, $thresholds)) {
                $this->info("Project '{$project->name}' (ID: {$project->id}) is {$daysRemaining} days away from deadline.");

                // Get Admins
                $admins = User::role('admin')->get();

                // Get Site Engineer
                $siteEngineer = null;
                if ($project->site_engineer_id) {
                    $siteEngineer = User::find($project->site_engineer_id);
                }

                $usersToNotify = $admins;
                if ($siteEngineer && !$usersToNotify->contains($siteEngineer->id)) {
                    $usersToNotify->push($siteEngineer);
                }

                foreach ($usersToNotify as $user) {
                    $user->notify(new ProjectDeadlineNotification($project, $daysRemaining));
                    $notificationsSent++;
                }

                Log::info("Sent deadline notification for project {$project->id} ({$daysRemaining} days remaining).");
            }
        }

        $this->info("Finished project deadline check. Sent {$notificationsSent} notifications.");
    }
}
