import React from 'react';
import {
    Building2, ShoppingCart, FileText, CreditCard, Package,
    Users, Hexagon, X, Briefcase, Shield, ArrowDownCircle,
    ChevronDown, Truck, PieChart, ChevronLeft, ChevronRight,
    LayoutDashboard, ClipboardList, FileSearch, Factory, Receipt, UserCog, Inbox, ShieldCheck, ScrollText, RotateCcw,
    Layers, Settings, CircleDashed
} from 'lucide-react';

/**
 * Data-driven navigation config.
 * Each item declares: label, href, icon, permission (null = always shown), matchPrefix.
 * anyPermission is used for items that need a one-of-many permission check.
 * Groups with no visible items are hidden entirely.
 * Parent groups now have an icon and a defaultHref used when clicked in the parent-only sidebar.
 */
export const NAVIGATION_CONFIG = [
    {
        group: 'Procurement',
        icon: <Briefcase />,
        items: [
            { label: 'Clients', href: '/clients', icon: <Users />, permission: 'view clients', matchPrefix: '/clients' },
            { label: 'Projects', href: '/projects', icon: <Building2 />, permission: 'view projects', matchPrefix: '/projects' },
            { label: 'Sourcing Tasklist', href: '/purchasing/requests', icon: <ShoppingCart />, permission: 'view purchase requests', matchPrefix: '/purchasing/requests', badgeKey: 'requests' },
            { label: 'RFQ', href: '/purchasing/rfq', icon: <FileSearch />, permission: 'view rfq', matchPrefix: '/purchasing/rfq', badgeKey: 'rfqs' },
            { label: 'Suppliers', href: '/purchasing/suppliers', icon: <Factory />, permission: 'view suppliers', matchPrefix: '/purchasing/suppliers' },
            { label: 'Orders', href: '/purchasing/orders', icon: <ClipboardList />, permission: 'view purchase orders', matchPrefix: '/purchasing/orders' },
            {
                label: 'Approvals',
                href: '/purchasing/approvals',
                icon: <ShieldCheck />,
                permission: null,
                matchPrefix: '/purchasing/approvals',
                anyPermission: ['approve boq', 'approve material requests', 'approve purchase orders', 'manage purchase requests'],
                badgeKey: 'approvals',
            },
        ],
    },
    {
        group: 'Operations',
        icon: <Package />,
        items: [
            { label: 'Inventory', href: '/inventory', icon: <Layers />, permission: 'view inventory', matchPrefix: '/inventory', exactMatch: true },
            { label: 'Receiving', href: '/inventory/receiving', icon: <Inbox />, permission: 'view receiving', matchPrefix: '/inventory/receiving', exactMatch: true },
            { label: 'Site Release', href: '/site-release', icon: <Truck />, permission: 'view site release', matchPrefix: '/site-release' },
            { label: 'Material Returns', href: '/inventory/returns', icon: <RotateCcw />, permission: 'view inventory', matchPrefix: '/inventory/returns' },
        ],
    },
    {
        group: 'Finance',
        icon: <PieChart />,
        items: [
            { label: 'Invoices', href: '/finance/invoices', icon: <Receipt />, permission: 'view invoices', matchPrefix: '/finance/invoices' },
            { label: 'Disbursements', href: '/finance/disbursements', icon: <CreditCard />, permission: 'view disbursements', matchPrefix: '/finance/disbursements' },
            { label: 'Reports', href: '/finance/reports', icon: <FileText />, permission: 'view financial reports', matchPrefix: '/finance/reports' },
        ],
    },
    {
        group: 'Admin',
        icon: <Shield />,
        items: [
            { label: 'User Management', href: '/settings/users', icon: <UserCog />, permission: 'manage users', matchPrefix: '/settings/users' },
            { label: 'Activity Logs', href: '/activity-logs', icon: <ScrollText />, role: 'admin', matchPrefix: '/activity-logs' },
        ],
    },
];
