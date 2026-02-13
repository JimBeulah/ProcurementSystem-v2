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

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this client? This will fail if the client has existing projects.')) {
            router.delete(`/clients/${id}`);
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

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2 font-heading">
                            <Users className="text-blue-600" size={24} /> Client Management
                        </h1>
                        <p className="text-muted mt-0.5 text-sm font-medium">Manage client profiles, contracts, and billing terms.</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                            setEditingClient(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10 font-bold transition-all text-sm"
                    >
                        <Plus size={18} /> Add New Client
                    </motion.button>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Total Clients" value={clients.length.toString()} icon={<Users className="text-blue-600" size={20} />} trend="Registered" color="from-blue-500/10" />
                    <StatCard title="Active Contracts" value={activeContracts.toString()} icon={<TrendingUp className="text-emerald-600" size={20} />} trend="In Progress" color="from-emerald-500/10" />
                    <StatCard title="Lump Sum Terms" value={lsumContracts.toString()} icon={<ShieldCheck className="text-orange-600" size={20} />} trend="Standard" color="from-orange-500/10" />
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-1.5 bg-muted/5 border border-border rounded-xl backdrop-blur-md">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or contact..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted focus:ring-1 focus:ring-blue-500/50 transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto px-1">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="flex-1 md:flex-none bg-transparent text-muted hover:text-foreground transition-colors text-xs font-bold border border-border rounded-lg hover:bg-foreground/[0.05] px-3 py-1.5 outline-none cursor-pointer appearance-none"
                        >
                            <option value="All" className="bg-card text-foreground">All Types</option>
                            <option value="Lump Sum" className="bg-card text-foreground">Lump Sum</option>
                            <option value="Cost Plus" className="bg-card text-foreground">Cost Plus</option>
                            <option value="Unit Price" className="bg-card text-foreground">Unit Price</option>
                        </select>
                        <div className="h-5 w-px bg-border mx-1 hidden md:block" />
                        <div className="flex items-center bg-foreground/[0.03] p-0.5 rounded-lg border border-border">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all scale-90 ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'text-muted hover:text-foreground'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all scale-90 ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'text-muted hover:text-foreground'}`}
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Client Grid/List */}
                {filtered.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl">
                        <div className="bg-foreground/[0.03] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="text-muted" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No clients found</h3>
                        <p className="text-muted max-w-sm mx-auto">Try adjusting your search or add a new client to get started.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filtered.map(client => (
                                <ClientCard key={client.id} client={client} onEdit={handleEdit} onDelete={handleDelete} />
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
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="flex items-center justify-between p-3 bg-foreground/[0.02] border border-border rounded-xl hover:bg-foreground/[0.05] transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            <Building2 size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors">{client.name}</h3>
                                            <p className="text-[10px] text-muted font-medium">ID: {client.id} • {client.contact_person || 'No contact'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:block text-right">
                                            <p className="text-[10px] text-muted uppercase font-black">Contract</p>
                                            <p className="text-xs font-bold text-foreground opacity-80">{client.contract_type}</p>
                                        </div>
                                        <div className="hidden md:block text-right">
                                            <p className="text-[10px] text-muted uppercase font-black">Terms</p>
                                            <p className="text-xs font-bold text-foreground opacity-80">{client.payment_terms}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEdit(client)} className="p-1.5 hover:bg-blue-500/10 text-muted hover:text-blue-500 rounded transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(client.id)} className="p-1.5 hover:bg-red-500/10 text-muted hover:text-red-500 rounded transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                            <ChevronRight size={16} className="text-muted" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Modal */}
                <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingClient(null); }} title={editingClient ? "Edit Client" : "New Client"}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">Company Name</label>
                            <input
                                className="w-full bg-foreground/[0.03] border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-muted/50"
                                placeholder="e.g. Acme Corp"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">Contact Person</label>
                            <input
                                className="w-full bg-foreground/[0.03] border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-muted/50"
                                placeholder="Full name of representative"
                                value={formData.contact_person}
                                onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">Contract Type</label>
                                <select
                                    className="w-full bg-foreground/[0.03] border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    value={formData.contract_type}
                                    onChange={e => setFormData({ ...formData, contract_type: e.target.value })}
                                >
                                    <option className="bg-card text-foreground">Lump Sum</option>
                                    <option className="bg-card text-foreground">Cost Plus</option>
                                    <option className="bg-card text-foreground">Unit Price</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">Payment Terms</label>
                                <input
                                    className="w-full bg-foreground/[0.03] border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-muted/50"
                                    placeholder="e.g. 30 Days"
                                    value={formData.payment_terms}
                                    onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 py-3 rounded-xl text-white font-bold hover:bg-blue-500 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : (editingClient ? 'Update Profile' : 'Establish Client')}
                            </motion.button>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-full py-2 text-muted hover:text-foreground font-bold transition-colors text-xs"
                            >
                                Dismiss
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, icon, trend, color }) {
    return (
        <Card className="relative overflow-hidden group border-none bg-card p-1.5 shadow-sm">
            <div className={`absolute -right-6 -top-6 w-20 h-20 bg-gradient-to-br ${color} to-transparent rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity pointer-events-none`} />
            <div className="relative z-10 p-1.5">
                <div className="flex justify-between items-center mb-3">
                    <div className="p-2.5 bg-muted/5 rounded-xl border border-border shadow-inner group-hover:border-blue-500/30 transition-colors">
                        {icon}
                    </div>
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest bg-muted/5 px-1.5 py-0.5 rounded">{trend}</span>
                </div>
                <h3 className="text-2xl font-black text-foreground mb-0.5 tracking-tight font-heading">{value}</h3>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{title}</p>
            </div>
        </Card>
    );
}
