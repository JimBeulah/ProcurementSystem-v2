import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { ShieldCheck, CheckCircle, XCircle, Clock, FileText, User, Building2, Calendar, ClipboardList, TrendingUp } from 'lucide-react';
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

export default function ApprovalsIndex() {
    const { pendingPos, pendingMrs } = usePage().props;
    const { can } = usePermissions();
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

    const handleApprove = (type, id) => {
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
    };

    const handleReject = (type, id) => {
        if (processing) return;
        setConfirmModal({
            isOpen: true,
            type: 'prompt',
            title: 'Decline Request',
            message: 'Reason for declining (optional):',
            inputPlaceholder: 'Reason...',
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
    };

    const mrColumns = useMemo(() => [
        {
            accessorKey: 'id',
            header: 'MR No.',
            cell: ({ row }) => <span className="font-bold text-slate-900 dark:text-white">MR-{row.original.id.toString().padStart(4, '0')}</span>,
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
    ], [processing, can]);

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
    ], [processing, can]);

    const openDetails = (item, type) => {
        setSelectedItem(item);
        setDrawerType(type);
        setIsDrawerOpen(true);
    };

    const TabBtn = ({ id, label, count }) => (
        <button onClick={() => setTab(id)} className={`px-4 py-3 border-b-2 text-sm font-bold transition-colors ${tab === id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {label} <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs">{count}</span>
        </button>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Pending Approvals" />
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <TabBtn id="mr" label="Material Requests" count={mrs.length} />
                    <TabBtn id="po" label="Purchase Orders" count={pos.length} />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    {tab === 'mr' ? (
                        <DataTable 
                            columns={mrColumns} 
                            data={mrs} 
                            onRowClick={(row) => openDetails(row, 'mr')}
                            showSearch={true}
                        />
                    ) : (
                        <DataTable 
                            columns={poColumns} 
                            data={pos} 
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
            />

            <Drawer 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                title={drawerType === 'mr' ? 'Material Request Details' : 'Purchase Order Details'}
            >
                {selectedItem && (
                    <div className="space-y-5 pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        {drawerType === 'mr' ? <ClipboardList size={18} /> : <FileText size={18} />}
                                    </div>
                                    {drawerType === 'mr' ? 'MR' : 'PO'}-{selectedItem.id.toString().padStart(4, '0')}
                                </h1>
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <Clock size={12} />
                                    <span>Created on {new Date(selectedItem.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Pending
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                            <div className="space-y-0.5">
                                <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                    <Building2 size={10} /> Project
                                </div>
                                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{selectedItem.project?.name}</div>
                            </div>
                            <div className="space-y-0.5">
                                <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                    <User size={10} /> Requester
                                </div>
                                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{selectedItem.requester?.name}</div>
                            </div>
                            {drawerType === 'po' && (
                                <div className="space-y-0.5 col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                    <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">Total Cost</div>
                                    <div className="font-bold text-base text-blue-600 dark:text-cyan-400 font-mono">
                                        ₱{Number(selectedItem.total_amount).toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {(drawerType === 'mr' || drawerType === 'po') && selectedItem.items && selectedItem.items.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    {drawerType === 'mr' ? 'Items Requested' : 'Purchase Order Items'}
                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[10px]">{selectedItem.items.length}</span>
                                </h3>
                                <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 shadow-sm">
                                    {selectedItem.items.map((item, idx) => (
                                        <div key={idx} className="p-3 flex justify-between items-center bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                    {drawerType === 'mr' ? item.item_description : item.material_name}
                                                </div>
                                                {item.description && (
                                                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                                    {Number(item.quantity).toLocaleString()} <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter ml-0.5">{item.unit}</span>
                                                </div>
                                                {drawerType === 'po' && (
                                                    <div className="flex flex-col items-end gap-0.5 pt-1">
                                                        <div className="flex items-center gap-1.5 justify-end mb-0.5">
                                                            <div className={`text-[10px] font-mono font-bold ${
                                                                getPriceVariance(item.unit_price, item.purchase_request_item?.estimated_unit_cost) > VARIANCE_THRESHOLD 
                                                                    ? 'text-red-500' 
                                                                    : (getPriceVariance(item.unit_price, item.purchase_request_item?.estimated_unit_cost) < -VARIANCE_THRESHOLD ? 'text-emerald-500' : 'text-slate-900 dark:text-white')
                                                            }`}>
                                                                @ ₱{Number(item.unit_price).toLocaleString()}
                                                            </div>
                                                            {getPriceVariance(item.unit_price, item.purchase_request_item?.estimated_unit_cost) > VARIANCE_THRESHOLD && (
                                                                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-tighter bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-1 py-0.5 rounded leading-none">
                                                                    <TrendingUp size={8} /> +{getPriceVariance(item.unit_price, item.purchase_request_item?.estimated_unit_cost)?.toFixed(0)}% OVER
                                                                </span>
                                                            )}
                                                            {getPriceVariance(item.unit_price, item.purchase_request_item?.estimated_unit_cost) < -VARIANCE_THRESHOLD && (
                                                                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-tighter bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-1 py-0.5 rounded leading-none">
                                                                    ↓ {Math.abs(getPriceVariance(item.unit_price, item.purchase_request_item?.estimated_unit_cost)).toFixed(0)}% UNDER
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.purchase_request_item?.estimated_unit_cost && (
                                                            <div className="text-[9px] text-slate-400">
                                                                Est. ₱{Number(item.purchase_request_item.estimated_unit_cost).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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

