import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Briefcase, ClipboardList, Truck, ShoppingCart, ArrowRight,
    MapPin, Building, PhilippinePeso, Calendar, Activity, Command, RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/Components/UI/Card';

export default function ProjectShow() {
    const { project, auth } = usePage().props;
    const isSiteEngineer = auth.user.role === 'site_engineer';

    if (!project) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
                <div className="p-4 rounded-full bg-red-500/10 text-red-500 inline-block">
                    <Briefcase size={32} />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Project not found</h3>
                <Link href="/projects" className="text-blue-500 hover:underline">
                    Back to Projects
                </Link>
            </div>
        </div>
    );

    const modules = [
        {
            title: 'Bill of Quantities',
            description: 'Manage project budget limits, material requirements, and costs.',
            icon: ClipboardList,
            color: 'from-orange-500 to-amber-500',
            iconColor: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-500/10',
            href: `/projects/${project.id}/boq`,
            hideForSiteEngineer: true,
        },
        {
            title: 'Material Requests',
            description: 'Request materials from warehouse or procurement tracking.',
            icon: Truck,
            color: 'from-blue-500 to-indigo-500',
            iconColor: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10',
            href: `/projects/${project.id}/material-requests`,
        },
        {
            title: 'Material Returns',
            description: 'Return leftover site materials back to warehouse inventory.',
            icon: RotateCcw,
            color: 'from-teal-500 to-cyan-500',
            iconColor: 'text-teal-600 dark:text-teal-400',
            bg: 'bg-teal-500/10',
            href: `/projects/${project.id}/material-returns`,
        },
        {
            title: 'Financial Performance',
            description: 'View project revenue, costs, and profit/loss statement.',
            icon: Activity,
            color: 'from-emerald-500 to-teal-500',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
            href: `/projects/${project.id}/financials`,
            hideForSiteEngineer: true,
        },
        {
            title: 'Procurement Status',
            description: 'Track POs, deliveries, and supplier performance.',
            icon: ShoppingCart,
            color: 'from-cyan-500 to-teal-500',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-500/10',
            href: '/purchasing/orders',
            hideForSiteEngineer: true,
        },
    ].filter(mod => !(isSiteEngineer && mod.hideForSiteEngineer));

    const stats = [
        { label: 'Budget', value: Number(project.budget || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }), icon: PhilippinePeso, color: 'text-emerald-500', hideForSiteEngineer: true },
        { label: 'Total Profit', value: Number(project.total_profit || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }), icon: Activity, color: 'text-purple-500', hideForSiteEngineer: true },
        { label: 'BOQ Items', value: project.boq_items?.length || 0, icon: ClipboardList, color: 'text-orange-500', hideForSiteEngineer: true },
        { label: 'Material Req', value: project.material_requests?.length || 0, icon: Truck, color: 'text-blue-500' },
        { label: 'Purchases', value: project.purchase_orders?.length || 0, icon: ShoppingCart, color: 'text-teal-500', hideForSiteEngineer: true },
    ].filter(stat => !(isSiteEngineer && stat.hideForSiteEngineer));

    return (
        <AuthenticatedLayout>
            <Head title={project.name} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 1. Page Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3"
                        >
                            <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                                <Briefcase size={22} className="opacity-70" />
                            </div>
                            {project.name}
                        </motion.h1>
                    </div>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border backdrop-blur-md shadow-sm ${project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : project.status === 'WARRANTY_PERIOD' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                            <span className={`w-2 h-2 rounded-full ${project.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : project.status === 'WARRANTY_PERIOD' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                            {project.status === 'WARRANTY_PERIOD' ? 'WARRANTY PERIOD' : project.status}
                        </span>
                    </motion.div>
                </header>

                {/* 2. SaaS Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* LEFT COLUMN: Main Workspace Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {stats.map((stat, i) => (
                                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + (i * 0.05) }}>
                                    <Card className="flex flex-col gap-2 p-4 h-full relative overflow-hidden group">
                                        <div className="flex items-center justify-between text-muted-foreground/80 relative z-10">
                                            <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                                            <stat.icon size={16} className={`${stat.color} opacity-80`} />
                                        </div>
                                        <div className="text-2xl font-bold text-foreground tracking-tight relative z-10 truncate">
                                            {stat.value}
                                        </div>
                                        <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
                                            <stat.icon size={64} />
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Modules / Workspaces */}
                        <div className="space-y-4 pt-2">
                            <h2 className="text-lg font-bold text-foreground px-1 flex items-center gap-2">
                                <Command size={18} className="opacity-50 text-blue-500" />
                                Project Workspaces
                            </h2>
                            <div className="grid grid-cols-1 gap-3">
                                {modules.map((mod, i) => {
                                    const Icon = mod.icon;
                                    return (
                                        <Link key={mod.title} href={mod.href} className="block group">
                                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.05) }}>
                                                <Card hoverEffect className="flex flex-col sm:flex-row sm:items-center justify-between p-4 group-hover:border-blue-500/30 transition-all gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${mod.bg} transition-transform duration-300 group-hover:scale-105`}>
                                                            <Icon size={24} className={mod.iconColor} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                {mod.title}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                                {mod.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-muted-foreground/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shrink-0 whitespace-nowrap">
                                                        Access Workspace
                                                        <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar Details */}
                    <div className="lg:col-span-1 space-y-6 relative">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="sticky top-6">
                            <Card className="p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-black/5 dark:border-white/5 pb-3 flex items-center gap-2">
                                    <Activity size={14} />
                                    About Project
                                </h3>

                                <dl className="space-y-4">
                                    <div className="group">
                                        <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                                            <Building size={14} className="opacity-70 group-hover:text-blue-500 transition-colors" />
                                            Client / Owner
                                        </dt>
                                        <dd className="text-sm font-semibold text-foreground pl-6">
                                            {project.client?.name || 'Internal Project'}
                                        </dd>
                                    </div>

                                    <div className="group">
                                        <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                                            <MapPin size={14} className="opacity-70 group-hover:text-amber-500 transition-colors" />
                                            Location
                                        </dt>
                                        <dd className="text-sm font-semibold text-foreground pl-6">
                                            {project.location || 'No Location specified'}
                                        </dd>
                                    </div>

                                    <div className="group">
                                        <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                                            <ClipboardList size={14} className="opacity-70 group-hover:text-emerald-500 transition-colors" />
                                            Contract Type
                                        </dt>
                                        <dd className="text-sm font-semibold text-foreground pl-6">
                                            {project.contract_type || 'N/A'}
                                        </dd>
                                    </div>

                                    <div className="group">
                                        <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                                            <Calendar size={14} className="opacity-70 group-hover:text-purple-500 transition-colors" />
                                            Timeline
                                        </dt>
                                        <dd className="text-sm font-semibold text-foreground pl-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                                                    <span className="text-xs text-muted-foreground">Start</span>
                                                    <span>{project.target_start_date ? new Date(project.target_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
                                                </div>
                                                <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                                                    <span className="text-xs text-muted-foreground">End</span>
                                                    <span>{project.target_end_date ? new Date(project.target_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
                                                </div>
                                            </div>
                                        </dd>
                                    </div>
                                </dl>
                            </Card>
                        </motion.div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
