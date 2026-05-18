import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router, usePoll } from '@inertiajs/react';
import { ShieldCheck, CheckCircle, XCircle, Clock, FileText, User, Building2, ClipboardList, TrendingUp } from 'lucide-react';
import { usePermissions } from '@/Hooks/usePermissions';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import DataTable from '@/Components/UI/DataTable';
import Drawer from '@/Components/UI/Drawer';

// Threshold (%) above which a price variance warning is shown
const VARIANCE_THRESHOLD = 5;

function getPriceVariance(actualPrice, estimatedPrice) {
    if (!estimatedPrice || estimatedPrice <= 0) return null;
    return ((actualPrice - estimatedPrice) / estimatedPrice) * 100;
}

const TabBtn = ({ id, label, count, activeTab, setTab }) => (
    <button onClick={() => setTab(id)} className={`px-4 py-3 border-b-2 text-sm font-bold transition-colors ${activeTab === id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
        {label} <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs">{count}</span>
    </button>
);

export default function ApprovalsIndex() {
    const { pendingPos, pendingMrs } = usePage().props;
    const { can } = usePermissions();
    
    // Poll for new requests every 15 seconds
    usePoll(15000);

    const pos = pendingPos || [];
    const mrs = pendingMrs || [];
    const [tab, setTab] = useState('mr');
    const [processing, setProcessing] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [drawerType, setDrawerType] = useState(null); // 'mr' or 'po'
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        type: 'confirm', 
        title: '', 
        message: '', 
        onConfirm: () => {} 
    });

    const handleApprove = React.useCallback((type, id) => {
        if (processing) return;
        setProcessing(id);
        if (type === 'po') {
            router.post(`/purchasing/orders/${id}/approve`, {}, {
                onFinish: () => setProcessing(null),
            });
        } else if (type === 'mr') {
            router.post(`/material-requests/${id}/approve`, {}, {
                onFinish: () => setProcessing(null),
            });
        }
    }, [processing]);

    const handleReject = React.useCallback((type, id) => {
        if (processing) return;
        setConfirmModal({
            isOpen: true,
            type: 'prompt',
            title: 'Decline Request',
            message: 'Please enter the reason for declining:',
            inputPlaceholder: 'Reason...',
            required: true,
            minLength: 5,
            onConfirm: (remarks) => {
                setProcessing(id);
                setIsDrawerOpen(false);
                if (type === 'po') {
                    router.post(`/purchasing/orders/${id}/decline`, { remarks }, {
                        onFinish: () => setProcessing(null),
                    });
                } else if (type === 'mr') {
                    router.post(`/material-requests/${id}/reject`, { remarks }, {
                        onFinish: () => setProcessing(null),
                    });
                }
            }
        });
    }, [processing]);

    const mrColumns = useMemo(() => [
        {
            accessorKey: 'id',
            header: 'RQ No.',
            cell: ({ row }) => <span className="font-bold text-slate-900 dark:text-white">RQ-{row.original.id.toString().padStart(5, '0')}</span>,
        },
        {
            accessorKey: 'project.name',
            header: 'Project',
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400">{row.original.project?.name}</span>,
        },
        {
            accessorKey: 'requester.name',
            header: 'Requested By',
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400">{row.original.requester?.name}</span>,
        },
        {
            accessorKey: 'created_at',
            header: 'Date Requested',
            cell: ({ row }) => <span className="text-slate-500 whitespace-nowrap">{new Date(row.original.created_at).toLocaleDateString()}</span>,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    {can('approve material requests') && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleApprove('mr', row.original.id); }} 
                                disabled={processing === row.original.id}
                                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                title="Approve"
                            >
                                <CheckCircle size={18} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleReject('mr', row.original.id); }} 
                                disabled={processing === row.original.id}
                                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Decline"
                            >
                                <XCircle size={18} />
                            </button>
                        </>
                    )}
                </div>
            ),
        }
    ], [processing, can, handleApprove, handleReject]);

    const poColumns = useMemo(() => [
        {
            accessorKey: 'id',
            header: 'PO No.',
            cell: ({ row }) => <span className="font-bold text-slate-900 dark:text-white">PO-{row.original.id.toString().padStart(4, '0')}</span>,
        },
        {
            accessorKey: 'project.name',
            header: 'Project',
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400">{row.original.project?.name}</span>,
        },
        {
            accessorKey: 'total_amount',
            header: 'Total Amount',
            cell: ({ row }) => <span className="font-mono text-blue-600 dark:text-cyan-400">₱{Number(row.original.total_amount).toLocaleString()}</span>,
        },
        {
            accessorKey: 'requester.name',
            header: 'Requested By',
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400">{row.original.requester?.name}</span>,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    {can('approve purchase orders') && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleApprove('po', row.original.id); }} 
                                disabled={processing === row.original.id}
                                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                title="Approve"
                            >
                                <CheckCircle size={18} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleReject('po', row.original.id); }} 
                                disabled={processing === row.original.id}
                                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Decline"
                            >
                                <XCircle size={18} />
                            </button>
                        </>
                    )}
                </div>
            ),
        }
    ], [processing, can, handleApprove, handleReject]);

    const openDetails = (item, type) => {
        setSelectedItem(item);
        setDrawerType(type);
        setIsDrawerOpen(true);
    };


    return (
        <AuthenticatedLayout>
            <Head title="Pending Approvals" />
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <TabBtn id="mr" label="Resource Requests" count={mrs.length} activeTab={tab} setTab={setTab} />
                    <TabBtn id="po" label="Purchase Orders" count={pos.length} activeTab={tab} setTab={setTab} />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    {tab === 'mr' ? (
                        <DataTable
                            columns={mrColumns}
                            data={mrs}
                            overflowVisible={true}
                            onRowClick={(row) => openDetails(row, 'mr')}
                            showSearch={true}
                        />
                    ) : (
                        <DataTable
                            columns={poColumns}
                            data={pos}
                            overflowVisible={true}
                            onRowClick={(row) => openDetails(row, 'po')}
                            showSearch={true}
                        />
                    )}

                    {((tab === 'po' && pos.length === 0) || (tab === 'mr' && mrs.length === 0)) && (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 mt-4">
                            <ShieldCheck className="mx-auto mb-3 opacity-30" size={36} />
                            All caught up — no pending approvals.
                        </div>
                    )}
                </div>
            </div>

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

            <Drawer 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                title={drawerType === 'mr' ? 'Resource Request Details' : 'Purchase Order Details'}
            >
                {selectedItem && (
                    <div className="space-y-6 pb-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
                                    {drawerType === 'mr' ? 'RQ' : 'PO'}-{selectedItem.id.toString().padStart(5, '0')}
                                </h1>
                                <p className="text-sm text-slate-500">Created on {new Date(selectedItem.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                Pending
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 rounded-lg space-y-3">
                                <div>
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-2">Project</div>
                                    <p className="text-slate-900 dark:text-white font-semibold text-base">{selectedItem.project?.name}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 rounded-lg space-y-3">
                                <div>
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-2">Requested By</div>
                                    <p className="text-slate-900 dark:text-white font-semibold text-base">{selectedItem.requester?.name}</p>
                                </div>
                            </div>
                            {drawerType === 'po' && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-5 rounded-lg md:col-span-2">
                                    <div className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-widest mb-2">Total Cost</div>
                                    <div className="font-bold text-2xl text-blue-600 dark:text-cyan-400 font-mono">
                                        ₱{Number(selectedItem.total_amount).toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {(drawerType === 'mr' || drawerType === 'po') && selectedItem.items && selectedItem.items.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    {drawerType === 'mr' ? 'Items Requested' : 'Purchase Order Items'}
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-semibold text-slate-700 dark:text-slate-300">{selectedItem.items.length}</span>
                                </h3>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                                    {drawerType === 'po' && (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 px-5 py-3 grid grid-cols-[1fr,80px,100px,120px] gap-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                            <div>Item</div>
                                            <div className="text-center">Qty</div>
                                            <div className="text-right">Unit Price</div>
                                            <div className="text-right">Total</div>
                                        </div>
                                    )}
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {selectedItem.items.map((item, idx) => {
                                            const variance = drawerType === 'po' ? getPriceVariance(item.unit_price, item.purchase_request_item?.estimated_unit_cost) : null;
                                            const hasVariance = variance !== null && variance > VARIANCE_THRESHOLD;
                                            const hasSavings = variance !== null && variance < -VARIANCE_THRESHOLD;
                                            return (
                                                <div key={idx} className={`bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors ${drawerType === 'po' ? 'px-5 py-4 grid grid-cols-[1fr,80px,100px,120px] gap-4 items-start' : 'p-4'}`}>
                                                    {drawerType === 'mr' ? (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.item_description}</div>
                                                            {item.description && (
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
                                                            )}
                                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                                <div>
                                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Warehouse</div>
                                                                    <div className={`text-sm font-bold ${Number(item.warehouse_quantity || 0) >= Number(item.quantity) ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                        {Number(item.warehouse_quantity || 0).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Qty</div>
                                                                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                                        {Number(item.quantity).toLocaleString()} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Unit Price</div>
                                                                    <div className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400">₱{Number(item.material_unit_price).toLocaleString()}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total</div>
                                                                    <div className="text-sm font-mono font-bold text-blue-600 dark:text-cyan-400">₱{Number(item.quantity * item.material_unit_price).toLocaleString()}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="space-y-2 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.material_name}</div>
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
                                                                {item.description && (
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
                                                                )}
                                                            </div>
                                                            <div className="text-center font-mono text-sm font-semibold text-slate-900 dark:text-white">
                                                                {Number(item.quantity).toLocaleString()}
                                                                <div className="text-[10px] text-slate-400 font-normal uppercase">{item.unit}</div>
                                                            </div>
                                                            <div className="text-right space-y-1">
                                                                <div className={`text-sm font-mono font-bold ${
                                                                    hasVariance ? 'text-red-500' :
                                                                    hasSavings ? 'text-emerald-500' :
                                                                    'text-slate-900 dark:text-white'
                                                                }`}>
                                                                    ₱{Number(item.unit_price).toLocaleString()}
                                                                </div>
                                                                {item.purchase_request_item?.estimated_unit_cost && (
                                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Est. ₱{Number(item.purchase_request_item.estimated_unit_cost).toLocaleString()}</div>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                                                                    ₱{(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <button 
                                onClick={() => {
                                    handleApprove(drawerType, selectedItem.id);
                                    setIsDrawerOpen(false);
                                }} 
                                disabled={processing === selectedItem.id}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-600/10"
                            >
                                <CheckCircle size={14} />
                                Approve
                            </button>
                            <button 
                                onClick={() => handleReject(drawerType, selectedItem.id)} 
                                disabled={processing === selectedItem.id}
                                className="flex-1 bg-white hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/10 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 h-10 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <XCircle size={14} />
                                Decline
                            </button>
                        </div>
                    </div>
                )}
            </Drawer>
        </AuthenticatedLayout>
    );
}

