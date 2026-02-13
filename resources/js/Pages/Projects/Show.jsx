import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Briefcase, ClipboardList, Truck, ShoppingCart, ArrowRight,
    MapPin, Building, DollarSign
} from 'lucide-react';

export default function ProjectShow() {
    const { project } = usePage().props;

    if (!project) return <div className="p-12 text-center text-red-500">Project not found</div>;

    const modules = [
        {
            title: 'Bill of Quantities',
            description: 'Manage project budget limits, material requirements, and cost estimation.',
            icon: ClipboardList, color: 'orange', href: `/projects/${project.id}/boq`,
        },
        {
            title: 'Material Requests',
            description: 'Request materials from warehouse or procurement, track status.',
            icon: Truck, color: 'blue', href: `/projects/${project.id}/material-requests`,
        },
        {
            title: 'Procurement Status',
            description: 'Track POs, deliveries, and supplier performance for this project.',
            icon: ShoppingCart, color: 'cyan', href: '/purchasing/orders',
        },
    ];

    const colorMap = {
        orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', hover: 'group-hover:bg-orange-500/20' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', hover: 'group-hover:bg-blue-500/20' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', hover: 'group-hover:bg-cyan-500/20' },
    };

    return (
        <AuthenticatedLayout>
            <Head title={project.name} />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <header className="pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                <Link href="/projects" className="hover:text-cyan-600 transition-colors">Projects</Link>
                                <span>/</span>
                                <span>Dashboard</span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{project.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1"><Building size={14} /> {project.client?.name || 'Internal'}</div>
                                <div className="flex items-center gap-1"><MapPin size={14} /> {project.location || 'N/A'}</div>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'}`}>
                            {project.status}
                        </div>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 border-l-4 border-l-cyan-500">
                        <div className="text-slate-500 text-sm mb-1">Budget</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{Number(project.budget).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 border-l-4 border-l-orange-500">
                        <div className="text-slate-500 text-sm mb-1">BOQ Items</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{project.boq_items?.length || 0}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 border-l-4 border-l-blue-500">
                        <div className="text-slate-500 text-sm mb-1">Material Requests</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{project.material_requests?.length || 0}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 border-l-4 border-l-emerald-500">
                        <div className="text-slate-500 text-sm mb-1">Purchase Orders</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{project.purchase_orders?.length || 0}</div>
                    </div>
                </div>

                {/* Module Navigation */}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4">Project Modules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map(mod => {
                        const Icon = mod.icon;
                        const c = colorMap[mod.color];
                        return (
                            <Link key={mod.title} href={mod.href}>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 group h-full hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm hover:shadow-md">
                                    <div className={`p-4 ${c.bg} rounded-xl w-fit mb-4 ${c.hover} transition-colors`}>
                                        <Icon size={32} className={c.text} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{mod.title}</h3>
                                    <p className="text-slate-500 text-sm mb-4">{mod.description}</p>
                                    <div className={`flex items-center ${c.text} text-sm font-medium group-hover:gap-2 transition-all`}>
                                        View {mod.title} <ArrowRight size={16} className="ml-1" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
