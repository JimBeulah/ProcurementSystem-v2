import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
                heading: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
            },
            borderRadius: {
                'xl': '12px',
                '2xl': '18px',
                '3xl': '24px',
                'card': '20px',
            },
            boxShadow: {
                'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                'apple-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            },
            letterSpacing: {
                'tight': '-0.02em',
                'tighter': '-0.04em',
            },
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                card: 'var(--card)',
                border: 'var(--border)',
                accent: 'var(--accent)',
                muted: 'var(--muted)',
                primary: 'var(--color-primary)',
            },
        },
    },
    plugins: [forms],
};
