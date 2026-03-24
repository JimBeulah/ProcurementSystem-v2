<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class BackfillUsernames extends Command
{
    protected $signature = 'users:backfill-usernames';

    protected $description = 'Generate usernames for any users that do not have one.';

    public function handle(): void
    {
        $users = User::whereNull('username')->get();

        if ($users->isEmpty()) {
            $this->info('All users already have usernames.');

            return;
        }

        foreach ($users as $user) {
            $base = strtolower(explode('@', $user->email ?? $user->name)[0]);
            // Keep only alphanumeric and underscores
            $base = preg_replace('/[^a-z0-9_]/', '_', $base);
            $username = $base;
            $i = 1;

            while (User::where('username', $username)->where('id', '!=', $user->id)->exists()) {
                $username = $base.$i++;
            }

            $user->update(['username' => $username, 'is_active' => true]);
            $this->line("  ✓ {$user->name} → {$username}");
        }

        $this->info("Done. {$users->count()} user(s) updated.");
    }
}
