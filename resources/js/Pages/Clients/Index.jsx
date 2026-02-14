import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import { ClientCard } from '@/Components/Clients/ClientCard';
import Modal from '@/Components/UI/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, Building2, Phone, FileText, Filter,
    LayoutGrid, List as ListIcon, TrendingUp, ShieldCheck,
    CreditCard, Loader2, ChevronRight, Edit2, Trash2,
} from 'lucide-react';

export default function ClientsIndex() {
    const { clients: initialClients } = usePage().props;
    const clients = initialClients || [];

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
        contact_person: '',
        contract_type: 'Lump Sum',
        payment_terms: '30 Days',
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
        setFormData({ name: '', contact_person: '', contract_type: 'Lump Sum', payment_terms: '30 Days' });
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            contact_person: client.contact_person || '',
            contract_type: client.contract_type || 'Lump Sum',
            payment_terms: client.payment_terms || '30 Days',
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
            c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'All' || c.contract_type === filterType;
        return matchesSearch && matchesFilter;
    });

    const activeContracts = clients.filter(c => (c.projects_count || 0) > 0).length;
    const lsumContracts = clients.filter(c => c.contract_type === 'Lump Sum').length;

    return (
        <AuthenticatedLayout>
            <Head title="Clients" />

            <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-0">
                {/* Stats - Compact Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Clients"
                        value={clients.length.toString()}
                        icon={<Users className="text-blue-500" size={18} />}
                        trend="Total"
                        color="bg-blue-500/10 text-blue-600"
                    />
                    <StatCard
                        title="Active Contracts"
                        value={activeContracts.toString()}
                        icon={<TrendingUp className="text-emerald-500" size={18} />}
                        trend="Active"
                        color="bg-emerald-500/10 text-emerald-600"
                    />
                    <StatCard
                        title="Lump Sum"
                        value={lsumContracts.toString()}
                        icon={<ShieldCheck className="text-orange-500" size={18} />}
                        trend="Standard"
                        color="bg-orange-500/10 text-orange-600"
                    />
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/50 focus:border-blue-500/50 rounded-xl outline-none ring-0 focus:ring-2 focus:ring-blue-500/20 text-sm text-foreground placeholder:text-muted transition-all font-medium shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setEditingClient(null);
                                resetForm();
                                setShowModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 font-bold transition-all text-sm whitespace-nowrap"
                        >
                            <Plus size={16} /> Add Client
                        </motion.button>
                        <div className="relative flex-1 md:flex-none">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full md:w-auto pl-9 pr-8 py-2.5 bg-card border border-border/50 focus:border-blue-500/50 rounded-xl outline-none ring-0 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-foreground cursor-pointer appearance-none transition-all shadow-sm"
                            >
                                <option value="All" className="bg-card text-foreground">All Types</option>
                                <option value="Lump Sum" className="bg-card text-foreground">Lump Sum</option>
                                <option value="Cost Plus" className="bg-card text-foreground">Cost Plus</option>
                                <option value="Unit Price" className="bg-card text-foreground">Unit Price</option>
                            </select>
                        </div>
                        <div className="flex items-center bg-card border border-border/50 p-1 rounded-xl shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                                title="List View"
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Client Grid/List */}
                {filtered.length === 0 ? (
                    <div className="text-center py-24 rounded-3xl bg-muted/10">
                        <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Users className="text-muted-foreground" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No clients found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">Try adjusting your search or add a new client to get started.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filtered.map(client => (
                                <ClientCard key={client.id} client={client} onEdit={handleEdit} onDelete={() => confirmDelete(client)} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filtered.map(client => (
                                <motion.div
                                    key={client.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all group gap-4 border border-border/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-foreground group-hover:text-blue-600 transition-colors">{client.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">ID: {client.id}</span>
                                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                    <Users size={12} /> {client.contact_person || 'No contact'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border/50">
                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Contract</p>
                                            <p className="text-sm font-semibold text-foreground">{client.contract_type}</p>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Terms</p>
                                            <p className="text-sm font-semibold text-foreground">{client.payment_terms}</p>
                                        </div>
                                        <div className="flex items-center gap-2 pl-4 md:border-l border-border/50">
                                            <button onClick={() => handleEdit(client)} className="p-2 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 rounded-xl transition-colors" title="Edit">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => confirmDelete(client)} className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-colors" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Edit/Create Modal */}
                <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingClient(null); }} title={editingClient ? "Edit Client" : "New Client"}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Company Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    className="w-full bg-white/50 dark:bg-black/20 focus:bg-background border border-border/50 rounded-2xl pl-12 pr-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                                    placeholder="e.g. Acme Corp"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Contact Person</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    className="w-full bg-white/50 dark:bg-black/20 focus:bg-background border border-border/50 rounded-2xl pl-12 pr-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                                    placeholder="Full name of representative"
                                    value={formData.contact_person}
                                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Contract Type</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <select
                                        className="w-full bg-white/50 dark:bg-black/20 focus:bg-background border border-border/50 rounded-2xl pl-12 pr-8 py-3 text-sm text-foreground focus:ring-2 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer shadow-sm"
                                        value={formData.contract_type}
                                        onChange={e => setFormData({ ...formData, contract_type: e.target.value })}
                                    >
                                        <option value="Lump Sum" className="bg-card text-foreground">Lump Sum</option>
                                        <option value="Cost Plus" className="bg-card text-foreground">Cost Plus</option>
                                        <option value="Unit Price" className="bg-card text-foreground">Unit Price</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Payment Terms</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        className="w-full bg-white/50 dark:bg-black/20 focus:bg-background border border-border/50 rounded-2xl pl-12 pr-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                                        placeholder="e.g. 30 Days"
                                        value={formData.payment_terms}
                                        onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 py-3.5 rounded-2xl text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-all"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingClient ? 'Update Profile' : 'Establish Client')}
                            </motion.button>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-full py-3 text-muted-foreground hover:text-foreground font-semibold transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-4">
                            <div className="p-2 bg-red-500/20 text-red-600 rounded-xl">
                                <Trash2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-red-600">Delete Client?</h3>
                                <p className="text-sm text-red-600/80 mt-1">
                                    Are you sure you want to delete <span className="font-bold">{clientToDelete?.name}</span>? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-muted">
                            Note: Deletion will fail if the client has existing projects linked to them. Please remove linked projects first.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 bg-muted/20 hover:bg-muted/30 text-foreground font-semibold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                            >
                                Delete Client
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, icon, trend, color }) {
    return (
        <Card className="relative overflow-hidden group bg-card p-4 shadow-sm hover:shadow-md transition-all rounded-2xl border-none">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${color} transition-colors`}>
                    {icon}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${color}`}>{trend}</span>
            </div>
            <div>
                <h3 className="text-2xl font-extrabold text-foreground mb-0.5 tracking-tight font-heading">{value}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide opacity-80">{title}</p>
            </div>
        </Card>
    );
}
