import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { FileText, Plus, CheckCircle, XCircle, Ban, RefreshCcw, Trash2 } from 'lucide-react';

function StatusBadge({ status }) {
    const styles = {
        PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        DECLINED: 'bg-red-500/10 text-red-600 border-red-500/20',
        COMPLETED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    };
    const style = styles[status] || styles.PENDING;
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}>{status}</span>;
}

function ActionButton({ icon, title, className }) {
    return <button title={title} className={`p-2 rounded-lg transition-all ${className}`}>{icon}</button>;
}

export default function PurchaseRequestsIndex() {
    const { requests } = usePage().props;
    const list = requests || [];

    return (
        <AuthenticatedLayout>
            <Head title="Purchase Requests" />
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Requests</h1>
                        <p className="text-slate-500 mt-1">Manage intended purchases and approvals</p>
                    </div>
                    <Link href="/purchasing/orders/create" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg active:scale-95 transition-all font-bold text-xs">
                        <Plus size={18} /> New Request
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Request ID</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Project Name</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Total Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {list.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        <FileText className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={36} />
                                        No purchase requests found.
                                    </td>
                                </tr>
                            ) : list.map(req => (
                                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="p-4"><span className="font-mono text-sm text-slate-700 dark:text-slate-300">#{req.id.toString().padStart(6, '0')}</span></td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-cyan-500/50" />
                                            <span className="font-medium text-slate-900 dark:text-slate-200">{req.project?.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4"><StatusBadge status={req.status} /></td>
                                    <td className="p-4 text-slate-500 text-sm">{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-slate-900 dark:text-slate-200 font-mono">₱{Number(req.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <ActionButton icon={<CheckCircle size={16} />} title="Approve" className="text-emerald-500 hover:bg-emerald-500/10" />
                                            <ActionButton icon={<XCircle size={16} />} title="Disapprove" className="text-amber-500 hover:bg-amber-500/10" />
                                            <ActionButton icon={<Ban size={16} />} title="Void" className="text-red-500 hover:bg-red-500/10" />
                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                                            <ActionButton icon={<RefreshCcw size={16} />} title="Reorder" className="text-blue-500 hover:bg-blue-500/10" />
                                            <ActionButton icon={<Trash2 size={16} />} title="Delete" className="text-slate-400 hover:text-red-500 hover:bg-red-500/10" />
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
