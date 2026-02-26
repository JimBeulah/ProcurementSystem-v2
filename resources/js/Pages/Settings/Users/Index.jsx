import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { UserCog, Plus, Edit2, UserCheck, UserX, X, Eye, EyeOff, KeyRound, Save } from 'lucide-react';

const ROLES = [
    { value: 'admin', label: 'Admin' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'site_engineer', label: 'Site Engineer' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'procurement_officer', label: 'Procurement Officer' },
    { value: 'finance', label: 'Finance' },
];

const roleBadge = (role) => {
    const map = {
        admin: 'bg-red-500/10 text-red-500 border-red-500/30',
        project_manager: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
        site_engineer: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
        warehouse: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
        procurement_officer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
        finance: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    };
    return map[role] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';
};

const roleLabel = (role) => ROLES.find(r => r.value === role)?.label || role;

// ---------- Modal ----------
function UserModal({ user, onClose }) {
    const isEdit = !!user;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        username: user?.username ?? '',
        role: user?.role ?? 'site_engineer',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('users.update', user.id), { onSuccess: () => { reset(); onClose(); } });
        } else {
            post(route('users.store'), { onSuccess: () => { reset(); onClose(); } });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCog size={16} className="text-blue-500" />
                        {isEdit ? 'Edit User' : 'Add New User'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={submit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
                        <input
                            type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                            placeholder="e.g. Juan dela Cruz" required
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Username <span className="text-slate-400 font-normal">(used to log in)</span></label>
                        <input
                            type="text" value={data.username} onChange={e => setData('username', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-mono"
                            placeholder="e.g. jdelacruz" required
                        />
                        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                    </div>

                    {/* Email (optional) */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input
                            type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                            placeholder="e.g. juan@company.com"
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Role</label>
                        <select
                            value={data.role} onChange={e => setData('role', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                        >
                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                    </div>

                    {/* Default Password Notice */}
                    {!isEdit && (
                        <div className="flex items-start gap-2.5 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                            <KeyRound size={14} className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                Default password will be set to <strong className="font-mono">password123</strong>. Ask the user to change it after first login.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing} className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition flex items-center justify-center gap-2">
                            <Save size={14} />
                            {isEdit ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ---------- Page ----------
export default function UsersIndex() {
    const { users, auth } = usePage().props;
    const list = users || [];
    const [modal, setModal] = useState(null); // null | 'add' | { user object }

    const handleToggleActive = (user) => {
        router.patch(route('users.toggle-active', user.id), {}, {
            preserveScroll: true,
        });
    };

    const handleResetPassword = (user) => {
        if (!window.confirm(`Reset password for "${user.name}"? They will be required to change it on next login.`)) return;
        router.patch(route('users.reset-password', user.id), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            {modal && (
                <UserModal
                    user={modal === 'add' ? null : modal}
                    onClose={() => setModal(null)}
                />
            )}

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <UserCog size={20} className="text-blue-500" /> User Management
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage system users, roles, and access.</p>
                    </div>
                    <button
                        onClick={() => setModal('add')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
                    >
                        <Plus size={15} /> Add User
                    </button>
                </header>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Users', value: list.length, color: 'text-slate-900 dark:text-white' },
                        { label: 'Active', value: list.filter(u => u.is_active).length, color: 'text-emerald-500' },
                        { label: 'Inactive', value: list.filter(u => !u.is_active).length, color: 'text-red-500' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm">
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-5 py-3">User</th>
                                <th className="px-5 py-3">Username</th>
                                <th className="px-5 py-3">Role</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {list.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    {/* User */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm shrink-0">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                                                <p className="text-xs text-slate-400">{u.email || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Username */}
                                    <td className="px-5 py-3.5">
                                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                                            {u.username || '—'}
                                        </span>
                                    </td>
                                    {/* Role */}
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${roleBadge(u.role)}`}>
                                            {roleLabel(u.role)}
                                        </span>
                                    </td>
                                    {/* Status */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-col gap-1">
                                            {u.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Inactive
                                                </span>
                                            )}
                                            {u.must_change_password && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full w-fit">
                                                    🔑 Temp PW
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Edit */}
                                            <button
                                                onClick={() => setModal(u)}
                                                title="Edit user"
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            {/* Reset Password */}
                                            {u.id !== auth?.user?.id && (
                                                <button
                                                    onClick={() => handleResetPassword(u)}
                                                    title="Reset password to default"
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition"
                                                >
                                                    <KeyRound size={14} />
                                                </button>
                                            )}
                                            {/* Toggle Active */}
                                            {u.id !== auth?.user?.id && (
                                                <button
                                                    onClick={() => handleToggleActive(u)}
                                                    title={u.is_active ? 'Deactivate user' : 'Activate user'}
                                                    className={`p-1.5 rounded-lg transition ${u.is_active ? 'text-slate-400 hover:text-red-500 hover:bg-red-500/10' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10'}`}
                                                >
                                                    {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {list.length === 0 && (
                        <div className="py-16 text-center text-slate-400">
                            <UserCog size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No users found. Create one to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
