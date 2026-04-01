import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { RotateCcw, Plus, X, CheckCircle, Clock, Inbox, Briefcase, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Combobox from '@/Components/UI/Combobox.jsx';
import { usePermissions } from '@/Hooks/usePermissions';
import { PackageCheck } from 'lucide-react';

const STATUS_BADGE = {
    PENDING: { cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Pending Arrival' },
    RECEIVED: { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Received by Warehouse' },
};

export default function ProjectMaterialReturns() {
    const { project, returns, inventory, flash } = usePage().props;
    const { can } = usePermissions();
    const [showForm, setShowForm] = useState(false);
    const [processing, setProcessing] = useState(null);

    const handleReceive = (id) => {
        if (processing) return;
        setProcessing(id);
        router.post(route('material-returns.receive', id), {}, {
            onFinish: () => setProcessing(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Returns: ${project.name}`} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 1. Page Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link href={`/projects/${project.id}`} className="text-sm font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 w-fit mb-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Project Overview
                        </Link>
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3"
                        >
                            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg text-white shadow-lg shadow-teal-500/30">
                                <RotateCcw size={22} className="opacity-90" />
                            </div>
                            Material Returns
                        </motion.h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Briefcase size={14} className="opacity-70" /> {project.name}
                        </p>
                    </div>
                </header>

                {/* Returns Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* Left Column (Main Table) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                                <div>
                                    <h2 className="font-bold text-foreground flex items-center gap-2">
                                        Return History
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Leftover materials returned from this site to the warehouse</p>
                                </div>
                            </div>

                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                                    <tr>
                                        <th className="p-4">Material</th>
                                        <th className="p-4 text-right">Qty</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Timestamps</th>
                                        {can('manage inventory') && <th className="p-4 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {returns.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-16 text-center">
                                                <Inbox size={40} className="mx-auto mb-3 opacity-20 text-foreground" />
                                                <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest">No site returns recorded</p>
                                            </td>
                                        </tr>
                                    ) : returns.map((ret) => {
                                        const badge = STATUS_BADGE[ret.status] ?? STATUS_BADGE.PENDING;
                                        return (
                                            <tr key={ret.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-semibold text-foreground">{ret.material_name}</div>
                                                    {ret.remarks && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]" title={ret.remarks}>{ret.remarks}</div>}
                                                </td>
                                                <td className="p-4 text-right font-mono font-semibold text-foreground">
                                                    {parseFloat(ret.quantity).toFixed(2)} <span className="text-[10px] text-muted-foreground uppercase">{ret.unit}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.cls}`}>
                                                        {ret.status === 'PENDING' ? <Clock size={10} className="animate-pulse" /> : <CheckCircle size={10} />}
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1 text-[10px] font-mono text-muted-foreground">
                                                        <span>Req: {new Date(ret.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        {ret.status === 'RECEIVED' && (
                                                            <span className="text-emerald-500/80">Rcv: {new Date(ret.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                {can('manage inventory') && (
                                                    <td className="p-4 text-right">
                                                        {ret.status === 'PENDING' && (
                                                            <button
                                                                onClick={() => handleReceive(ret.id)}
                                                                disabled={processing === ret.id}
                                                                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ml-auto transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                                                            >
                                                                <PackageCheck size={12} />
                                                                {processing === ret.id ? '...' : 'Receive'}
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column (Sidebar Action) */}
                    <div className="lg:col-span-1 space-y-6 relative">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="sticky top-6">
                            <div className="bg-gradient-to-br from-teal-500/5 to-cyan-500/5 border border-teal-500/20 dark:border-teal-500/10 rounded-xl p-5 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <RotateCcw size={100} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="font-bold text-foreground flex items-center gap-2 text-lg mb-2">
                                        <RotateCcw size={18} className="text-teal-600 dark:text-teal-400" /> Site Return Form
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        Finished with a phase? Declare excess materials here to return them to the central warehouse.
                                    </p>

                                    {!showForm ? (
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
                                        >
                                            <Plus size={18} /> Declare Return
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <ReturnForm projectId={project.id} inventory={inventory} onClose={() => setShowForm(false)} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ReturnForm({ projectId, inventory, onClose }) {
    const [form, setForm] = useState({
        project_id: projectId,
        inventory_item_id: '',
        quantity: '',
        remarks: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Derived state from selection
    const selectedItem = inventory.find(item => String(item.id) === String(form.inventory_item_id));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(route('material-returns.store'), form, {
            onSuccess: () => { onClose(); },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Select Material</label>
                <Combobox
                    value={form.inventory_item_id}
                    onChange={(val) => setForm({ ...form, inventory_item_id: val, quantity: '' })} // Reset qty on change
                    options={inventory.map(item => ({
                        value: item.id,
                        label: `${item.material_name} (Avail: ${parseFloat(item.quantity).toFixed(2)} ${item.unit})`
                    }))}
                    placeholder="Search site inventory..."
                    searchPlaceholder="Search material name..."
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Return Qty</label>
                    <input
                        type="number"
                        required
                        min="0.01"
                        max={selectedItem ? parseFloat(selectedItem.quantity) : ''}
                        step="any"
                        disabled={!selectedItem}
                        placeholder={selectedItem ? `Max: ${parseFloat(selectedItem.quantity)}` : 'Select item first'}
                        className="w-full bg-background border border-border rounded-lg p-2.5 text-sm font-mono text-foreground focus:border-teal-500 outline-none disabled:opacity-50"
                        value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Unit</label>
                    <input
                        type="text"
                        disabled
                        value={selectedItem ? selectedItem.unit : ''}
                        placeholder="--"
                        className="w-full bg-muted/50 border border-border rounded-lg p-2.5 text-sm font-medium uppercase text-muted-foreground outline-none"
                    />
                </div>
            </div>
            <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Remarks</label>
                <textarea
                    placeholder="Optional conditions or reasons..."
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm font-medium text-foreground h-20 focus:border-teal-500 outline-none resize-none"
                    value={form.remarks}
                    onChange={e => setForm({ ...form, remarks: e.target.value })}
                />
            </div>
            <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-border text-foreground hover:bg-muted/50 rounded-lg text-xs font-bold transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Declaring...' : 'Submit to Warehouse'}
                </button>
            </div>
        </form>
    );
}
