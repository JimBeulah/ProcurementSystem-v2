import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { Card } from '@/Components/UI/Card';
import { ClientCard } from '@/Components/Clients/ClientCard';
import Modal from '@/Components/UI/Modal';
import Select from '@/Components/UI/Select';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, Building2, FileText, Filter,
    LayoutGrid, List as ListIcon, TrendingUp, ShieldCheck,
    CreditCard, Loader2, Edit2, Trash2, Factory
} from 'lucide-react';

export default function ClientsIndex() {
    const { clients: initialClients } = usePage().props;
    const clients = initialClients || [];
    const { can } = usePermissions();

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [filterType, setFilterType] = useState('All');
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

    const filtered = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.contacts && c.contacts.some(contact => contact.name.toLowerCase().includes(searchTerm.toLowerCase())));
        return matchesSearch;
    });

    const activeContracts = clients.filter(c => (c.projects_count || 0) > 0).length;
    const totalContacts = clients.reduce((acc, c) => acc + (c.contacts?.length || 0), 0);

    return (
        <AuthenticatedLayout>
            <Head title="Clients" />

            <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
                {/* Stats Row — macOS widget style */}
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

                {/* macOS-style Toolbar */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 group-focus-within:text-blue-500 transition-colors duration-150" size={15} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-black/[0.03] dark:bg-white/[0.04] border-none focus:bg-white dark:focus:bg-white/[0.08] rounded-lg outline-none ring-0 focus:ring-2 focus:ring-blue-500/25 text-[13px] text-foreground placeholder:text-black/30 dark:placeholder:text-white/30 transition-all duration-200 font-medium"
                        />
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Add Button */}
                        {can('manage clients') && (
                            <button
                                onClick={() => {
                                    setEditingClient(null);
                                    resetForm();
                                    setShowModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all duration-150 text-[13px] whitespace-nowrap shadow-sm cursor-pointer"
                            >
                                <Plus size={15} strokeWidth={2.5} /> Add Client
                            </button>
                        )}

                        {/* View Toggle — segmented control */}
                        <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.04] p-0.5 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer ${viewMode === 'grid'
                                    ? 'bg-white dark:bg-white/[0.1] text-foreground shadow-sm'
                                    : 'text-black/40 dark:text-white/40 hover:text-foreground'
                                    }`}
                                title="Grid View"
                            >
                                <LayoutGrid size={15} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer ${viewMode === 'list'
                                    ? 'bg-white dark:bg-white/[0.1] text-foreground shadow-sm'
                                    : 'text-black/40 dark:text-white/40 hover:text-foreground'
                                    }`}
                                title="List View"
                            >
                                <ListIcon size={15} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Client Grid / List */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-5">
                            <Factory className="text-black/20 dark:text-white/20" size={28} />
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-1">No clients found</h3>
                        <p className="text-[13px] text-black/40 dark:text-white/40 max-w-xs mx-auto">
                            Try adjusting your search or add a new client to get started.
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filtered.map(client => (
                                <ClientCard key={client.id} client={client} onEdit={handleEdit} onDelete={() => confirmDelete(client)} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {filtered.map(client => (
                                <motion.div
                                    key={client.id}
                                    layout
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl rounded-xl hover:bg-white/90 dark:hover:bg-white/[0.05] transition-all duration-200 group gap-4 cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-[14px] bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
                                            <Building2 size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-[14px] font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{client.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-mono text-black/30 dark:text-white/30">#{client.id}</span>
                                                <span className="text-[11px] text-black/40 dark:text-white/40 flex items-center gap-1">
                                                    <Users size={11} /> {client.contacts?.length || 0} Contacts
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-black/[0.04] dark:border-white/[0.04]">
                                        {client.contacts && client.contacts.length > 0 && (
                                            <div className="text-left md:text-right hidden sm:block">
                                                <p className="text-[10px] text-black/30 dark:text-white/30 uppercase font-medium tracking-wider">Primary Contact</p>
                                                <p className="text-[13px] font-medium text-foreground">{client.contacts[0].name}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 pl-3 md:border-l border-black/[0.04] dark:border-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity">
                                            {can('manage clients') && (
                                                <>
                                                    <button onClick={() => handleEdit(client)} className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-black/40 dark:text-white/40 hover:text-blue-600 rounded-lg transition-all cursor-pointer" title="Edit">
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button onClick={() => confirmDelete(client)} className="p-2 hover:bg-red-500/10 text-black/40 dark:text-white/40 hover:text-red-500 rounded-lg transition-all cursor-pointer" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

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
                <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Client" maxWidth="max-w-md">
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-red-700 dark:text-red-400">
                                    Are you sure you want to delete <span className="font-bold">{clientToDelete?.name}</span>?
                                </p>
                                <p className="text-[12px] text-red-600/70 dark:text-red-400/70 mt-1">
                                    This action cannot be undone. Deletion will fail if the client has linked projects.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2.5 pt-1">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2.5 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground font-medium rounded-xl transition-all text-[13px] cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-xl transition-all text-[13px] shadow-sm cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
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
