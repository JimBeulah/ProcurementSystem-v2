import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { Hexagon, X, ChevronLeft, ChevronRight, LayoutDashboard, Menu, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAVIGATION_CONFIG } from '@/Config/Navigation';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import { router } from '@inertiajs/react';

export const SPRING_TRANSITION = {
    type: "spring",
    stiffness: 200,
    damping: 25,
    mass: 0.8,
    restDelta: 0.001,
};

export default function Sidebar({ user, isOpen, isCollapsed, onClose, toggleCollapse }) {
    const { url, props } = usePage();
    const { sidebar_badges = {} } = props;
    const { can, hasRole } = usePermissions();
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

    const handleLinkClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) onClose();
    };

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

    // Calculate total badges for a parent group based on visible children
    const getGroupBadgeCount = (items) => {
        const visibleItems = items.filter(isItemVisible);
        return visibleItems.reduce((total, item) => {
            if (item.badgeKey && sidebar_badges[item.badgeKey]) {
                return total + sidebar_badges[item.badgeKey];
            }
            return total;
        }, 0);
    };

    // Determine if a parent group is active
    const isGroupActive = (items) => {
        return items.some(isItemActive);
    };

    // Get the first accessible link for a parent group so users don't land on forbidden pages
    const getGroupHref = (items) => {
        const visibleItems = items.filter(isItemVisible);
        return visibleItems.length > 0 ? visibleItems[0].href : '#';
    };

    const sidebarVariants = {
        expanded: { width: "14rem", x: 0, transition: SPRING_TRANSITION },
        collapsed: { width: "5rem", x: 0, transition: SPRING_TRANSITION }, // slightly wider when collapsed to accommodate parent icons better
        hidden: { x: "-100%", transition: { ...SPRING_TRANSITION, damping: 30 } },
    };

    return (
        <>
            {/* Tooltip Portal */}
            <AnimatePresence>
                {activeTooltip && (
                    <SidebarTooltip key={activeTooltip.label} activeTooltip={activeTooltip} />
                )}
            </AnimatePresence>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <motion.div
                className="fixed left-0 top-0 h-full bg-background md:bg-background/80 backdrop-blur-2xl saturate-180 border-r border-black/5 dark:border-white/5 z-50 font-sans flex flex-col md:translate-x-0 transition-colors"
                variants={sidebarVariants}
                animate={
                    (typeof window !== 'undefined' && window.innerWidth < 768 && !isOpen)
                        ? "hidden"
                        : (isCollapsed ? "collapsed" : "expanded")
                }
                initial={false}
            >
                {/* Logo */}
                <div className="border-b border-black/5 dark:border-white/5 shrink-0">
                    <div className={`flex items-center h-14 px-4 relative ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Link href="/dashboard" className="flex items-center gap-3">
                                <motion.div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                    <Hexagon className="text-white fill-white/20" size={18} />
                                </motion.div>
                                <AnimatePresence initial={false}>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <h1 className="text-lg font-bold text-foreground tracking-tight whitespace-nowrap">
                                                ProcureFlow
                                            </h1>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </div>

                        {/* Collapse toggle */}
                        <motion.button
                            onClick={toggleCollapse}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="hidden md:flex p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors absolute -right-3 top-20 bg-card border border-border shadow-sm z-50"
                        >
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={16} />}
                        </motion.button>

                        {/* Mobile close */}
                        <button onClick={onClose} className="md:hidden p-2.5 text-muted-foreground hover:text-foreground absolute right-3 rounded-lg hover:bg-muted/20 transition-colors" aria-label="Close menu">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation (Parent Links Only) */}
                <nav
                    className="flex-1 overflow-y-auto overscroll-contain overflow-x-hidden px-3 py-6 space-y-2 minimal-scrollbar flex flex-col gap-1"
                    onMouseLeave={() => setActiveTooltip(null)}
                >
                    {/* Dashboard - always visible */}
                    <NavItem
                        href="/dashboard"
                        icon={<LayoutDashboard />}
                        label="Dashboard"
                        isActive={url === '/dashboard'}
                        isCollapsed={isCollapsed}
                        onClick={handleLinkClick}
                        onHover={setActiveTooltip}
                    />

                    <div className="pt-2 mt-2 border-t border-border/50">
                        {isCollapsed ? null : <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modules</div>}
                        {/* Dynamic Parent Groups from NAVIGATION_CONFIG */}
                        {NAVIGATION_CONFIG.map(({ group, icon, items }) => {
                            const visibleItems = items.filter(isItemVisible);
                            if (visibleItems.length === 0) return null; // Don't show if no children are visible

                            const groupBadge = getGroupBadgeCount(items);

                            return (
                                <NavItem
                                    key={group}
                                    href={getGroupHref(items)}
                                    icon={icon || <Menu />} // Fallback icon
                                    label={group}
                                    isActive={isGroupActive(items)}
                                    isCollapsed={isCollapsed}
                                    onClick={handleLinkClick}
                                    onHover={setActiveTooltip}
                                    badge={groupBadge}
                                />
                            );
                        })}
                    </div>
                </nav>

                {/* Bottom utilities */}
                <div className="mt-auto border-t border-black/5 dark:border-white/5 p-3 flex flex-col gap-1 bg-background/50">
                    <NavItem
                        href="/settings"
                        icon={<Settings />}
                        label="Settings"
                        isActive={url.startsWith('/settings') && !NAVIGATION_CONFIG.some(({ items }) => items.some(isItemActive))}
                        isCollapsed={isCollapsed}
                        onClick={handleLinkClick}
                        onHover={setActiveTooltip}
                    />
                    <button
                        className="block group/item relative w-full text-left"
                        onClick={() => setIsLogoutConfirmOpen(true)}
                        onMouseEnter={(e) => {
                            if (isCollapsed) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveTooltip({ label: 'Logout', rect });
                            }
                        }}
                        onMouseLeave={() => setActiveTooltip(null)}
                    >
                        <motion.div
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20
                                ${isCollapsed ? 'justify-center px-0 mx-2' : ''}
                            `}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="relative flex justify-center w-8">
                                <span className={`transition-colors duration-200 relative z-10 flex items-center justify-center group-hover/item:text-red-500`}>
                                    <LogOut size={22} strokeWidth={2} />
                                </span>
                            </div>
                            <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="text-[14px] whitespace-nowrap tracking-tight flex-1"
                                    >
                                        Logout
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </button>
                </div>
            </motion.div>

            <ConfirmationModal
                isOpen={isLogoutConfirmOpen}
                onClose={() => setIsLogoutConfirmOpen(false)}
                onConfirm={() => {
                    setIsLogoutConfirmOpen(false);
                    router.post('/logout');
                }}
                title="Sign Out"
                message="Are you sure you want to sign out of your account?"
                confirmText="Sign Out"
                type="danger"
            />
        </>
    );
}

function NavItem({ href, icon, label, isActive, isCollapsed, onClick, onHover, badge = 0 }) {
    const handleMouseEnter = (e) => {
        if (isCollapsed && onHover) {
            const rect = e.currentTarget.getBoundingClientRect();
            onHover({ label, rect });
        }
    };

    return (
        <Link
            href={href}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            className="block group/item relative mb-1"
        >
            <motion.div
                className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive
                        ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}
                    ${isCollapsed ? 'justify-center px-0 mx-2' : ''}
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className="relative flex justify-center w-8">
                    <span className={`
                         transition-colors duration-200 relative z-10 flex items-center justify-center
                         ${isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover/item:text-foreground'}
                     `}>
                        {React.cloneElement(icon, { size: 22, strokeWidth: isActive ? 2.5 : 2 })}
                    </span>
                </div>

                <AnimatePresence initial={false}>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            className="text-[14px] whitespace-nowrap tracking-tight flex-1"
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
                {!isCollapsed && badge > 0 && (
                    <motion.div
                        initial={false}
                        animate={{ scale: 1 }}
                        className="ml-auto bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] flex items-center justify-center leading-none shadow-sm"
                    >
                        {badge > 99 ? '99+' : badge}
                    </motion.div>
                )}
                {isCollapsed && badge > 0 && (
                    <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background shadow-sm" />
                )}
            </motion.div>
        </Link>
    );
}

function SidebarTooltip({ activeTooltip }) {
    const { label, rect } = activeTooltip;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0, x: -10, y: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: "-50%", scale: 1 }}
            exit={{ opacity: 0, x: -10, y: "-50%", scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
            style={{ top: rect.top + rect.height / 2, left: rect.right + 16 }}
            className="fixed z-[100] flex items-center group pointer-events-none"
        >
            <div className="w-2.5 h-2.5 bg-slate-900 absolute -left-1 top-1/2 -translate-y-1/2 rotate-45 border-l border-b border-white/10" />
            <div className="relative px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-[12px] font-semibold rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.5)] whitespace-nowrap border border-white/10 tracking-tight">
                {label}
            </div>
        </motion.div>,
        document.body
    );
}

