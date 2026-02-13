import { cn } from '@/Utils/cn';

export function Card({ className, children, hoverEffect = false }) {
    return (
        <div
            className={cn(
                "glass-card rounded-xl p-4 transition-all duration-200",
                "shadow-sm border-border/40",
                hoverEffect && "hover:bg-accent/[0.02] hover:-translate-y-0.5 hover:shadow-md hover:border-accent/20 cursor-pointer",
                className
            )}
        >
            {children}
        </div>
    );
}
