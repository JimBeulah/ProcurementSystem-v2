import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { usePermissions } from '@/Hooks/usePermissions';

export default function SubNavigationTabs({ items }) {
    const { url, props } = usePage();
    const { sidebar_badges = {} } = props;
    const { can, hasRole } = usePermissions();

    const isItemVisible = (item) => {
        if (item.role) return hasRole(item.role);
        if (item.anyPermission) return item.anyPermission.some((p) => can(p));
        if (!item.permission) return true;
        return can(item.permission);
    };

    const isItemActive = (item) => {
        if (item.exactMatch) return url === item.matchPrefix;
        return url.startsWith(item.matchPrefix);
    };

    const visibleItems = items.filter(isItemVisible);

    if (visibleItems.length <= 1) return null; // Only show tabs if there's more than one sub-item

    return (
        <div className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-30">
            <div className="px-2 md:px-4 max-w-[1600px] mx-auto">
                <nav
                    className="-mb-px flex space-x-4 md:space-x-6 overflow-x-auto minimal-scrollbar scroll-smooth"
                    aria-label="Sub Navigation"
                >
                    {visibleItems.map((item) => {
                        const active = isItemActive(item);
                        const badgeCount = item.badgeKey ? sidebar_badges[item.badgeKey] : 0;

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`
                                    whitespace-nowrap pb-3 pt-3.5 sm:pb-3.5 sm:pt-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors relative flex items-center gap-1.5 sm:gap-2 group
                                    ${active
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
                                `}
                            >
                                <span className={`
                                    transition-colors
                                    ${active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground group-hover:text-foreground'}
                                `}>
                                    {React.cloneElement(item.icon, { size: 16, strokeWidth: active ? 2.5 : 2 })}
                                </span>
                                {item.label}

                                {active && (
                                    <motion.div
                                        layoutId="activeTabBadge"
                                        className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                                    />
                                )}

                                {badgeCount > 0 && (
                                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1.5 bg-red-500 text-white shadow-sm">
                                        {badgeCount > 99 ? '99+' : badgeCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
