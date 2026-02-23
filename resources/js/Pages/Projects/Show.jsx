import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Briefcase, ClipboardList, Truck, ShoppingCart, ArrowRight,
    MapPin, Building, PhilippinePeso, Calendar, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProjectShow() {
    const { project } = usePage().props;

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
            title: 'Procurement Status',
            description: 'Track POs, deliveries, and supplier performance.',
            icon: ShoppingCart,
            color: 'from-cyan-500 to-teal-500',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-500/10',
            href: '/purchasing/orders',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={project.name} />

            <div className="p-6 max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <header className="relative">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1">
                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground/60 mb-3 font-medium">
                                <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                                <span className="text-muted-foreground/30">/</span>
                                <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
                                <span className="text-muted-foreground/30">/</span>
                                <span className="text-foreground">{project.code || 'Details'}</span>
                            </div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl font-bold text-foreground tracking-tight"
                            >
                                {project.name}
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground"
                            >
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/5">
                                    <Building size={14} className="opacity-70" />
                                    <span>{project.client?.name || 'Internal Project'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/5">
                                    <MapPin size={14} className="opacity-70" />
                                    <span>{project.location || 'No Location'}</span>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold border backdrop-blur-md shadow-sm self-start
                                ${project.status === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                        >
                            <span className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${project.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                {project.status}
                            </span>
                        </motion.div>
                    </div>
                </header>

                {/* Stats Grid - Glass Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Budget', value: Number(project.budget).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }), icon: PhilippinePeso, color: 'text-emerald-500' },
                        { label: 'BOQ Items', value: project.boq_items?.length || 0, icon: ClipboardList, color: 'text-orange-500' },
                        { label: 'Material Requests', value: project.material_requests?.length || 0, icon: Truck, color: 'text-blue-500' },
                        { label: 'Purchase Orders', value: project.purchase_orders?.length || 0, icon: ShoppingCart, color: 'text-purple-500' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + (i * 0.05) }}
                            className="relative overflow-hidden p-5 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm group hover:shadow-md transition-all"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <stat.icon size={64} />
                            </div>
                            <div className="flex flex-col relative z-10">
                                <span className="text-sm font-medium text-muted-foreground/80">{stat.label}</span>
                                <span className="text-2xl font-bold text-foreground mt-1 tracking-tight">{stat.value}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Modules Navigation */}
                <div className="pt-2">
                    <h2 className="text-lg font-bold text-foreground mb-4 px-1">Project Modules</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {modules.map((mod, i) => {
                            const Icon = mod.icon;
                            return (
                                <Link key={mod.title} href={mod.href}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + (i * 0.05) }}
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        className="h-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 transition-all duration-300 group relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mod.color} opacity-5 rounded-bl-[100px] transition-all group-hover:scale-110 duration-700`} />

                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mod.bg} group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon size={24} className={mod.iconColor} />
                                        </div>

                                        <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {mod.title}
                                        </h3>

                                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                            {mod.description}
                                        </p>

                                        <div className="flex items-center text-sm font-semibold text-foreground/80 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-auto">
                                            Access Module
                                            <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
