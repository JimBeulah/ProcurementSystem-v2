<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
        }

        // Ensure dompdf font directory exists on Vercel
        if (env('VERCEL')) {
            $fontPath = '/tmp/fonts';
            if (!file_exists($fontPath)) {
                mkdir($fontPath, 0755, true);
            }
        }

        Vite::prefetch(concurrency: 3);
    }
}
