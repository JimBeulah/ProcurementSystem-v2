import React from 'react';
import { usePage } from '@inertiajs/react';

const ROLE_CONFIG = {
    admin: { label: 'Administrator', color: 'indigo', dot: 'bg-indigo-500' },
    project_manager: { label: 'Project Manager', color: 'emerald', dot: 'bg-emerald-500' },
    procurement_officer: { label: 'Procurement Officer', color: 'purple', dot: 'bg-purple-500' },
    warehouse: { label: 'Warehouse Officer', color: 'amber', dot: 'bg-amber-500' },
    finance: { label: 'Finance Manager', color: 'pink', dot: 'bg-pink-500' },
    site_engineer: { label: 'Site Engineer', color: 'blue', dot: 'bg-blue-500' },
};

export function WelcomeBanner({ stats = {} }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const roleKey = user.role;
    const config = ROLE_CONFIG[roleKey] || { label: roleKey, color: 'slate', dot: 'bg-slate-500' };

    // Get a friendly greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const getRoleClasses = (role) => {
        const classes = {
            admin: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
            project_manager: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            procurement_officer: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            warehouse: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            finance: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
            site_engineer: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        };
        return classes[role] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    };

    return (
        <div className="flex flex-col gap-1 py-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Dashboard
                </h1>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getRoleClasses(roleKey)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`}></span>
                    {config.label}
                </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {greeting}, <span className="font-semibold text-slate-700 dark:text-slate-200">{user.name}</span>. {' '}
                {stats.message || `Here's what's happening today.`}
            </p>
        </div>
    );
}
