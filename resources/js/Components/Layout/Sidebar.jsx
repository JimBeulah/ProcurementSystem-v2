import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, usePage } from '@inertiajs/react';
import {
    Building2, ShoppingCart, FileText, CreditCard, Package,
    Users, Hexagon, X, Briefcase, Shield, ArrowDownCircle,
    ChevronDown, Truck, PieChart, ChevronLeft, ChevronRight,
    LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SPRING_TRANSITION = {
    type: "spring",
    stiffness: 200,
    damping: 25,
    mass: 0.8,
    restDelta: 0.001,
};

export default function Sidebar({ user, isOpen, isCollapsed, onClose, toggleCollapse }) {
    const { url, props } = usePage();
    const { auth } = props;

    const can = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.roles?.includes('admin'); // Admin superuser check
    };

    const handleLinkClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            onClose();
        }
    };

    const sidebarVariants = {
        expanded: { width: "16rem", x: 0, transition: SPRING_TRANSITION },
        collapsed: { width: "4rem", x: 0, transition: SPRING_TRANSITION },
        hidden: { x: "-100%", transition: { ...SPRING_TRANSITION, damping: 30 } },
    };

    const [activeTooltip, setActiveTooltip] = useState(null);

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
                <nav className="flex-1 overflow-y-auto overscroll-contain overflow-x-hidden px-3 py-3 space-y-1 no-scrollbar" onMouseLeave={() => setActiveTooltip(null)}>
                    <NavItem href="/dashboard" icon={<LayoutDashboard />} label="Dashboard" isActive={url === '/dashboard'} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />

                    <NavGroup label="Procurement" isCollapsed={isCollapsed}>
                        {can('view clients') && <NavItem href="/clients" icon={<Users />} label="Clients" isActive={url.startsWith('/clients')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {can('view projects') && <NavItem href="/projects" icon={<Briefcase />} label="Projects" isActive={url.startsWith('/projects')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {can('view purchase requests') && <NavItem href="/purchasing/requests" icon={<FileText />} label="Purchase Requests" isActive={url.startsWith('/purchasing/requests')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {can('view rfq') && <NavItem href="/purchasing/rfq" icon={<FileText />} label="RFQ" isActive={url.startsWith('/purchasing/rfq')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {can('view purchase orders') && <NavItem href="/purchasing/orders" icon={<ShoppingCart />} label="Orders" isActive={url.startsWith('/purchasing/orders')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {can('view receiving') && <NavItem href="/inventory/receiving" icon={<ArrowDownCircle />} label="Receive Goods" isActive={url.startsWith('/inventory/receiving')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {(can('approve boq') || can('approve material requests') || can('approve purchase orders') || can('manage purchase requests')) &&
                            <NavItem href="/purchasing/approvals" icon={<Shield />} label="Approvals" isActive={url.startsWith('/purchasing/approvals')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />
                        }
                    </NavGroup>

                    <NavGroup label="Operations" isCollapsed={isCollapsed}>
                        {can('view inventory') && <NavItem href="/inventory" icon={<Package />} label="Inventory" isActive={url === '/inventory'} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {can('view receiving') && <NavItem href="/receiving" icon={<Building2 />} label="Receiving" isActive={url === '/receiving'} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {can('view site release') && <NavItem href="/site-release" icon={<Truck />} label="Site Release" isActive={url.startsWith('/site-release')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                    </NavGroup>

                    <NavGroup label="Finance" isCollapsed={isCollapsed}>
                        {can('view invoices') && <NavItem href="/finance/invoices" icon={<FileText />} label="Invoices" isActive={url.startsWith('/finance/invoices')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {can('view disbursements') && <NavItem href="/finance/disbursements" icon={<CreditCard />} label="Disbursements" isActive={url.startsWith('/finance/disbursements')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                        {can('view financial reports') && <NavItem href="/finance/reports" icon={<PieChart />} label="Reports" isActive={url.startsWith('/finance/reports')} isCollapsed={isCollapsed} onClick={handleLinkClick} onHover={setActiveTooltip} />}
                    </NavGroup>
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
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5
            }}
            style={{
                top: rect.top + rect.height / 2,
                left: rect.right + 12,
            }}
            className="fixed z-[100] flex items-center group pointer-events-none"
        >
            {/* Tooltip Arrow */}
            <div className="w-2.5 h-2.5 bg-slate-900 absolute -left-1 top-1/2 -translate-y-1/2 rotate-45 border-l border-b border-white/10" />

            {/* Tooltip Content */}
            <div className="relative px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-semibold rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.5)] whitespace-nowrap border border-white/10 tracking-tight">
                {label}
            </div>
        </motion.div>,
        document.body
    );
}
