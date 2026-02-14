import { cn } from '@/Utils/cn';

export function Card({ className, children, hoverEffect = false }) {
    return (
        <div
            className={cn(
                "bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl backdrop-saturate-[1.5]",
                "rounded-2xl p-4 transition-all duration-200",
                "border border-black/[0.04] dark:border-white/[0.06]",
                "shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none",
                hoverEffect && "hover:bg-white/90 dark:hover:bg-white/[0.06] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] cursor-pointer",
                className
            )}
        >
            {children}
        </div>
    );
}
