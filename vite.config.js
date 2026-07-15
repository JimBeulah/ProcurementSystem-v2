import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            // The site already ships public/site.webmanifest, linked from app.blade.php.
            // Let this plugin manage only the service worker.
            manifest: false,
            injectRegister: false,
            filename: 'sw.js',
            registerType: 'autoUpdate',
            // Precache only the built static assets. Never cache app/API/Inertia
            // responses (they carry auth-gated procurement/financial data), and
            // never intercept navigations.
            workbox: {
                globPatterns: ['**/*.{js,css,woff,woff2,png,svg,ico}'],
                navigateFallback: null,
                runtimeCaching: [],
                skipWaiting: true,
                clientsClaim: true,
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
});
