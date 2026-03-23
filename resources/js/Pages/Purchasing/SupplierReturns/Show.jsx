import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, XCircle, PackageCheck, ShoppingCart } from 'lucide-react';
import { usePermissions } from '@/Hooks/usePermissions';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';

const STATUS_STYLES = {
    DRAFT: 'border-slate-400 text-slate-500',
    PENDING_APPROVAL: 'border-orange-500 text-orange-500',
    APPROVED: 'border-blue-500 text-blue-500',
    RETURNED: 'border-emerald-500 text-emerald-500',
    CANCELLED: 'border-red-500 text-red-500',
};

export default function SupplierReturnShow() {
    const { supplierReturn: ret } = usePage().props;
    const { can } = usePermissions();
    const [returnedDate, setReturnedDate] = useState(new Date().toISOString().slice(0, 10));
    const [returnRef, setReturnRef] = useState('');
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        type: 'confirm', 
        title: '', 
        message: '', 
        onConfirm: () => {} 
    });

    if (!ret) return <div className="p-12 text-center text-red-500">Return record not found.</div>;

    const totalCredit = (ret.items || []).reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0);

    const handleApprove = () => {
        setConfirmModal({
            isOpen: true,
            type: 'confirm',
            title: 'Approve Return',
            message: 'Approve this supplier return request? Procurement may proceed with returning items.',
            onConfirm: () => router.post(`/purchasing/supplier-returns/${ret.id}/approve`)
        });
    };

    const handleMarkReturned = () => {
        if (!returnedDate) {
            setConfirmModal({
                isOpen: true,
                type: 'alert',
                title: 'Missing Date',
                message: 'Please enter the date items were returned.',
                onConfirm: () => {}
            });
            return;
        }
        setConfirmModal({
            isOpen: true,
            type: 'confirm',
            title: 'Confirm Return',
            message: 'Mark all items as physically returned to the supplier?',
            onConfirm: () => router.post(`/purchasing/supplier-returns/${ret.id}/mark-returned`, {
                returned_date: returnedDate,
                return_reference: returnRef,
            })
        });
    };

    const handleCancel = () => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Cancel Return',
            message: 'Cancel this return? Inventory will be restored.',
            confirmText: 'Cancel Return',
            onConfirm: () => router.post(`/purchasing/supplier-returns/${ret.id}/cancel`)
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`SR-${ret.id.toString().padStart(4, '0')}`} />
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <Link href="/purchasing/supplier-returns" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                SR-{ret.id.toString().padStart(4, '0')}
                                <span className={`text-sm px-2 py-1 rounded border font-normal ${STATUS_STYLES[ret.status] || ''}`}>
                                    {ret.status.replace('_', ' ')}
                                </span>
                            </h1>
                            <p className="text-slate-500 text-sm">Initiated on {new Date(ret.created_at).toLocaleDateString()} by {ret.initiated_by?.name}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                        {['APPROVED', 'RETURNED'].includes(ret.status) && can('create purchase orders') && (
                            <Link
                                href={`/purchasing/orders/create?returnId=${ret.id}`}
                                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors shadow-lg shadow-violet-600/20"
                            >
                                <ShoppingCart size={16} /> Re-order Items
                            </Link>
                        )}
                        {ret.status === 'PENDING_APPROVAL' && can('approve purchase orders') && (
                            <button onClick={handleApprove} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors">
                                <CheckCircle size={16} /> Approve
                            </button>
                        )}
                        {ret.status === 'APPROVED' && can('approve purchase orders') && (
                            <div className="flex items-center gap-2">
                                <input type="date" value={returnedDate} onChange={e => setReturnedDate(e.target.value)}
                                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                                <input value={returnRef} onChange={e => setReturnRef(e.target.value)} placeholder="Ref # (optional)"
                                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-36" />
                                <button onClick={handleMarkReturned} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors">
                                    <PackageCheck size={16} /> Mark Returned
                                </button>
                            </div>
                        )}
                        {!['RETURNED', 'CANCELLED'].includes(ret.status) && can('create purchase orders') && (
                            <button onClick={handleCancel} className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                <XCircle size={16} className="inline mr-1" /> Cancel
                            </button>
                        )}
                    </div>
                </header>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-widest">Supplier</div>
                        <div className="text-slate-900 dark:text-white font-bold">{ret.supplier?.name || '—'}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-widest">Project</div>
                        <div className="text-slate-900 dark:text-white font-bold">{ret.project?.name}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-widest">Est. Credit</div>
                        <div className="text-emerald-600 font-bold text-lg font-mono">
                            ₱{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* Reason */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="text-xs text-amber-600 uppercase font-bold mb-1 tracking-widest">Reason for Return</div>
                    <p className="text-slate-800 dark:text-amber-200 text-sm">{ret.reason}</p>
                    {ret.remarks && <p className="text-slate-500 text-xs mt-1 italic">{ret.remarks}</p>}
                </div>

                {/* Items Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Material</th>
                                <th className="p-4 text-center">Qty</th>
                                <th className="p-4 text-center">Unit</th>
                                <th className="p-4 text-right">Unit Price</th>
                                <th className="p-4 text-right">Credit Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {(ret.items || []).map(item => (
                                <tr key={item.id}>
                                    <td className="p-4">
                                        <div className="text-slate-900 dark:text-white font-medium">{item.material_name}</div>
                                        {item.notes && <div className="text-xs text-slate-400 italic">{item.notes}</div>}
                                    </td>
                                    <td className="p-4 text-center font-mono">{item.quantity}</td>
                                    <td className="p-4 text-center">{item.unit}</td>
                                    <td className="p-4 text-right font-mono">₱{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                        ₱{(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                            <tr>
                                <td colSpan={4} className="p-4 text-right">TOTAL CREDIT</td>
                                <td className="p-4 text-right text-emerald-600 text-lg font-mono">
                                    ₱{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Next Step Hint */}
                {ret.status === 'RETURNED' && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Items Returned to Supplier</p>
                            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
                                Notify Finance to raise a debit note for ₱{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
                                To procure the correct item, create a new{' '}
                                <Link href="/purchasing/requests" className="underline font-semibold">Purchase Request</Link>.
                            </p>
                            {ret.return_reference && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Return Reference: {ret.return_reference}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />
        </AuthenticatedLayout>
    );
}
