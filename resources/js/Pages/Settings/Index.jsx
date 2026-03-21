import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Settings, UserCog, Database, ChevronRight, Package, Shield, UserCircle } from 'lucide-react';

export default function SettingsIndex() {
    const { auth } = usePage().props;
    const isAdmin = auth.user.role === 'admin';

    const menuItems = [
        { title: 'Account Settings', description: 'Update your profile information and change password.', icon: UserCircle, href: route('profile.edit'), color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { title: 'User Management', description: 'Manage system users, roles, and access permissions.', icon: UserCog, href: route('settings.users'), color: 'text-blue-500', bg: 'bg-blue-500/10', permission: 'manage users' },
        { title: 'Master Data', description: 'Manage suppliers, materials, and warehouse records.', icon: Database, href: route('settings.master-data'), color: 'text-rose-500', bg: 'bg-rose-500/10', permission: 'manage master data' },
        { title: 'Workflows', description: 'Configure approval hierarchy and spending limits.', icon: Shield, href: route('settings.workflows'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', permission: 'manage master data' },
        { title: 'Inventory Management', description: 'Configure inventory rules, stock alerts and valuation.', icon: Package, href: '#', color: 'text-amber-500', bg: 'bg-amber-500/10', permission: 'view settings' },
        { title: 'System Configuration', description: 'General settings, company details, and localization.', icon: Settings, href: '#', color: 'text-cyan-500', bg: 'bg-cyan-500/10', permission: 'view settings' },
        { title: 'Backup & Recovery', description: 'Create database backups and restore system data.', icon: Database, href: route('settings.database.index'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', adminOnly: true },
    ];

    const filteredItems = menuItems.filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.permission && !auth.permissions.includes(item.permission)) return false;
        return true;
    });

    return (
        <AuthenticatedLayout>
            <Head title="System Settings" />
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="pb-6 border-b border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Settings className="text-blue-500" /> System Settings
                    </h1>
                    <p className="text-slate-500">Select a category to manage your system.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.title} href={item.href} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 group hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm">
                                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform mb-4`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-500 transition-colors">{item.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
                                <div className="mt-4 flex items-center text-sm font-medium text-slate-400 group-hover:text-blue-500 transition-colors">
                                    Open Settings <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
