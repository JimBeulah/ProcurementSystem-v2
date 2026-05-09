import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { UserCog, Plus, Edit2, UserCheck, UserX, KeyRound, Save, MoreVertical, Filter, Shield, Activity } from 'lucide-react';
import { DataTable } from '@/Components/UI/DataTable';
import Select from '@/Components/UI/Select';
import Dropdown from '@/Components/Dropdown';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import Modal from '@/Components/UI/Modal';

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
    const { auth } = usePage().props;
    const isEdit = !!user;
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        username: user?.username ?? '',
        role: user?.role ?? 'site_engineer',
        is_active: user ? Boolean(user.is_active) : true,
    });

    const isActive = Boolean(data.is_active);
    const isSelf = isEdit && Number(user.id) === Number(auth?.user?.id);

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('users.update', user.id), { 
                onSuccess: () => { reset(); onClose(); },
                preserveScroll: true,
                preserveState: true,
            });
        } else {
            post(route('users.store'), { 
                onSuccess: () => { reset(); onClose(); },
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title={isEdit ? `Edit Profile: ${user.name}` : 'Add New User'}
            maxWidth="max-w-lg"
        >
            <form onSubmit={submit} className="space-y-5 py-2 px-1">
                {/* Name */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input
                        type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-sm"
                        placeholder="e.g. Juan dela Cruz" required
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-5">
                    {/* Username */}
                    <div className="col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
                        <input
                            type="text" value={data.username} onChange={e => setData('username', e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-mono shadow-sm"
                            placeholder="jdelacruz" required
                        />
                        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                    </div>

                    {/* Role */}
                    <div className="col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
                        <select
                            value={data.role} onChange={e => setData('role', e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-sm appearance-none"
                        >
                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                    </div>
                </div>

                {/* Email (optional) */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email Address <span className="text-slate-400 font-normal capitalize">(optional)</span></label>
                    <input
                        type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-sm"
                        placeholder="e.g. juan@company.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Account Status Toggle (Only show in edit mode) */}
                {isEdit && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Account Status</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    {isSelf ? "You cannot deactivate your own account." : `Mark this user as ${isActive ? 'Inactive' : 'Active'}.`}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => setData('is_active', !isActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                                    isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                } ${isSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span
                                    className={`${
                                        isActive ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
                                    <UserCheck size={12} /> Active Account
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase border border-red-500/20">
                                    <UserX size={12} /> Inactive Account
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Default Password Notice */}
                {!isEdit && (
                    <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                        <KeyRound size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tight">Security Notice</p>
                            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 leading-relaxed">
                                Default password will be set to <strong className="font-mono bg-blue-500/10 px-1 rounded text-blue-700 dark:text-blue-300">password123</strong>. The user will be required to change it immediately upon their first successful login.
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={processing} 
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                        <Save size={16} />
                        {isEdit ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ---------- Page ----------
export default function UsersIndex() {
    const { users, auth } = usePage().props;
    const [modal, setModal] = useState(null); // null | 'add' | { user object }
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });

    const filteredUsers = React.useMemo(() => {
        return (users || []).filter(u => {
            const roleMatch = roleFilter === 'all' || u.role === roleFilter;
            const statusMatch = statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active);
            return roleMatch && statusMatch;
        });
    }, [users, roleFilter, statusFilter]);

    const handleToggleActive = React.useCallback((user) => {
        router.patch(route('users.toggle-active', user.id), {}, {
            preserveScroll: true,
        });
    }, []);

    const handleResetPassword = React.useCallback((user) => {
        setConfirmModal({ isOpen: true, user });
    }, []);

    const executeResetPassword = () => {
        if (!confirmModal.user) return;
        router.patch(route('users.reset-password', confirmModal.user.id), {}, {
            preserveScroll: true,
        });
    };

    // Define TanStack columns mimicking exactly what was there before
    const columns = React.useMemo(() => [
        {
            accessorKey: 'name',
            header: 'User',
            enableSorting: false,
            cell: ({ row }) => {
                const u = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.email || '—'}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'username',
            header: 'Username',
            enableSorting: false,
            cell: ({ getValue }) => (
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                    {getValue() || '—'}
                </span>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            enableSorting: false,
            cell: ({ getValue }) => {
                const role = getValue();
                return (
                    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${roleBadge(role)}`}>
                        {roleLabel(role)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            enableSorting: false,
            cell: ({ row }) => {
                const u = row.original;
                return (
                    <div className="flex flex-col gap-1 w-fit">
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
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full">Actions</div>,
            enableSorting: false,
            meta: { className: "overflow-visible" },
            cell: ({ row }) => {
                const u = row.original;
                return (
                    <div className="flex justify-center items-center overflow-visible">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                                    <MoreVertical size={16} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setModal(u)}
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                                >
                                    <Edit2 size={14} className="text-blue-500" /> Edit User
                                </button>

                                {u.id !== auth?.user?.id && (
                                    <>
                                        <button
                                            onClick={() => handleResetPassword(u)}
                                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                                        >
                                            <KeyRound size={14} className="text-amber-500" /> Reset Password
                                        </button>

                                        <button
                                            onClick={() => handleToggleActive(u)}
                                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                                        >
                                            {u.is_active ? (
                                                <><UserX size={14} className="text-red-500" /> Deactivate User</>
                                            ) : (
                                                <><UserCheck size={14} className="text-emerald-500" /> Activate User</>
                                            )}
                                        </button>
                                    </>
                                )}
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                );
            },
        },
    ], [auth?.user?.id, handleResetPassword, handleToggleActive]);

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            {modal && (
                <UserModal
                    user={modal === 'add' ? null : modal}
                    onClose={() => setModal(null)}
                />
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, user: null })}
                onConfirm={executeResetPassword}
                title="Reset Password"
                message={`Reset password for "${confirmModal.user?.name}"? They will be required to change it on next login.`}
                confirmText="Reset Password"
                type="danger"
            />

            <div className="max-w-7xl mx-auto space-y-6">
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
                        { label: 'Total Users', value: (users || []).length, color: 'text-slate-900 dark:text-white' },
                        { label: 'Active', value: (users || []).filter(u => u.is_active).length, color: 'text-emerald-500' },
                        { label: 'Inactive', value: (users || []).filter(u => !u.is_active).length, color: 'text-red-500' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm">
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Table & Filters */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                    <DataTable
                        columns={columns}
                        data={filteredUsers}
                        showSearch={true}
                        showPagination={true}
                        overflowVisible={true}
                        customToolbar={
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mr-1">
                                    <Filter size={15} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Filters</span>
                                </div>

                                <div className="w-40">
                                    <Select
                                        value={roleFilter}
                                        onChange={setRoleFilter}
                                        icon={Shield}
                                        options={[
                                            { value: 'all', label: 'All Roles' },
                                            ...ROLES
                                        ]}
                                    />
                                </div>

                                <div className="w-40">
                                    <Select
                                        value={statusFilter}
                                        onChange={setStatusFilter}
                                        icon={Activity}
                                        options={[
                                            { value: 'all', label: 'All Status' },
                                            { value: 'active', label: 'Active' },
                                            { value: 'inactive', label: 'Inactive' },
                                        ]}
                                    />
                                </div>

                                {(roleFilter !== 'all' || statusFilter !== 'all') && (
                                    <button
                                        onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition whitespace-nowrap"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        }
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
