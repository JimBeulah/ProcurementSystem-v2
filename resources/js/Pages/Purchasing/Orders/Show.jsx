import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Printer } from 'lucide-react';
import { usePermissions } from '@/Hooks/usePermissions';
import PdfPreviewModal from '@/Components/UI/PdfPreviewModal';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import { TrendingUp } from 'lucide-react';

const VARIANCE_THRESHOLD = 5;

function getPriceVariance(actualPrice, estimatedPrice) {
    if (!estimatedPrice || estimatedPrice <= 0) return null;
    return ((actualPrice - estimatedPrice) / estimatedPrice) * 100;
}

export default function PurchaseOrderShow() {
    const { order: po } = usePage().props;
    const { can } = usePermissions();
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [confirmModal, setConfirmModal] = React.useState({ 
        isOpen: false, 
        type: 'confirm', 
        title: '', 
        message: '', 
        onConfirm: () => {} 
    });

    if (!po) return <div className="p-12 text-center text-red-500">PO Not Found</div>;

    const handleApprove = () => {
        setConfirmModal({
            isOpen: true,
            type: 'confirm',
            title: 'Approve Purchase Order',
            message: 'Are you sure you want to approve this Purchase Order?',
            onConfirm: () => router.post(`/purchasing/orders/${po.id}/approve`)
        });
    };

    const handleCancel = () => {
        setConfirmModal({
            isOpen: true,
            type: 'prompt',
            title: 'Cancel Purchase Order',
            message: 'Please enter the reason for cancellation:',
            inputPlaceholder: 'Reason for cancellation...',
            onConfirm: (remarks) => {
                if (remarks) {
                    router.post(`/purchasing/orders/${po.id}/cancel`, { remarks });
                }
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`PO-${po.id.toString().padStart(4, '0')}`} />
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <header className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <Link href="/purchasing/orders" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                PO-{po.id.toString().padStart(4, '0')}
                                <span className={`text-sm px-2 py-1 rounded border ${po.status === 'APPROVED' ? 'border-emerald-500 text-emerald-500' :
                                    'border-orange-500 text-orange-500'
                                    }`}>{po.status}</span>
                            </h1>
                            <p className="text-slate-500">Issued on {new Date(po.order_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPreviewOpen(true)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                        >
                            <Printer size={18} /> Print
                        </button>
                        {po.status === 'PENDING' && can('approve purchase orders') && (
                            <button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors active:scale-95">
                                <CheckCircle size={18} /> Approve PO
                            </button>
                        )}
                        {po.status !== 'CANCELLED' && po.status !== 'COMPLETED' && can('create purchase orders') && (
                            <button onClick={handleCancel} className="bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors outline-none">
                                Cancel Order
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                        <h2 className="text-xs text-slate-500 uppercase font-bold mb-4 tracking-widest">Supplier Details</h2>
                        <div className="text-slate-900 dark:text-white font-bold text-lg mb-1">{po.supplier?.name || 'Internal Fulfillment'}</div>
                        <div className="text-slate-500 text-sm">{po.supplier?.address || 'Warehouse Stock'}</div>
                        {po.supplier && <div className="text-slate-500 text-sm">{po.supplier.contact_person}</div>}
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                        <h2 className="text-xs text-slate-500 uppercase font-bold mb-4 tracking-widest">Delivery To</h2>
                        <div className="text-slate-900 dark:text-white font-bold text-lg mb-1">{po.project?.name}</div>
                        <div className="text-slate-500 text-sm">{po.project?.location}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Item</th>
                                <th className="p-4 text-center">Qty</th>
                                <th className="p-4 text-right">Unit Price</th>
                                <th className="p-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {(po.items || []).map(item => {
                                const estimatedPrice = item.purchase_request_item?.estimated_unit_cost || 0;
                                const variance = getPriceVariance(parseFloat(item.unit_price), parseFloat(estimatedPrice));
                                const hasVariance = variance !== null && variance > VARIANCE_THRESHOLD;
                                const hasSavings = variance !== null && variance < -VARIANCE_THRESHOLD;

                                return (
                                    <tr key={item.id} className={hasVariance ? 'bg-red-50/30 dark:bg-red-900/10' : ''}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="text-slate-900 dark:text-white font-medium">{item.material_name}</div>
                                                {hasVariance && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-md">
                                                        <TrendingUp size={10} /> +{variance.toFixed(0)}% OVER
                                                    </span>
                                                )}
                                                {hasSavings && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                                                        ↓ {Math.abs(variance).toFixed(0)}% UNDER
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400">{item.description}</div>
                                        </td>
                                        <td className="p-4 text-center font-mono">{item.quantity}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono text-slate-900 dark:text-white">₱{Number(item.unit_price).toLocaleString()}</span>
                                                {estimatedPrice > 0 && (
                                                    <span className="text-[10px] text-slate-400">
                                                        Est. ₱{Number(estimatedPrice).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-900 dark:text-white font-bold">
                                            {(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                            <tr>
                                <td colSpan={3} className="p-4 text-right">TOTAL AMOUNT (PHP)</td>
                                <td className="p-4 text-right text-emerald-600 text-xl font-mono">
                                    {Number(po.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {po.approver && (
                    <div className="flex justify-end text-sm text-emerald-600 items-center gap-2">
                        <CheckCircle size={14} /> Approved by {po.approver.name}
                    </div>
                )}
            </div>

            <PdfPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                url={`/purchasing/orders/${po.id}/print`}
                title={`Purchase Order PO-${po.id.toString().padStart(4, '0')} Preview`}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                inputPlaceholder={confirmModal.inputPlaceholder}
            />
        </AuthenticatedLayout>
    );
}
