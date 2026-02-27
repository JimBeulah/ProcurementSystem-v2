import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { RotateCcw, PackageCheck, Plus, X, CheckCircle, Clock, Inbox } from 'lucide-react';

const STATUS_BADGE = {
    PENDING: { cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Pending' },
    RECEIVED: { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Received' },
};

export default function MaterialReturnsIndex({ returns }) {
    const { can } = usePermissions();
    const { flash } = usePage().props;
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
            <Head title="Material Returns" />
            <div className="p-6 space-y-6 max-w-5xl mx-auto">

                {/* Header */}
                <header className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl text-white shadow-lg shadow-teal-500/30">
                                <RotateCcw size={20} />
                            </div>
                            Material Returns
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Return leftover site materials back to warehouse inventory.</p>
                    </div>
                    {can('view site release') && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-teal-600/20 active:scale-95"
                        >
                            <Plus size={16} /> Return Materials
                        </button>
                    )}
                </header>

                {/* Flash Message */}
                {flash?.success && (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl px-4 py-3 text-sm font-medium">
                        <CheckCircle size={16} /> {flash.success}
                    </div>
                )}

                {/* Return Submission Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                    <RotateCcw size={18} className="text-teal-500" /> Return Materials
                                </h2>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <ReturnForm onClose={() => setShowForm(false)} />
                        </div>
                    </div>
                )}

                {/* Returns Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4">Material</th>
                                <th className="p-4">Project</th>
                                <th className="p-4 text-right">Qty</th>
                                <th className="p-4">Returned By</th>
                                <th className="p-4">Status</th>
                                {can('manage inventory') && <th className="p-4 w-28">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {returns.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <Inbox size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                        <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">No returns yet</p>
                                    </td>
                                </tr>
                            ) : returns.data.map((ret) => {
                                const badge = STATUS_BADGE[ret.status] ?? STATUS_BADGE.PENDING;
                                return (
                                    <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-900 dark:text-white">{ret.material_name}</div>
                                            {ret.remarks && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{ret.remarks}</div>}
                                        </td>
                                        <td className="p-4 text-slate-500">{ret.project?.name ?? '—'}</td>
                                        <td className="p-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                                            {parseFloat(ret.quantity).toFixed(2)} <span className="text-xs text-slate-400">{ret.unit}</span>
                                        </td>
                                        <td className="p-4 text-slate-500">{ret.returned_by?.name ?? '—'}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.cls}`}>
                                                {ret.status === 'PENDING' ? <Clock size={10} /> : <CheckCircle size={10} />}
                                                {badge.label}
                                            </span>
                                        </td>
                                        {can('manage inventory') && (
                                            <td className="p-4">
                                                {ret.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleReceive(ret.id)}
                                                        disabled={processing === ret.id}
                                                        className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                                                    >
                                                        <PackageCheck size={13} />
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
        </AuthenticatedLayout>
    );
}

function ReturnForm({ onClose }) {
    const { props } = usePage();
    const projects = props.projects || [];
    const [form, setForm] = useState({ project_id: '', material_name: '', quantity: '', unit: 'pcs', remarks: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(route('material-returns.store'), form, {
            onSuccess: () => { onClose(); },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Material Name</label>
                <input
                    type="text"
                    required
                    placeholder="e.g. Portland Cement"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none"
                    value={form.material_name}
                    onChange={e => setForm({ ...form, material_name: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Quantity</label>
                    <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono focus:border-teal-500 outline-none"
                        value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Unit</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none"
                        value={form.unit}
                        onChange={e => setForm({ ...form, unit: e.target.value })}
                    />
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Remarks (optional)</label>
                <textarea
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white h-20 focus:border-teal-500 outline-none"
                    value={form.remarks}
                    onChange={e => setForm({ ...form, remarks: e.target.value })}
                />
            </div>
            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    <RotateCcw size={15} /> {submitting ? 'Submitting...' : 'Submit Return'}
                </button>
            </div>
        </form>
    );
}
