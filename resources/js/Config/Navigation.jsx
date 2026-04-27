import React from 'react';
import {
    Building2, ShoppingCart, FileText, CreditCard, Package,
    Users, Briefcase, Shield, Truck, PieChart,
    ClipboardList, Factory, Receipt, UserCog, Inbox, ShieldCheck, ScrollText, RotateCcw,
    Layers, ArrowLeftRight
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
            { label: 'Projects', href: '/projects', icon: <Building2 />, permission: 'view projects', matchPrefix: '/projects' },
            { label: 'Purchase Requests', href: '/purchasing/requests', icon: <ShoppingCart />, permission: 'view purchase requests', matchPrefix: '/purchasing/requests', badgeKey: 'requests' },
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
            { label: 'Suppliers', href: '/purchasing/suppliers', icon: <Factory />, permission: 'view suppliers', matchPrefix: '/purchasing/suppliers' },
            { label: 'Clients', href: '/clients', icon: <Users />, permission: 'view clients', matchPrefix: '/clients' },
            { label: 'Supplier Returns', href: '/purchasing/supplier-returns', icon: <ArrowLeftRight />, permission: 'view purchase orders', matchPrefix: '/purchasing/supplier-returns' },
        ],
    },
    {
        group: 'Operations',
        icon: <Package />,
        items: [
            { label: 'Inventory', href: '/inventory', icon: <Layers />, permission: 'view inventory', matchPrefix: '/inventory', exactMatch: true },
            { label: 'Receiving', href: '/inventory/receiving', icon: <Inbox />, permission: 'view receiving', matchPrefix: '/inventory/receiving', exactMatch: true },
            { label: 'Deliveries', href: '/operations/deliveries', icon: <Truck />, anyPermission: ['view receiving', 'confirm site release'], matchPrefix: '/operations/deliveries' },
            { label: 'Site Release', href: '/site-release', icon: <Truck />, permission: 'create site release', matchPrefix: '/site-release', badgeKey: 'site_release' },
            { label: 'Material Returns', href: '/inventory/returns', icon: <RotateCcw />, permission: 'view inventory', matchPrefix: '/inventory/returns', badgeKey: 'material_returns' },
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
