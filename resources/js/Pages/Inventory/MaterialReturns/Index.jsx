import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { RotateCcw, PackageCheck, CheckCircle, Clock, Inbox, MapPin, User, Info } from 'lucide-react';
import DataTable from '@/Components/UI/DataTable';
import Drawer from '@/Components/UI/Drawer';

const STATUS_BADGE = {
    PENDING: { cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Pending' },
    RECEIVED: { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Received' },
};

export default function MaterialReturnsIndex({ returns }) {
    const { can } = usePermissions();
    const { flash } = usePage().props;
    const [processing, setProcessing] = useState(null);
    const [selectedReturn, setSelectedReturn] = useState(null);

    const handleReceive = (id, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (processing) return;
        setProcessing(id);
        router.post(route('material-returns.receive', id), {}, {
            onFinish: () => {
                setProcessing(null);
                setSelectedReturn(null);
            },
        });
    };

    const columns = [
        {
            accessorKey: 'material_name',
            header: 'Material',
            cell: ({ row }) => (
                <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{row.original.material_name}</div>
                    {row.original.remarks && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{row.original.remarks}</div>}
                </div>
            )
        },
        {
            id: 'project',
            accessorFn: row => row.project?.name || '',
            header: 'Project',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} className="text-emerald-500" />
                    {row.original.project?.name ?? '—'}
                </div>
            )
        },
        {
            accessorKey: 'quantity',
            header: () => <div className="text-right">Qty</div>,
            cell: ({ row }) => (
                <div className="text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {parseFloat(row.original.quantity).toFixed(2)} <span className="text-xs text-slate-400 font-normal ml-1">{row.original.unit}</span>
                </div>
            )
        },
        {
            id: 'returned_by',
            accessorFn: row => row.returned_by?.name || '',
            header: 'Returned By',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-slate-500">
                    <User size={14} />
                    {row.original.returned_by?.name ?? '—'}
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const badge = STATUS_BADGE[row.original.status] ?? STATUS_BADGE.PENDING;
                return (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.cls}`}>
                        {row.original.status === 'PENDING' ? <Clock size={10} /> : <CheckCircle size={10} />}
                        {badge.label}
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                if (row.original.status === 'PENDING' && can('manage inventory')) {
                    return (
                        <div className="flex justify-end">
                            <button
                                onClick={(e) => handleReceive(row.original.id, e)}
                                disabled={processing === row.original.id}
                                className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                <PackageCheck size={13} />
                                {processing === row.original.id ? '...' : 'Receive'}
                            </button>
                        </div>
                    );
                }
                return null;
            }
        }
    ];

    const renderReturnDetails = (ret) => {
        if (!ret) return null;
        const badge = STATUS_BADGE[ret.status] ?? STATUS_BADGE.PENDING;

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-teal-500/10 rounded-xl border border-teal-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-500 text-white rounded-lg">
                            <RotateCcw size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{ret.material_name}</h3>
                            <p className="text-slate-500">Return Request #{ret.id.toString().padStart(4, '0')}</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${badge.cls}`}>
                        {ret.status === 'PENDING' ? <Clock size={14} /> : <CheckCircle size={14} />}
                        {badge.label}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-500 uppercase font-bold block mb-1 tracking-widest">Quantity Returned</span>
                        <span className="text-2xl font-mono font-bold text-teal-600 dark:text-teal-400">
                            {parseFloat(ret.quantity).toLocaleString()} <span className="text-sm font-normal text-slate-400 uppercase ml-1">{ret.unit}</span>
                        </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-500 uppercase font-bold block mb-1 tracking-widest">From Project</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                            <MapPin size={14} className="text-emerald-500" />
                            {ret.project?.name ?? '—'}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-start gap-3">
                        <User size={18} className="text-slate-400 mt-0.5" />
                        <div>
                            <span className="text-xs text-slate-500 uppercase font-bold block mb-1 tracking-widest">Requested By</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{ret.returned_by?.name ?? '—'}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <Info size={18} className="text-slate-400 mt-0.5" />
                        <div>
                            <span className="text-xs text-slate-500 uppercase font-bold block mb-1 tracking-widest">Remarks / Reason</span>
                            <p className="text-sm text-slate-600 dark:text-slate-300 italic">{ret.remarks || 'No remarks provided.'}</p>
                        </div>
                    </div>
                </div>

                {ret.status === 'PENDING' && can('manage inventory') && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => handleReceive(ret.id)}
                            disabled={processing === ret.id}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-teal-600/20 disabled:opacity-50"
                        >
                            <PackageCheck size={20} />
                            {processing === ret.id ? 'Processing...' : 'Confirm Receipt into Inventory'}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 mt-3 uppercase font-bold tracking-tighter">
                            By confirming, this quantity will be added back to the main warehouse stock.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Material Returns" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {/* Header */}
                <header className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl text-white shadow-lg shadow-teal-500/30">
                                <RotateCcw size={20} />
                            </div>
                            Material Returns
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Review and receive material returns from various project sites.</p>
                    </div>
                </header>

                {/* Returns Table */}
                <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                    <DataTable
                        columns={columns}
                        data={returns.data || []}
                        onRowClick={(row) => setSelectedReturn(row)}
                    />
                </div>
            </div>

            <Drawer
                isOpen={!!selectedReturn}
                onClose={() => setSelectedReturn(null)}
                title="Material Return Details"
                width="w-full max-w-2xl"
            >
                {renderReturnDetails(selectedReturn)}
            </Drawer>
        </AuthenticatedLayout>
    );
}
