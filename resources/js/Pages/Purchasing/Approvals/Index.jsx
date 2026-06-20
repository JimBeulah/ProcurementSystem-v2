import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router, usePoll } from '@inertiajs/react';
import { ShieldCheck, CheckCircle, XCircle, Clock, FileText, User, Building2, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';
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
                    <div className="space-y-3 pb-4">
                        {/* Compact header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-base font-bold text-slate-900 dark:text-white">
                                {drawerType === 'mr' ? 'RQ' : 'PO'}-{selectedItem.id.toString().padStart(5, '0')}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{new Date(selectedItem.created_at).toLocaleDateString()}</span>
                                <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>
                            </div>
                        </div>

                        {/* Compact meta strip */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Project</span>
                                <span className="text-slate-900 dark:text-white font-semibold">{selectedItem.project?.name}</span>
                            </div>
                            <div className="text-slate-200 dark:text-slate-700 self-center">|</div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">By</span>
                                <span className="text-slate-900 dark:text-white font-semibold">{selectedItem.requester?.name}</span>
                            </div>
                            {drawerType === 'po' && (
                                <>
                                    <div className="text-slate-200 dark:text-slate-700 self-center">|</div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Total</span>
                                        <span className="text-blue-600 dark:text-cyan-400 font-bold font-mono">₱{Number(selectedItem.total_amount).toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* BOQ Budget Impact — per BOQ item */}
                        {drawerType === 'po' && selectedItem.budget_context && (() => {
                            const ctx = selectedItem.budget_context;
                            const fmt = (n) => Number(n).toLocaleString('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

                            if (!ctx.has_boq_link) return (
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-slate-400 shrink-0" />
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">This PO has no linked purchase request — BOQ budget cannot be determined.</p>
                                </div>
                            );

                            return (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <TrendingUp size={11} /> BOQ Budget Impact
                                    </span>
                                    {ctx.breakdown.map((row, i) => {
                                        const isOver = row.remaining_after < 0;
                                        const isNear = !isOver && row.remaining_after < row.budget * 0.1;
                                        const pct = row.budget > 0 ? Math.min((row.this_po_amount / row.budget) * 100, 100) : 0;
                                        return (
                                            <div key={i} className={`rounded-lg border px-3 py-2 space-y-1.5 ${
                                                isOver ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                                : isNear ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                            }`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{row.boq_item_name}</span>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                        isOver ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                                        : isNear ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                                    }`}>
                                                        {isOver ? 'OVER' : isNear ? 'NEAR LIMIT' : 'GOOD'}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <div className="grid grid-cols-3 gap-1 text-[10px]">
                                                    <div>
                                                        <div className="text-slate-400 font-semibold" style={{ fontSize: '9px' }}>BOQ BUDGET</div>
                                                        <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{fmt(row.budget)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-400 font-semibold" style={{ fontSize: '9px' }}>THIS PO</div>
                                                        <div className={`font-mono font-bold ${isOver ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>{fmt(row.this_po_amount)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-400 font-semibold" style={{ fontSize: '9px' }}>REMAINING</div>
                                                        <div className={`font-mono font-bold ${isOver ? 'text-red-600 dark:text-red-400' : isNear ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmt(row.remaining_after)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        {/* Items list */}
                        {selectedItem.items && selectedItem.items.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {drawerType === 'mr' ? 'Items Requested' : 'PO Items'}
                                    </span>
                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300">{selectedItem.items.length}</span>
                                </div>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                    {drawerType === 'po' && (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 grid grid-cols-[1fr,60px,90px,90px] gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                            <div>Item</div>
                                            <div className="text-center">Qty</div>
                                            <div className="text-right">Unit Price</div>
                                            <div className="text-right">Total</div>
                                        </div>
                                    )}
                                    {drawerType === 'mr' && (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 grid grid-cols-[1fr,70px,70px,90px,90px] gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                            <div>Item</div>
                                            <div className="text-center">Stock</div>
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
                                            return drawerType === 'mr' ? (
                                                <div key={idx} className="px-3 py-2 grid grid-cols-[1fr,70px,70px,90px,90px] gap-2 items-center bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.item_description}</div>
                                                    <div className={`text-xs font-bold text-center font-mono ${Number(item.warehouse_quantity || 0) >= Number(item.quantity) ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {Number(item.warehouse_quantity || 0).toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-center font-mono text-slate-700 dark:text-slate-300">
                                                        {Number(item.quantity).toLocaleString()} <span className="text-[10px] text-slate-400">{item.unit}</span>
                                                    </div>
                                                    <div className="text-xs text-right font-mono text-slate-600 dark:text-slate-400">₱{Number(item.material_unit_price).toLocaleString()}</div>
                                                    <div className="text-xs text-right font-mono font-bold text-blue-600 dark:text-cyan-400">₱{Number(item.quantity * item.material_unit_price).toLocaleString()}</div>
                                                </div>
                                            ) : (
                                                <div key={idx} className="px-3 py-2 grid grid-cols-[1fr,60px,90px,90px] gap-2 items-start bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.material_name}</span>
                                                            {hasVariance && (
                                                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-1.5 py-0.5 rounded">
                                                                    <TrendingUp size={8} /> +{variance.toFixed(0)}%
                                                                </span>
                                                            )}
                                                            {hasSavings && (
                                                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                                                                    ↓{Math.abs(variance).toFixed(0)}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.description && <div className="text-[10px] text-slate-400 truncate">{item.description}</div>}
                                                    </div>
                                                    <div className="text-xs text-center font-mono text-slate-700 dark:text-slate-300">
                                                        {Number(item.quantity).toLocaleString()}
                                                        <div className="text-[9px] text-slate-400 uppercase">{item.unit}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-xs font-mono font-bold ${hasVariance ? 'text-red-500' : hasSavings ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                                            ₱{Number(item.unit_price).toLocaleString()}
                                                        </div>
                                                        {item.purchase_request_item?.estimated_unit_cost && (
                                                            <div className="text-[9px] text-slate-400">Est. ₱{Number(item.purchase_request_item.estimated_unit_cost).toLocaleString()}</div>
                                                        )}
                                                    </div>
                                                    <div className="text-right text-xs font-mono font-bold text-slate-900 dark:text-white">
                                                        ₱{(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => { handleApprove(drawerType, selectedItem.id); setIsDrawerOpen(false); }}
                                disabled={processing === selectedItem.id}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-600/10"
                            >
                                <CheckCircle size={13} /> Approve
                            </button>
                            <button
                                onClick={() => handleReject(drawerType, selectedItem.id)}
                                disabled={processing === selectedItem.id}
                                className="flex-1 bg-white hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/10 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 h-9 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <XCircle size={13} /> Decline
                            </button>
                        </div>
                    </div>
                )}
            </Drawer>
        </AuthenticatedLayout>
    );
}

