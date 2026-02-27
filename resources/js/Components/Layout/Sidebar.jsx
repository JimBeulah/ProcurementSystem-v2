import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import {
    Building2, ShoppingCart, FileText, CreditCard, Package,
    Users, Hexagon, X, Briefcase, Shield, ArrowDownCircle,
    ChevronDown, Truck, PieChart, ChevronLeft, ChevronRight,
    LayoutDashboard, ClipboardList, FileSearch, Factory, Receipt, UserCog, Inbox, ShieldCheck, ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SPRING_TRANSITION = {
    type: "spring",
    stiffness: 200,
    damping: 25,
    mass: 0.8,
    restDelta: 0.001,
};

/**
 * Data-driven navigation config.
 * Each item declares: label, href, icon, permission (null = always shown), matchPrefix.
 * anyPermission is used for items that need a one-of-many permission check.
 * Groups with no visible items are hidden entirely.
 */
const NAVIGATION_CONFIG = [
    {
        group: 'Procurement',
        items: [
            { label: 'Clients', href: '/clients', icon: <Users />, permission: 'view clients', matchPrefix: '/clients' },
            { label: 'Projects', href: '/projects', icon: <Briefcase />, permission: 'view projects', matchPrefix: '/projects' },
            { label: 'Purchase Requests', href: '/purchasing/requests', icon: <ClipboardList />, permission: 'view purchase requests', matchPrefix: '/purchasing/requests' },
            { label: 'RFQ', href: '/purchasing/rfq', icon: <FileSearch />, permission: 'view rfq', matchPrefix: '/purchasing/rfq' },
            { label: 'Suppliers', href: '/purchasing/suppliers', icon: <Factory />, permission: 'view suppliers', matchPrefix: '/purchasing/suppliers' },
            { label: 'Orders', href: '/purchasing/orders', icon: <ShoppingCart />, permission: 'view purchase orders', matchPrefix: '/purchasing/orders' },
            { label: 'Receive Goods', href: '/inventory/receiving', icon: <ArrowDownCircle />, permission: 'view receiving', matchPrefix: '/inventory/receiving' },
            {
                label: 'Approvals',
                href: '/purchasing/approvals',
                icon: <ShieldCheck />,
                permission: null,
                matchPrefix: '/purchasing/approvals',
                anyPermission: ['approve boq', 'approve material requests', 'approve purchase orders', 'manage purchase requests'],
            },
        ],
    },
    {
        group: 'Operations',
        items: [
            { label: 'Inventory', href: '/inventory', icon: <Package />, permission: 'view inventory', matchPrefix: '/inventory', exactMatch: true },
            { label: 'Receiving', href: '/inventory/receiving', icon: <Inbox />, permission: 'view receiving', matchPrefix: '/inventory/receiving', exactMatch: true },
            { label: 'Site Release', href: '/site-release', icon: <Truck />, permission: 'view site release', matchPrefix: '/site-release' },
        ],
    },
    {
        group: 'Finance',
        items: [
            { label: 'Invoices', href: '/finance/invoices', icon: <Receipt />, permission: 'view invoices', matchPrefix: '/finance/invoices' },
            { label: 'Disbursements', href: '/finance/disbursements', icon: <CreditCard />, permission: 'view disbursements', matchPrefix: '/finance/disbursements' },
            { label: 'Reports', href: '/finance/reports', icon: <PieChart />, permission: 'view financial reports', matchPrefix: '/finance/reports' },
        ],
    },
    {
        group: 'Admin',
        items: [
            { label: 'User Management', href: '/settings/users', icon: <UserCog />, permission: 'manage users', matchPrefix: '/settings/users' },
            { label: 'Activity Logs', href: '/activity-logs', icon: <ScrollText />, role: 'admin', matchPrefix: '/activity-logs' },
        ],
    },
];

export default function Sidebar({ user, isOpen, isCollapsed, onClose, toggleCollapse }) {
    const { url } = usePage();
    const { can, hasRole } = usePermissions();
    const [activeTooltip, setActiveTooltip] = useState(null);

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

    const sidebarVariants = {
        expanded: { width: "16rem", x: 0, transition: SPRING_TRANSITION },
        collapsed: { width: "4rem", x: 0, transition: SPRING_TRANSITION },
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
                className="fixed left-0 top-0 h-full bg-background/80 backdrop-blur-2xl saturate-180 border-r border-black/5 dark:border-white/5 z-50 font-sans flex flex-col md:translate-x-0 transition-colors"
                variants={sidebarVariants}
                animate={
                    (typeof window !== 'undefined' && window.innerWidth < 768 && !isOpen)
                        ? "hidden"
                        : (isCollapsed ? "collapsed" : "expanded")
                }
                initial="hidden"
            >
                {/* Logo */}
                <div className={`flex items-center h-14 px-4 border-b border-black/5 dark:border-white/5 relative ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <motion.div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                <Hexagon className="text-white fill-white/20" size={18} />
                            </motion.div>
                            <AnimatePresence>
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
                    <button onClick={onClose} className="md:hidden p-1 text-muted-foreground hover:text-foreground absolute right-4">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav
                    className="flex-1 overflow-y-auto overscroll-contain overflow-x-hidden px-3 py-3 space-y-1 minimal-scrollbar"
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

                    {/* Dynamic groups from NAVIGATION_CONFIG, filtered by permissions */}
                    {NAVIGATION_CONFIG.map(({ group, items }) => {
                        const visibleItems = items.filter(isItemVisible);
                        if (visibleItems.length === 0) return null;

                        return (
                            <NavGroup key={group} label={group} isCollapsed={isCollapsed}>
                                {visibleItems.map((item) => (
                                    <NavItem
                                        key={item.href}
                                        href={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        isActive={isItemActive(item)}
                                        isCollapsed={isCollapsed}
                                        onClick={handleLinkClick}
                                        onHover={setActiveTooltip}
                                    />
                                ))}
                            </NavGroup>
                        );
                    })}
                </nav>
            </motion.div>
        </>
    );
}

function NavGroup({ label, children, isCollapsed }) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (isCollapsed) {
        return (
            <div className="pt-2 border-t border-border mt-2 first:mt-0 first:border-0 first:pt-0">
                <div className="flex flex-col gap-1">{children}</div>
            </div>
        );
    }

    return (
        <div className="py-1">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 text-[9px] font-bold text-muted uppercase tracking-widest mb-1 hover:text-foreground transition-colors group"
                type="button"
            >
                <span>{label}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            <motion.div
                initial={false}
                animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden space-y-1"
            >
                {children}
            </motion.div>
        </div>
    );
}

function NavItem({ href, icon, label, isActive, isCollapsed, onClick, onHover }) {
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
            className="block group/item relative mb-0.5"
        >
            <motion.div
                className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200
                    ${isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'}
                    ${isCollapsed ? 'justify-center px-2' : ''}
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
            >
                <span className={`
                    transition-colors duration-200 relative z-10 flex items-center justify-center
                    ${isActive ? 'text-white' : 'group-hover/item:text-foreground'}
                `}>
                    {React.cloneElement(icon, { size: isCollapsed ? 20 : 18, strokeWidth: isActive ? 2.5 : 2 })}
                </span>

                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            className="text-[13px] whitespace-nowrap tracking-tight"
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
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
            style={{ top: rect.top + rect.height / 2, left: rect.right + 12 }}
            className="fixed z-[100] flex items-center group pointer-events-none"
        >
            <div className="w-2.5 h-2.5 bg-slate-900 absolute -left-1 top-1/2 -translate-y-1/2 rotate-45 border-l border-b border-white/10" />
            <div className="relative px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-semibold rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.5)] whitespace-nowrap border border-white/10 tracking-tight">
                {label}
            </div>
        </motion.div>,
        document.body
    );
}
