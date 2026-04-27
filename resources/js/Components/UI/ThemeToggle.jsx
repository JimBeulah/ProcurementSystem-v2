import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const dark = stored ? stored === 'dark' : prefersDark;
            document.documentElement.classList.toggle('dark', dark);
            return dark;
        }
        return false;
    });

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    return (
        <button
            type="button"
            onClick={toggle}
            className="p-2 rounded-full hover:bg-muted/10 text-muted hover:text-foreground transition-colors"
            title="Toggle theme"
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
