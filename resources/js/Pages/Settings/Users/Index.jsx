import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { Users, Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import Modal from '@/Components/UI/Modal';

export default function UsersIndex() {
    const { users } = usePage().props;
    const list = users || [];
    const [showModal, setShowModal] = useState(false);

    const roleBadge = (role) => {
        const colors = { ADMIN: 'text-red-500 border-red-500', PROJECT_MANAGER: 'text-blue-500 border-blue-500', PROCUREMENT_OFFICER: 'text-emerald-500 border-emerald-500', FINANCE: 'text-amber-500 border-amber-500' };
        return colors[role] || 'text-slate-400 border-slate-400';
    };

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><Users className="text-blue-500" /> User Management</h1>
                        <p className="text-slate-500">Manage system users, roles, and access permissions.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold"><Plus size={18} /> Add User</button>
                </header>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                            <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Joined</th><th className="p-4 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {list.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                                    <td className="p-4 text-slate-500">{u.email}</td>
                                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs border font-medium ${roleBadge(u.role)}`}>{u.role || 'USER'}</span></td>
                                    <td className="p-4 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 rounded"><Edit2 size={14} /></button>
                                            <button className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
