import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { ShoppingCart, Plus, Calendar, MapPin, Package, Printer, TrendingUp, ArrowLeftRight, CheckCircle } from 'lucide-react';
import DataTable from '@/Components/UI/DataTable';
import Drawer from '@/Components/UI/Drawer';
import Modal from '@/Components/UI/Modal';
import CreatePurchaseOrder from './Create';
import PdfPreviewModal from '@/Components/UI/PdfPreviewModal';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import Pagination from '@/Components/UI/Pagination';

const VARIANCE_THRESHOLD = 5;

function getPriceVariance(actualPrice, estimatedPrice) {
    if (!estimatedPrice || estimatedPrice <= 0) return null;
    return ((actualPrice - estimatedPrice) / estimatedPrice) * 100;
}

export default function PurchaseOrdersIndex() {
    const { orders } = usePage().props;
    const { can } = usePermissions();
    const pos = orders?.data || [];

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        type: 'confirm', 
        title: '', 
        message: '', 
        onConfirm: () => {} 
    });

    const handleCancel = React.useCallback((po) => {
        setConfirmModal({
            isOpen: true,
            type: 'prompt',
            title: 'Cancel Purchase Order',
            message: 'Please enter the reason for cancellation:',
            inputPlaceholder: 'Reason for cancellation...',
            required: true,
            minLength: 5,
            onConfirm: (remarks) => {
                if (remarks) {
                    router.post(`/purchasing/orders/${po.id}/cancel`, { remarks }, {
                        onSuccess: () => setSelectedOrder(null)
                    });
                }
            }
        });
    }, []);

    const columns = React.useMemo(() => [
        {
            accessorKey: 'po_number',
            header: 'PO #',
            cell: ({ row }) => (
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 font-bold font-mono text-sm max-w-max">
                    PO-{row.original.id.toString().padStart(4, '0')}
                </div>
            )
        },
        {
            id: 'supplier',
            accessorFn: row => row.supplier?.name || 'Internal Fulfillment (Warehouse)',
            header: 'Supplier',
            cell: ({ row }) => (
                <div className="text-slate-900 dark:text-white font-bold">
                    {row.original.supplier?.name || 'Internal Fulfillment (Warehouse)'}
                </div>
            )
        },
        {
            accessorKey: 'order_date',
            header: 'Date',
            cell: ({ row }) => (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Calendar size={12} /> {new Date(row.original.order_date).toLocaleDateString()}
                </div>
            )
        },
        {
            id: 'project',
            accessorFn: row => row.project?.name || '',
            header: 'Project',
            cell: ({ row }) => (
                <div className="text-sm text-slate-500 flex items-center gap-2">
                    <MapPin size={14} /> {row.original.project?.name}
                </div>
            )
        },
        {
            accessorKey: 'total_amount',
            header: 'Total',
            cell: ({ row }) => (
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {Number(row.original.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, style: 'currency', currency: 'PHP' })}
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const po = row.original;
                const status = String(po.status || '').toUpperCase();
                return (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border max-w-max 
                        ${status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          status === 'PARTIALLY DELIVERED' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                          status === 'PENDING' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 
                          'bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'
                        }`}>
                        {po.status}
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const po = row.original;
                return (
                    <div className="flex items-center gap-2 justify-end">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewUrl(`/purchasing/orders/${po.id}/print`);
                                setIsPreviewOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center"
                            title="Print PO"
                        >
                            <Printer size={16} />
                        </button>
                        {(po.status === 'APPROVED' || po.status === 'PARTIALLY DELIVERED') && can('create receiving') && (
                            <Link href={`/inventory/receiving/create?poId=${po.id}`} onClick={e => e.stopPropagation()} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors flex items-center justify-center" title="Create Receiving">
                                <Package size={16} />
                            </Link>
                        )}
                    </div>
                );
            }
        }
    ], [can]);

    const handleRowClick = React.useCallback((row) => setSelectedOrder(row), []);

    const renderOrderDetails = (po) => {
        if (!po) return null;
        return (
            <div className="space-y-6 max-w-5xl mx-auto pb-6">
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-3 mb-2">
                            PO-{po.id.toString().padStart(4, '0')}
                            <span className={`text-sm px-3 py-1 rounded border
                                ${String(po.status).toUpperCase() === 'APPROVED' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                  String(po.status).toUpperCase() === 'PARTIALLY DELIVERED' ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                  String(po.status).toUpperCase() === 'COMPLETED' ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                  'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                }`}>{po.status}</span>
                        </h1>
                        <p className="text-sm text-slate-500">Issued on {new Date(po.order_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                setPreviewUrl(`/purchasing/orders/${po.id}/print`);
                                setIsPreviewOpen(true);
                            }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap"
                        >
                            <Printer size={16} /> Print
                        </button>
                        {(po.status === 'APPROVED' || po.status === 'PARTIALLY DELIVERED' || po.status === 'COMPLETED') && can('create purchase orders') && (
                            <Link
                                href={`/purchasing/supplier-returns/create?poId=${po.id}`}
                                className="bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                <ArrowLeftRight size={16} /> Return Items
                            </Link>
                        )}
                        {po.status !== 'CANCELLED' && po.status !== 'COMPLETED' && can('create purchase orders') && (
                            <button onClick={() => handleCancel(po)} className="bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors outline-none whitespace-nowrap">
                                Cancel Order
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 rounded-lg">
                        <h2 className="text-xs text-slate-400 uppercase font-bold mb-3 tracking-widest">Supplier Details</h2>
                        <div className="space-y-2">
                            <div>
                                <p className="text-slate-900 dark:text-white font-semibold text-base">{po.supplier?.name || 'Internal Fulfillment'}</p>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{po.supplier?.address || 'Warehouse Stock'}</p>
                            </div>
                            {po.supplier?.contact_person && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm">Contact: {po.supplier.contact_person}</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 rounded-lg">
                        <h2 className="text-xs text-slate-400 uppercase font-bold mb-3 tracking-widest">Delivery To</h2>
                        <div className="space-y-2">
                            <p className="text-slate-900 dark:text-white font-semibold text-base">{po.project?.name}</p>
                            {po.project?.location && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm">{po.project.location}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-5 py-3 text-left">Item</th>
                                    <th className="px-5 py-3 text-center w-20">Qty</th>
                                    <th className="px-5 py-3 text-right w-32">Unit Price</th>
                                    <th className="px-5 py-3 text-right w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {(po.items || []).map(item => {
                                    const estimatedPrice = item.purchase_request_item?.estimated_unit_cost || 0;
                                    const variance = getPriceVariance(parseFloat(item.unit_price), parseFloat(estimatedPrice));
                                    const hasVariance = variance !== null && variance > VARIANCE_THRESHOLD;
                                    const hasSavings = variance !== null && variance < -VARIANCE_THRESHOLD;

                                    return (
                                        <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${hasVariance ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                                            <td className="px-5 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="text-slate-900 dark:text-white font-semibold">{item.material_name}</div>
                                                        {hasVariance && (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-md">
                                                                <TrendingUp size={10} /> +{variance.toFixed(0)}% OVER
                                                            </span>
                                                        )}
                                                        {hasSavings && (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                                                                ↓ {Math.abs(variance).toFixed(0)}% UNDER
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.description && <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center font-mono text-slate-900 dark:text-white font-semibold">{Number(item.quantity).toLocaleString()}</td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="space-y-1">
                                                    <div className="font-mono text-slate-900 dark:text-white font-semibold">₱{Number(item.unit_price).toLocaleString()}</div>
                                                    {estimatedPrice > 0 && (
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                            Est. ₱{Number(estimatedPrice).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-slate-900 dark:text-white font-bold">
                                                ₱{(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-700">
                                <tr>
                                    <td colSpan={3} className="px-5 py-4 text-right text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Amount</td>
                                    <td className="px-5 py-4 text-right text-emerald-600 dark:text-emerald-400 text-lg font-mono">
                                        ₱{Number(po.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {po.approver && (
                    <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Approved by {po.approver.name}</p>
                            {po.approved_at && <p className="text-xs text-emerald-700 dark:text-emerald-400">{new Date(po.approved_at).toLocaleDateString()}</p>}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Purchase Orders" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ShoppingCart className="text-blue-500" /> Purchase Orders
                        </h1>
                        <p className="text-slate-500">Track and manage supplier orders.</p>
                        </div>
                        {/* Global "Create PO" removed to enforce conversion from approved PRs */}
                        </header>

                <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                    <DataTable
                        columns={columns}
                        data={pos}
                        overflowVisible={true}
                        onRowClick={handleRowClick}
                        showPagination={false}
                    />
                    <Pagination links={orders.links} meta={orders} />
                </div>
            </div>

            <Drawer
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title="Purchase Order Details"
                width="w-full max-w-3xl"
            >
                {renderOrderDetails(selectedOrder)}
            </Drawer>

            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Purchase Order"
                maxWidth="max-w-6xl"
            >
                <div className="pt-4">
                    <CreatePurchaseOrder onSuccess={() => setIsCreateOpen(false)} />
                </div>
            </Modal>

            <PdfPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                url={previewUrl}
                title="Purchase Order Preview"
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                inputPlaceholder={confirmModal.inputPlaceholder}
                required={confirmModal.required}
                minLength={confirmModal.minLength}
            />
        </AuthenticatedLayout>
    );
}
