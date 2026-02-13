import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { ShieldCheck, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ApprovalsIndex() {
    const { pendingPos, pendingMrs } = usePage().props;
    const pos = pendingPos || [];
    const mrs = pendingMrs || [];
    const [tab, setTab] = useState('po');

    const handleApprove = (type, id) => {
        if (type === 'po') router.post(route('purchasing.orders.approve', id));
    };

    const TabBtn = ({ id, label, count }) => (
        <button onClick={() => setTab(id)} className={`px-4 py-3 border-b-2 text-sm font-bold transition-colors ${tab === id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {label} <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs">{count}</span>
        </button>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Pending Approvals" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <header className="pb-6 border-b border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <ShieldCheck className="text-blue-500" /> Pending Approvals
                    </h1>
                    <p className="text-slate-500">Review and approve purchase requests and orders.</p>
                </header>

                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <TabBtn id="po" label="Purchase Orders" count={pos.length} />
                    <TabBtn id="mr" label="Material Requests" count={mrs.length} />
                </div>

                <div className="grid gap-4">
                    {tab === 'po' && pos.map(po => (
                        <div key={po.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex justify-between items-center shadow-sm">
                            <div>
                                <div className="font-bold text-lg text-slate-900 dark:text-white">PO-{po.id.toString().padStart(4, '0')}</div>
                                <div className="text-xs text-slate-500">{po.project?.name} • Requested by {po.requester?.name}</div>
                                <div className="text-sm font-mono text-blue-600 dark:text-cyan-400 mt-1">₱{Number(po.total_amount).toLocaleString()}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleApprove('po', po.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                    <CheckCircle size={16} /> Approve
                                </button>
                                <button className="bg-red-600/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                                    <XCircle size={16} /> Decline
                                </button>
                            </div>
                        </div>
                    ))}

                    {tab === 'mr' && mrs.map(mr => (
                        <div key={mr.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex justify-between items-center shadow-sm">
                            <div>
                                <div className="font-bold text-lg text-slate-900 dark:text-white">MR-{mr.id.toString().padStart(4, '0')}</div>
                                <div className="text-xs text-slate-500">{mr.project?.name} • {mr.items?.length || 0} items</div>
                                <div className="flex items-center gap-1 text-amber-500 text-xs mt-1"><Clock size={12} /> Pending Review</div>
                            </div>
                            <div className="flex gap-2">
                                <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                    <CheckCircle size={16} /> Approve
                                </button>
                                <button className="bg-red-600/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                                    <XCircle size={16} /> Decline
                                </button>
                            </div>
                        </div>
                    ))}

                    {((tab === 'po' && pos.length === 0) || (tab === 'mr' && mrs.length === 0)) && (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <ShieldCheck className="mx-auto mb-3 opacity-30" size={36} />
                            All caught up — no pending approvals.
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
