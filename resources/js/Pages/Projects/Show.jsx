import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Briefcase, ClipboardList, Truck, ShoppingCart,
    MapPin, Building, PhilippinePeso, Calendar, Activity, RotateCcw,
    Plus, Info, Ruler, Wallet, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/Components/UI/Card';
import MagneticGridBackground from '@/Components/UI/MagneticGridBackground';
import { cn } from '@/Utils/cn';

const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP',
    });
};

const formatDate = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

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
            title: 'Resource Requests',
            description: 'Request resources (Materials, Labor, Equipment) from BOQ tracking.',
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
        {
            title: 'Budget',
            value: formatCurrency(project.budget),
            icon: <PhilippinePeso size={20} className="text-emerald-600 dark:text-emerald-400" />,
            color: 'from-emerald-500 to-teal-500',
            hideForSiteEngineer: true
        },
        {
            title: 'Total Profit',
            value: formatCurrency(project.total_profit),
            icon: <Activity size={20} className="text-purple-600 dark:text-purple-400" />,
            color: 'from-purple-500 to-indigo-500',
            hideForSiteEngineer: true
        },
        {
            title: 'BOQ Items',
            value: project.boq_items?.length || 0,
            icon: <ClipboardList size={20} className="text-orange-600 dark:text-orange-400" />,
            color: 'from-orange-500 to-amber-500',
            hideForSiteEngineer: true
        },
        {
            title: 'Resource Requests',
            value: project.material_requests?.length || 0,
            icon: <Truck size={20} className="text-blue-600 dark:text-blue-400" />,
            color: 'from-blue-500 to-indigo-500'
        },
        {
            title: 'Purchases',
            value: project.purchase_orders?.length || 0,
            icon: <ShoppingCart size={20} className="text-cyan-600 dark:text-cyan-400" />,
            color: 'from-cyan-500 to-teal-500',
            hideForSiteEngineer: true
        },
    ].filter(stat => !(isSiteEngineer && stat.hideForSiteEngineer));

    // Calculate timeline progress
    const calculateProgress = () => {
        if (!project.target_start_date || !project.target_end_date) return 0;
        const start = new Date(project.target_start_date);
        const end = new Date(project.target_end_date);
        const today = new Date();
        if (today < start) return 0;
        if (today > end) return 100;
        const total = end - start;
        const elapsed = today - start;
        return Math.round((elapsed / total) * 100);
    };

    const progress = calculateProgress();

    return (
        <AuthenticatedLayout>
            <Head title={project.name} />

            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                {/* 1. Compact Header */}
                <header className="relative py-4 px-6 overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 bg-gradient-to-br from-white/50 to-slate-50/50 dark:from-white/5 dark:to-transparent backdrop-blur-xl group/header">
                    <MagneticGridBackground />
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover/header:bg-blue-500/20 transition-colors duration-1000" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-black/5 dark:border-white/10"
                            >
                                <Briefcase size={24} className="text-blue-500" />
                            </motion.div>
                            <div className="space-y-0.5">
                                <motion.h1
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl font-black text-foreground tracking-tight"
                                >
                                    {project.name}
                                </motion.h1>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                                    <span className="flex items-center gap-1">
                                        <Building size={12} />
                                        {project.client?.name || 'Internal'}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span className="flex items-center gap-1">
                                        <MapPin size={12} />
                                        {project.location || 'No Location'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className={cn(
                                "inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md",
                                project.status === 'ACTIVE'
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : project.status === 'WARRANTY_PERIOD'
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                            )}>
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    project.status === 'ACTIVE' ? "bg-emerald-500 animate-pulse" : project.status === 'WARRANTY_PERIOD' ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                                )} />
                                {project.status?.replace('_', ' ')}
                            </div>
                        </motion.div>
                    </div>
                </header>

                {/* 2. Workspaces Grid (Immediate Access) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {modules.map((mod, i) => {
                        const Icon = mod.icon;
                        return (
                            <Link key={mod.title} href={mod.href} className="group">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card hoverEffect className="flex flex-col items-center text-center p-4 h-full border-black/5 dark:border-white/5 shadow-sm group-hover:border-blue-500/30">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-inner mb-3",
                                            mod.bg
                                        )}>
                                            <Icon size={24} className={mod.iconColor} />
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {mod.title}
                                        </h3>
                                    </Card>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>

                {/* 3. Stats and Details Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Condensed Stats Column */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (i * 0.05) }}
                            >
                                <Card className="flex items-center gap-4 p-4 border-black/5 dark:border-white/5 bg-white/40 dark:bg-zinc-900/40 shadow-sm relative overflow-hidden group">
                                    <div className={`absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br ${stat.color} rounded-full blur-2xl opacity-5 group-hover:opacity-10 transition-opacity`} />
                                    <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-black/5 dark:border-white/10 shadow-sm relative z-10">
                                        {stat.icon}
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">{stat.title}</p>
                                        <h3 className="text-lg font-bold text-foreground tracking-tight">{stat.value}</h3>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Timeline Progress integrated into stats area */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="sm:col-span-2"
                        >
                            <Card className="p-4 border-black/5 dark:border-white/5 bg-blue-500/5 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-2 opacity-[0.03] pointer-events-none">
                                    <Calendar size={48} />
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                        <Activity size={12} className="text-blue-500" />
                                        Execution Progress
                                    </h3>
                                    <span className="font-mono text-xs text-blue-500 font-black">{progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                                    <span>Start: {formatDate(project.target_start_date)}</span>
                                    <span>Target End: {formatDate(project.target_end_date)}</span>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Sidebar Details Optimized */}
                    <div className="lg:col-span-1 space-y-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <Card className="p-5 border-black/5 dark:border-white/5 bg-white/40 dark:bg-zinc-900/40">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 flex items-center gap-2">
                                    <Info size={14} className="text-emerald-500" />
                                    Project Specs
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                    <DetailItem
                                        icon={<Building size={12} className="text-blue-500" />}
                                        label="Engineer"
                                        value={project.site_engineer?.name || 'Unassigned'}
                                    />
                                    <DetailItem
                                        icon={<Ruler size={12} className="text-orange-500" />}
                                        label="Area"
                                        value={project.total_floor_area ? `${Number(project.total_floor_area).toLocaleString()} sqm` : 'N/A'}
                                    />
                                    <DetailItem
                                        icon={<FileText size={12} className="text-purple-500" />}
                                        label="Contract ID"
                                        value={project.contract_id || 'N/A'}
                                    />
                                    <DetailItem
                                        icon={<Wallet size={12} className="text-emerald-500" />}
                                        label="Fund"
                                        value={project.source_of_fund || 'N/A'}
                                    />
                                </div>

                                <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex flex-col gap-2">
                                    <Link
                                        href={`/projects/${project.id}/material-requests`}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 group"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest ml-1">New Resource Request</span>
                                        <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                                    </Link>
                                    {auth.user.role === 'admin' && (
                                        <Link
                                            href="/projects"
                                            className="flex items-center justify-center p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground transition-all border border-black/5 dark:border-white/5"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">Back to Directory</span>
                                        </Link>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function DetailItem({ icon, label, value }) {
    return (
        <div className="group flex flex-col gap-0.5">
            <dt className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                {icon}
                {label}
            </dt>
            <dd className="text-xs font-bold text-foreground pl-4 border-l border-transparent group-hover:border-blue-500/30 transition-all truncate">
                {value}
            </dd>
        </div>
    );
}

