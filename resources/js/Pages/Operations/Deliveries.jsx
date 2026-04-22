import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import Drawer from '@/Components/UI/Drawer';
import DataTable from '@/Components/UI/DataTable';
import {
    Truck, Package, CheckCircle, AlertTriangle, ShoppingBag,
    Warehouse, LayoutList, Clock, Calendar
} from 'lucide-react';

const TABS = [
    { id: 'all', label: 'All Deliveries', mobileLabel: 'All', icon: LayoutList },
    { id: 'supplier', label: 'From Suppliers', mobileLabel: 'Suppliers', icon: ShoppingBag },
    { id: 'warehouse', label: 'From Warehouse', mobileLabel: 'Warehouse', icon: Warehouse },
];


export default function Deliveries() {
    const { allDeliveries = [], supplierDeliveries = [], warehouseDeliveries = [] } = usePage().props;

    const [activeTab, setActiveTab] = useState('all');
    const [confirming, setConfirming] = useState(null);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [itemQuantities, setItemQuantities] = useState({});
    const [itemRejections, setItemRejections] = useState({});
    const [receiptRemarks, setReceiptRemarks] = useState('');

    const openDelivery = (item) => {
        if (confirming) return;
        if (item.type === 'purchase_order' && item.items?.length) {
            const init = {};
            const initRej = {};
            item.items.forEach(i => {
                init[i.id] = String(i.remaining_quantity ?? i.quantity);
                initRej[i.id] = false;
            });
            setItemQuantities(init);
            setItemRejections(initRej);
        } else if (item.type === 'site_release') {
            setItemQuantities({ [item.id]: String(item.quantity) });
            setReceiptRemarks('');
        }
        setSelectedDelivery(item);
    };

    const closeDrawer = () => {
        if (confirming) return;
        setSelectedDelivery(null);
        setItemQuantities({});
        setItemRejections({});
        setReceiptRemarks('');
    };

    const submitReceipt = () => {
        if (!selectedDelivery || confirming) return;
        setConfirming(selectedDelivery.id);

        const endpoint = selectedDelivery.type === 'site_release'
            ? route('site-release.confirm', selectedDelivery.id)
            : route('receiving.auto', selectedDelivery.id);

        const payload = selectedDelivery.type === 'purchase_order'
            ? {
                quantities: itemQuantities,
                rejections: itemRejections,
                receipt_remarks: receiptRemarks
            }
            : {
                quantity_received: itemQuantities[selectedDelivery.id],
                receipt_remarks: receiptRemarks
            };

        router.post(endpoint, payload, {
            onFinish: () => {
                setConfirming(null);
                setSelectedDelivery(null);
                setItemQuantities({});
                setItemRejections({});
            },
        });
    };

    const rows = useMemo(() => {
        if (activeTab === 'all') return allDeliveries;
        if (activeTab === 'supplier') return supplierDeliveries;
        return warehouseDeliveries;
    }, [activeTab, allDeliveries, supplierDeliveries, warehouseDeliveries]);

    const columns = useMemo(() => {
        const baseAction = {
            id: 'action',
            header: 'Action',
            cell: ({ row }) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        openDelivery(row.original);
                    }}
                    disabled={confirming === row.original.id}
                    className={`
                        shrink-0 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold
                        flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 shadow-sm
                        ${row.original.type === 'purchase_order'
                            ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                            : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20'
                        }
                    `}
                >
                    <CheckCircle size={12} />
                    {confirming === row.original.id ? 'Loading…' : row.original.type === 'purchase_order' ? 'Receive' : 'Confirm'}
                </button>
            )
        };

        if (activeTab === 'all') {
            return [
                {
                    accessorKey: 'type',
                    header: 'Type',
                    cell: ({ row }) => <TypeBadge type={row.original.type} />
                },
                {
                    accessorKey: 'title',
                    header: 'Reference',
                    mobileHeader: 'Ref',
                    cell: ({ row }) => <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.original.title}</span>
                },
                {
                    accessorKey: 'project_name',
                    header: 'Project',
                    cell: ({ row }) => <span className="text-slate-500 text-xs">{row.original.project_name}</span>
                },
                {
                    accessorKey: 'status',
                    header: 'Status',
                    cell: ({ row }) => <StatusBadge status={row.original.status} />
                },
                {
                    id: 'info',
                    header: 'Info',
                    cell: ({ row }) => (
                        <span className="text-slate-500 text-xs">
                            {row.original.type === 'purchase_order'
                                ? <span>{row.original.supplier} · {row.original.items?.length} item{row.original.items?.length !== 1 ? 's' : ''}</span>
                                : <span>{row.original.material_name} · {Number(row.original.quantity).toLocaleString()} {row.original.unit}</span>
                            }
                        </span>
                    )
                },
                {
                    accessorKey: 'created_at',
                    header: 'Date',
                    cell: ({ row }) => (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Clock size={12} /> {row.original.created_at}
                        </span>
                    )
                },
                baseAction
            ];
        }

        if (activeTab === 'supplier') {
            return [
                {
                    accessorKey: 'title',
                    header: 'PO Reference',
                    mobileHeader: 'Ref',
                    cell: ({ row }) => (
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Package size={14} className="text-indigo-500" /> {row.original.title}
                        </span>
                    )
                },
                {
                    accessorKey: 'supplier',
                    header: 'Supplier',
                    cell: ({ row }) => <span className="text-slate-600 dark:text-slate-300">{row.original.supplier}</span>
                },
                {
                    accessorKey: 'project_name',
                    header: 'Project',
                    cell: ({ row }) => <span className="text-slate-500 text-xs">{row.original.project_name}</span>
                },
                {
                    id: 'items_count',
                    header: 'Items',
                    cell: ({ row }) => <span className="text-slate-500 text-xs">{row.original.items?.length} item{row.original.items?.length !== 1 ? 's' : ''}</span>
                },
                {
                    accessorKey: 'status',
                    header: 'Status',
                    cell: ({ row }) => <StatusBadge status={row.original.status} />
                },
                {
                    accessorKey: 'created_at',
                    header: 'Updated',
                    cell: ({ row }) => (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Calendar size={12} /> {row.original.created_at}
                        </span>
                    )
                },
                baseAction
            ];
        }

        return [
            {
                accessorKey: 'title',
                header: 'Reference',
                mobileHeader: 'Ref',
                cell: ({ row }) => (
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Truck size={14} className="text-violet-500" /> {row.original.title}
                    </span>
                )
            },
            {
                accessorKey: 'material_name',
                header: 'Material',
                cell: ({ row }) => <span className="text-slate-600 dark:text-slate-300">{row.original.material_name}</span>
            },
            {
                accessorKey: 'project_name',
                header: 'Project',
                cell: ({ row }) => <span className="text-slate-500 text-xs">{row.original.project_name}</span>
            },
            {
                accessorKey: 'issued_to',
                header: 'Issued To',
                mobileHeader: 'To',
                cell: ({ row }) => <span className="text-slate-500 text-xs">{row.original.issued_to}</span>
            },
            {
                id: 'qty',
                header: 'Qty',
                cell: ({ row }) => (
                    <span className="font-mono font-bold text-violet-600 dark:text-violet-400 text-xs">
                        {Number(row.original.quantity).toLocaleString()} <span className="font-normal text-slate-400 uppercase">{row.original.unit}</span>
                    </span>
                )
            },
            {
                accessorKey: 'created_at',
                header: 'Released',
                cell: ({ row }) => (
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock size={12} /> {row.original.created_at}
                    </span>
                )
            },
            baseAction
        ];
    }, [activeTab, confirming]);


    return (
        <AuthenticatedLayout>
            <Head title="Pending Deliveries" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 md:p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
                    <div className="relative z-10">
                        <p className="text-indigo-100 text-[10px] md:text-xs font-semibold uppercase tracking-widest mb-1">Operations</p>
                        <h2 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
                            <Truck size={20} className="text-white md:w-6 md:h-6" /> Pending Deliveries
                        </h2>
                        <div className="text-indigo-100 text-xs md:text-sm flex flex-wrap gap-x-2 gap-y-1 items-center">
                            <span><span className="font-bold text-white">{allDeliveries.length}</span> awaiting confirmation</span>
                            <span className="hidden md:inline text-white/30">·</span>
                            <span><span className="font-bold text-white">{supplierDeliveries.length}</span> from suppliers</span>
                            <span className="hidden md:inline text-white/30">·</span>
                            <span><span className="font-bold text-white">{warehouseDeliveries.length}</span> from warehouse</span>
                        </div>
                    </div>
                </div>


                {/* Tab Switcher & Table */}
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-3xl p-4 md:p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex gap-1 md:gap-2 bg-slate-100/50 dark:bg-zinc-800/50 rounded-2xl p-1 w-full md:w-fit overflow-x-auto scrollbar-hide flex-nowrap pr-4 md:pr-1">
                            {TABS.map(({ id, label, mobileLabel, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all duration-300 whitespace-nowrap
                                        ${activeTab === id
                                            ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                                        }`}
                                >
                                    <Icon size={14} />
                                    <span className="hidden md:inline">{label}</span>
                                    <span className="md:hidden">{mobileLabel}</span>
                                    <Badge n={id === 'all' ? allDeliveries.length : id === 'supplier' ? supplierDeliveries.length : warehouseDeliveries.length} active={activeTab === id} />
                                </button>
                            ))}
                        </div>

                    </div>


                    <DataTable
                        columns={columns}
                        data={rows}
                        onRowClick={openDelivery}
                    />
                </div>
            </div>

            {/* Confirm Drawer */}
            <Drawer
                isOpen={!!selectedDelivery}
                onClose={closeDrawer}
                title={selectedDelivery?.type === 'purchase_order' ? 'Confirm Purchase Receipt' : 'Confirm Warehouse Release'}
            >
                <div className="flex flex-col h-full">
                    <div className="flex-1 space-y-6">
                        {selectedDelivery?.type === 'purchase_order' ? (
                            <div className="space-y-6">
                                <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 p-4 rounded-2xl text-xs border border-indigo-200 dark:border-indigo-500/20 leading-relaxed">
                                    <p className="font-bold flex items-center gap-2 mb-1 text-indigo-700 dark:text-indigo-200">
                                        <AlertTriangle size={14} /> Receipt Instructions
                                    </p>
                                    <p>Enter the actual quantity received for each item. Mark incorrect or damaged items as <strong>Rejected</strong>.</p>
                                </div>

                                {selectedDelivery.items?.length > 0 ? (
                                    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-sm">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-50 dark:bg-zinc-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/[0.08]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Material</th>
                                                    <th className="px-3 py-3 text-right">Ordered</th>
                                                    <th className="px-3 py-3 text-right">Remaining</th>
                                                    <th className="px-3 py-3 text-right w-24">Received</th>
                                                    <th className="px-3 py-3 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                                                {selectedDelivery.items.map(item => {
                                                    const entered = parseFloat(itemQuantities[item.id] || 0);
                                                    const ordered = parseFloat(item.quantity);
                                                    const isShort = entered < ordered && entered > 0;
                                                    const isRejected = itemRejections[item.id];

                                                    return (
                                                        <tr key={item.id} className={`transition-all ${isRejected ? 'bg-rose-50/50 dark:bg-rose-950/10 opacity-70' : ''}`}>
                                                            <td className="px-4 py-4">
                                                                <div className={`font-semibold transition-all ${isRejected ? 'text-rose-500 line-through' : 'text-slate-800 dark:text-zinc-200'}`}>
                                                                    {item.material_name}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{item.unit}</div>
                                                            </td>
                                                            <td className="px-3 py-4 text-right font-mono text-slate-400">{Number(item.quantity).toLocaleString()}</td>
                                                            <td className="px-3 py-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">{Number(item.remaining_quantity ?? item.quantity).toLocaleString()}</td>
                                                            <td className="px-3 py-4 text-right">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max={item.remaining_quantity ?? item.quantity}
                                                                    value={itemQuantities[item.id] ?? (item.remaining_quantity ?? item.quantity)}
                                                                    onChange={e => setItemQuantities(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                    disabled={isRejected}
                                                                    className={`w-full text-right font-mono text-xs px-3 py-2 rounded-xl border focus:outline-none transition-all disabled:opacity-30
                                                                        ${isShort
                                                                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                                                            : 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white'
                                                                        }`}
                                                                />
                                                            </td>
                                                            <td className="px-3 py-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setItemRejections(prev => ({ ...prev, [item.id]: !isRejected }))}
                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all active:scale-95
                                                                        ${isRejected
                                                                            ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                                                                            : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-white/[0.08] text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:text-rose-400'
                                                                        }`}
                                                                >
                                                                    {isRejected ? 'REJECTED' : 'REJECT'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
                                        <Package className="mx-auto mb-3 text-slate-300 opacity-50" size={32} />
                                        <p className="text-slate-400 text-xs font-medium">No line items found for this delivery.</p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">General Remarks</label>
                                    <textarea
                                        value={receiptRemarks}
                                        onChange={e => setReceiptRemarks(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-inner"
                                        rows={3}
                                        placeholder="e.g., All items arrived in good condition..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-violet-50 dark:bg-violet-500/10 text-violet-800 dark:text-violet-300 p-5 rounded-2xl text-sm border border-violet-200 dark:border-violet-500/20 shadow-sm shadow-violet-500/5">
                                    <p className="font-bold text-base text-violet-700 dark:text-violet-200 mb-2">Internal Logistics Acknowledgement</p>
                                    <div className="space-y-2 opacity-90 text-sm">
                                        <p>Confirming arrival of <span className="font-bold">{selectedDelivery?.material_name}</span> at site.</p>
                                        <div className="flex items-center gap-4 py-2 border-y border-violet-200/30 dark:border-violet-500/20 my-2 font-mono text-xs">
                                            <div>Released: <span className="font-bold text-violet-600 dark:text-violet-400">{Number(selectedDelivery?.quantity).toLocaleString()} {selectedDelivery?.unit}</span></div>
                                            <div>Issued To: <span className="font-bold text-violet-600 dark:text-violet-400">{selectedDelivery?.issued_to}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Quantity Actually Received *</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={itemQuantities[selectedDelivery?.id] || ''}
                                                onChange={e => setItemQuantities(prev => ({ ...prev, [selectedDelivery.id]: e.target.value }))}
                                                max={selectedDelivery?.quantity}
                                                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl px-5 py-4 text-lg font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-inner"
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold uppercase pointer-events-none">
                                                {selectedDelivery?.unit}
                                            </div>
                                        </div>
                                        {Number(itemQuantities[selectedDelivery?.id]) < Number(selectedDelivery?.quantity) && Number(itemQuantities[selectedDelivery?.id]) > 0 && (
                                            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                                                <p className="text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center gap-2">
                                                    <AlertTriangle size={14} /> Partial Receipt Detected
                                                </p>
                                                <p className="text-amber-600/70 dark:text-amber-400/70 text-[10px] mt-1 ml-5">
                                                    You are confirming {(Number(selectedDelivery?.quantity) - Number(itemQuantities[selectedDelivery?.id])).toLocaleString()} {selectedDelivery?.unit} short.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Remarks (Optional)</label>
                                        <textarea
                                            value={receiptRemarks}
                                            onChange={e => setReceiptRemarks(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none shadow-inner"
                                            rows={3}
                                            placeholder="e.g., Materials delivered and verified by site engineer..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 mt-auto flex items-center justify-between border-t border-slate-100 dark:border-white/[0.08]">
                        <button
                            onClick={closeDrawer}
                            disabled={!!confirming}
                            className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitReceipt}
                            disabled={!!confirming || (selectedDelivery?.type === 'site_release' && !itemQuantities[selectedDelivery?.id])}
                            className={`
                                ${selectedDelivery?.type === 'purchase_order'
                                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                                    : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20'
                                }
                                text-white px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-lg
                            `}
                        >
                            {confirming === selectedDelivery?.id ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </div>
                            ) : (
                                <><CheckCircle size={18} /> Confirm Receipt</>
                            )}
                        </button>
                    </div>
                </div>
            </Drawer>
        </AuthenticatedLayout>
    );
}

function TypeBadge({ type }) {
    return type === 'purchase_order' ? (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
            <Package size={10} /> Supplier
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
            <Warehouse size={10} /> Warehouse
        </span>
    );
}

function StatusBadge({ status }) {
    const map = {
        'APPROVED': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
        'PARTIALLY DELIVERED': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
        'IN_TRANSIT': 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 border-violet-100 dark:border-violet-500/20 font-black',
    };
    return (
        <span className={`inline-flex items-center text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm ${map[status] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}>
            {status}
        </span>
    );
}

function Badge({ n, active }) {
    if (n === 0) return null;
    return (
        <span className={`ml-2 px-1.5 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-colors
            ${active ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500'}
        `}>
            {n}
        </span>
    );
}

