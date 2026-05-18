import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { Card } from '@/Components/UI/Card';
import Modal from '@/Components/UI/Modal';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import { DataTable } from '@/Components/UI/DataTable';
import Dropdown from '@/Components/Dropdown';
import {
    Users, Plus, Building2,
    TrendingUp, MoreVertical,
    Loader2, Edit2, Trash2
} from 'lucide-react';

export default function ClientsIndex() {
    const { clients: initialClients } = usePage().props;
    const clients = initialClients || [];
    const { can } = usePermissions();

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        contacts: [{ name: '', phone: '' }],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (editingClient) {
            router.put(`/clients/${editingClient.id}`, formData, {
                onSuccess: () => {
                    setShowModal(false);
                    setEditingClient(null);
                    resetForm();
                },
                onFinish: () => setSubmitting(false),
            });
        } else {
            router.post('/clients', formData, {
                onSuccess: () => {
                    setShowModal(false);
                    resetForm();
                },
                onFinish: () => setSubmitting(false),
            });
        }
    };

    const resetForm = () => {
        setFormData({ name: '', contacts: [{ name: '', phone: '' }] });
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            contacts: client.contacts?.length > 0 ? client.contacts : [{ name: '', phone: '' }],
        });
        setShowModal(true);
    };

    const confirmDelete = (client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (clientToDelete) {
            router.delete(`/clients/${clientToDelete.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setClientToDelete(null);
                },
            });
        }
    };

    const activeContracts = clients.filter(c => (c.projects_count || 0) > 0).length;
    const totalContacts = clients.reduce((acc, c) => acc + (c.contacts?.length || 0), 0);

    const columns = React.useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Client',
            enableSorting: false,
            cell: ({ row }) => {
                const c = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-slate-400">ID: #{c.id}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'contacts_count',
            header: 'Contacts',
            enableSorting: false,
            cell: ({ row }) => {
                const c = row.original;
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 w-fit">
                        <Users size={12} />
                        {c.contacts?.length || 0}
                    </span>
                );
            }
        },
        {
            id: 'primary_contact',
            header: 'Primary Contact',
            enableSorting: false,
            cell: ({ row }) => {
                const c = row.original;
                if (c.contacts && c.contacts.length > 0) {
                    return (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{c.contacts[0].name}</span>
                            {c.contacts[0].phone && (
                                <span className="text-[12px] text-slate-500 dark:text-slate-400">{c.contacts[0].phone}</span>
                            )}
                        </div>
                    );
                }
                return <span className="text-slate-400 dark:text-slate-500 italic text-sm">No contacts</span>;
            }
        },
        {
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full">Actions</div>,
            enableSorting: false,
            cell: ({ row }) => {
                const c = row.original;
                return (
                    <div className="flex justify-center items-center">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                                    <MoreVertical size={16} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {can('manage clients') && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(c)}
                                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                                        >
                                            <Edit2 size={14} className="text-blue-500" /> Edit Client
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(c)}
                                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                                        >
                                            <Trash2 size={14} className="text-red-500" /> Delete Client
                                        </button>
                                    </>
                                )}
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                );
            }
        }
    ], [can]);

    return (
        <AuthenticatedLayout>
            <Head title="Clients" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Clients"
                        value={clients.length.toString()}
                        icon={<Users size={18} />}
                        color="blue"
                    />
                    <StatCard
                        title="Active Contracts"
                        value={activeContracts.toString()}
                        icon={<TrendingUp size={18} />}
                        color="emerald"
                    />
                    <StatCard
                        title="Total Contacts"
                        value={totalContacts.toString()}
                        icon={<Users size={18} />}
                        color="orange"
                    />
                </div>

                {/* Table & Filters */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                    <DataTable
                        columns={columns}
                        data={clients}
                        showSearch={true}
                        showPagination={true}
                        overflowVisible={true}
                        customToolbar={
                            can('manage clients') && (
                                <button
                                    onClick={() => {
                                        setEditingClient(null);
                                        resetForm();
                                        setShowModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
                                >
                                    <Plus size={15} /> Add Client
                                </button>
                            )
                        }
                    />
                </div>

                {/* Create / Edit Modal */}
                <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingClient(null); }} title={editingClient ? "Edit Client" : "New Client"}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FormField label="Company Name" icon={<Building2 size={16} />}>
                            <input
                                className="form-input-macos"
                                placeholder="e.g. Acme Corp"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </FormField>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-medium text-black/40 dark:text-white/40 uppercase tracking-wider ml-0.5">Contacts</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, contacts: [...formData.contacts, { name: '', phone: '' }] })}
                                    className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus size={12} /> Add Contact
                                </button>
                            </div>

                            {formData.contacts.map((contact, index) => (
                                <div key={index} className="flex gap-2 items-start relative bg-black/[0.02] dark:bg-white/[0.02] p-2.5 rounded-xl border border-black/[0.03] dark:border-white/[0.03]">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            className="w-full px-3 py-2 bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/5 rounded-lg text-[13px] text-foreground focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-150 placeholder:text-black/25 dark:placeholder:text-white/25 font-medium"
                                            placeholder="Contact Name"
                                            value={contact.name}
                                            onChange={(e) => {
                                                const newContacts = [...formData.contacts];
                                                newContacts[index].name = e.target.value;
                                                setFormData({ ...formData, contacts: newContacts });
                                            }}
                                            required
                                        />
                                        <input
                                            className="w-full px-3 py-2 bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/5 rounded-lg text-[13px] text-foreground focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-150 placeholder:text-black/25 dark:placeholder:text-white/25 font-medium"
                                            placeholder="Phone Number (Optional)"
                                            value={contact.phone}
                                            onChange={(e) => {
                                                const newContacts = [...formData.contacts];
                                                newContacts[index].phone = e.target.value;
                                                setFormData({ ...formData, contacts: newContacts });
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newContacts = formData.contacts.filter((_, i) => i !== index);
                                            setFormData({ ...formData, contacts: newContacts });
                                        }}
                                        className="mt-1 p-2 text-red-500/70 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                        title="Remove Contact"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {formData.contacts.length === 0 && (
                                <p className="text-xs text-black/40 dark:text-white/40 italic">No contacts added.</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2.5 pt-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 py-2.5 rounded-xl text-white font-semibold text-[13px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-150 shadow-sm cursor-pointer"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : (editingClient ? 'Update Client' : 'Add Client')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-full py-2.5 text-black/40 dark:text-white/40 hover:text-foreground font-medium transition-colors text-[13px] cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => { setShowDeleteModal(false); setClientToDelete(null); }}
                    onConfirm={handleDelete}
                    title="Delete Client"
                    message={`Are you sure you want to delete the client "${clientToDelete?.name}"? This action cannot be undone and will fail if the client has linked projects.`}
                    confirmText="Delete Client"
                    type="danger"
                />
            </div>
        </AuthenticatedLayout>
    );
}

/* ── macOS-style Stat Widget ─────────────────────────────── */
const colorMap = {
    blue: { bg: 'bg-blue-500/10 dark:bg-blue-400/10', text: 'text-blue-600 dark:text-blue-400' },
    emerald: { bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', text: 'text-emerald-600 dark:text-emerald-400' },
    orange: { bg: 'bg-orange-500/10 dark:bg-orange-400/10', text: 'text-orange-600 dark:text-orange-400' },
};

function StatCard({ title, value, icon, color }) {
    const c = colorMap[color] || colorMap.blue;
    return (
        <Card className="p-5 rounded-2xl border-none">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-[14px] ${c.bg} ${c.text} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-foreground tracking-tight leading-none">{value}</p>
                    <p className="text-[11px] font-medium text-black/40 dark:text-white/40 mt-1 uppercase tracking-wider">{title}</p>
                </div>
            </div>
        </Card>
    );
}

/* ── macOS Form Field wrapper ────────────────────────────── */
function FormField({ label, icon, children }) {
    const hasIcon = !!icon;
    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-black/40 dark:text-white/40 uppercase tracking-wider ml-0.5">{label}</label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/25 dark:text-white/25 pointer-events-none z-10">
                        {icon}
                    </div>
                )}
                {React.Children.map(children, child => {
                    // Don't inject styles if it's a custom component (like our Select)
                    if (typeof child.type !== 'string') return child;

                    return React.cloneElement(child, {
                        className: `${child.props.className || ''} w-full ${hasIcon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border-none rounded-xl text-[13px] text-foreground focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-150 placeholder:text-black/25 dark:placeholder:text-white/25 font-medium`.trim()
                    });
                })}
            </div>
        </div>
    );
}
