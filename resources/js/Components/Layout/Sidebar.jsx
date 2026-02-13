import React, { useState } from 'react';
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
    const { url } = usePage();

    const handleLinkClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            onClose();
        }
    };

    const sidebarVariants = {
        expanded: { width: "18rem", x: 0, transition: SPRING_TRANSITION },
        collapsed: { width: "5rem", x: 0, transition: SPRING_TRANSITION },
        hidden: { x: "-100%", transition: { ...SPRING_TRANSITION, damping: 30 } },
    };

    return (
        <>
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
                className="fixed left-0 top-0 h-full bg-background border-r border-border z-50 font-sans flex flex-col md:translate-x-0"
                variants={sidebarVariants}
                animate={
                    (typeof window !== 'undefined' && window.innerWidth < 768 && !isOpen)
                        ? "hidden"
                        : (isCollapsed ? "collapsed" : "expanded")
                }
                initial="hidden"
            >
                {/* Logo */}
                <div className={`flex items-center h-16 px-4 border-b border-border relative ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <motion.div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
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
                                    <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted whitespace-nowrap">
                                        ProcureFlow
                                    </h1>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Collapse toggle */}
                    <motion.button
                        onClick={toggleCollapse}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="hidden md:flex p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted/10 transition-colors absolute -right-3 top-20 bg-card border border-border shadow-xl rounded-full z-50"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={16} />}
                    </motion.button>

                    {/* Mobile close */}
                    <button onClick={onClose} className="md:hidden p-1 text-muted hover:text-foreground absolute right-4">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overscroll-contain overflow-x-hidden p-2 space-y-0.5 no-scrollbar">
                    <NavItem href="/dashboard" icon={<LayoutDashboard />} label="Dashboard" isActive={url === '/dashboard'} isCollapsed={isCollapsed} onClick={handleLinkClick} />

                    <NavGroup label="Procurement" isCollapsed={isCollapsed}>
                        <NavItem href="/clients" icon={<Users />} label="Clients" isActive={url.startsWith('/clients')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/projects" icon={<Briefcase />} label="Projects" isActive={url.startsWith('/projects')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/purchasing/rfq" icon={<FileText />} label="RFQ" isActive={url.startsWith('/purchasing/rfq')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/purchasing/requests" icon={<FileText />} label="Requests" isActive={url.startsWith('/purchasing/requests')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/purchasing/orders" icon={<ShoppingCart />} label="Orders" isActive={url.startsWith('/purchasing/orders')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/inventory/receiving" icon={<ArrowDownCircle />} label="Receive Goods" isActive={url.startsWith('/inventory/receiving')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/purchasing/approvals" icon={<Shield />} label="Approvals" isActive={url.startsWith('/purchasing/approvals')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                    </NavGroup>

                    <NavGroup label="Operations" isCollapsed={isCollapsed}>
                        <NavItem href="/inventory" icon={<Package />} label="Inventory" isActive={url === '/inventory'} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/receiving" icon={<Building2 />} label="Receiving" isActive={url === '/receiving'} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/site-release" icon={<Truck />} label="Site Release" isActive={url.startsWith('/site-release')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                    </NavGroup>

                    <NavGroup label="Finance" isCollapsed={isCollapsed}>
                        <NavItem href="/finance/invoices" icon={<FileText />} label="Invoices" isActive={url.startsWith('/finance/invoices')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/finance/disbursements" icon={<CreditCard />} label="Disbursements" isActive={url.startsWith('/finance/disbursements')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
                        <NavItem href="/finance/reports" icon={<PieChart />} label="Reports" isActive={url.startsWith('/finance/reports')} isCollapsed={isCollapsed} onClick={handleLinkClick} />
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

function NavItem({ href, icon, label, isActive, isCollapsed, onClick }) {
    return (
        <Link href={href} onClick={onClick} title={isCollapsed ? label : undefined} className="block">
            <motion.div
                className={`
                    group flex items-center gap-2 px-2.5 py-1.5 rounded-lg relative overflow-hidden
                    ${isActive ? 'bg-blue-600/10 text-blue-400' : 'text-muted hover:text-foreground hover:bg-muted/10'}
                    ${isCollapsed ? 'justify-center' : ''}
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                {isActive && (
                    <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
                    />
                )}

                <span className={`
                    transition-colors duration-200 relative z-10
                    ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:text-cyan-300'}
                `}>
                    {React.cloneElement(icon, { size: 16 })}
                </span>

                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-[13px] font-medium whitespace-nowrap"
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    );
}
