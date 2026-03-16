import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import {
    Truck, Package, CheckCircle, AlertTriangle, ShoppingBag,
    Warehouse, LayoutList, ChevronRight, Clock, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
    { id: 'all', label: 'All Deliveries', icon: LayoutList },
    { id: 'supplier', label: 'From Suppliers', icon: ShoppingBag },
    { id: 'warehouse', label: 'From Warehouse', icon: Warehouse },
];

export default function Deliveries() {
    const { allDeliveries = [], supplierDeliveries = [], warehouseDeliveries = [], flash } = usePage().props;

    const [activeTab, setActiveTab] = useState('all');
    const [confirming, setConfirming] = useState(null);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [itemQuantities, setItemQuantities] = useState({});
    const [itemRejections, setItemRejections] = useState({});
    const [receiptRemarks, setReceiptRemarks] = useState('');

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const openDelivery = (item) => {
        if (confirming) return;
        if (item.type === 'purchase_order' && item.items?.length) {
            const init = {};
            const initRej = {};
            item.items.forEach(i => { 
                init[i.id] = String(i.quantity); 
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

    const closeModal = () => {
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

    const rows = activeTab === 'all' ? allDeliveries
        : activeTab === 'supplier' ? supplierDeliveries
            : warehouseDeliveries;

    return (
        <AuthenticatedLayout>
            <Head title="Pending Deliveries" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
                    <div className="relative z-10">
                        <p className="text-indigo-100 text-xs font-semibold uppercase tracking-widest mb-1">Operations</p>
                        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                            <Truck size={22} /> Pending Deliveries
                        </h2>
                        <p className="text-indigo-100 text-sm">
                            <span className="font-bold text-white">{allDeliveries.length}</span> deliveries awaiting confirmation
                            &nbsp;·&nbsp;
                            <span className="font-bold text-white">{supplierDeliveries.length}</span> from suppliers
                            &nbsp;·&nbsp;
                            <span className="font-bold text-white">{warehouseDeliveries.length}</span> from warehouse
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-2xl p-1.5 w-fit shadow-sm">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
                                ${activeTab === id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-800/50'
                                }`}
                        >
                            <Icon size={14} />
                            {label}
                            {id === 'all' && allDeliveries.length > 0 && <Badge n={allDeliveries.length} />}
                            {id === 'supplier' && supplierDeliveries.length > 0 && <Badge n={supplierDeliveries.length} />}
                            {id === 'warehouse' && warehouseDeliveries.length > 0 && <Badge n={warehouseDeliveries.length} />}
                        </button>
                    ))}
                </div>

                {/* Table Card */}
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                    {rows.length === 0 ? (
                        <EmptyState tab={activeTab} />
                    ) : (
                        <div className="overflow-x-auto">
                            {activeTab === 'all' && <AllTable rows={rows} confirming={confirming} onOpen={openDelivery} />}
                            {activeTab === 'supplier' && <SupplierTable rows={rows} confirming={confirming} onOpen={openDelivery} />}
                            {activeTab === 'warehouse' && <WarehouseTable rows={rows} confirming={confirming} onOpen={openDelivery} />}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Modal */}
            <Modal
                isOpen={!!selectedDelivery}
                onClose={closeModal}
                title={selectedDelivery?.type === 'purchase_order' ? 'Confirm PO Delivery' : 'Confirm Warehouse Release'}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-4">
                    {selectedDelivery?.type === 'purchase_order' ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 p-3 rounded-xl text-xs border border-blue-200 dark:border-blue-500/20">
                                <p className="font-semibold">Enter the actual quantity received for each item.</p>
                                <p className="opacity-70 mt-0.5">Mark items as <strong>Rejected</strong> if they are incorrect or damaged. Rejected items will not be added to stock.</p>
                            </div>

                            {selectedDelivery.items?.length > 0 ? (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Material</th>
                                                <th className="px-3 py-2 text-center w-16">Unit</th>
                                                <th className="px-3 py-2 text-right w-20">Ordered</th>
                                                <th className="px-3 py-2 text-right w-24">Received</th>
                                                <th className="px-3 py-2 text-center w-20">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {selectedDelivery.items.map(item => {
                                                const entered = parseFloat(itemQuantities[item.id] || 0);
                                                const ordered = parseFloat(item.quantity);
                                                const isShort = entered < ordered && entered > 0;
                                                const isRejected = itemRejections[item.id];
                                                
                                                return (
                                                    <tr key={item.id} className={`transition-colors ${isRejected ? 'bg-rose-50/50 dark:bg-rose-950/10' : 'bg-white dark:bg-slate-900/50'}`}>
                                                        <td className={`px-3 py-2.5 font-medium transition-all ${isRejected ? 'text-rose-500 line-through opacity-60' : 'text-slate-800 dark:text-slate-200'}`}>
                                                            {item.material_name}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-[10px] text-slate-500 uppercase">{item.unit}</td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-slate-500 text-[10px]">{Number(item.quantity).toLocaleString()}</td>
                                                        <td className="px-3 py-1.5 text-right">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max={item.quantity}
                                                                value={itemQuantities[item.id] ?? item.quantity}
                                                                onChange={e => setItemQuantities(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                disabled={isRejected}
                                                                className={`w-20 text-right font-mono text-sm px-2 py-1 rounded-lg border focus:outline-none transition-colors disabled:opacity-30
                                                                    ${isShort
                                                                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 focus:border-amber-500'
                                                                        : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500'
                                                                    }`}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-1.5 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => setItemRejections(prev => ({ ...prev, [item.id]: !isRejected }))}
                                                                className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all
                                                                    ${isRejected
                                                                        ? 'bg-rose-600 border-rose-600 text-white'
                                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-200'
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
                                <p className="text-slate-400 text-xs text-center py-4">No line items found.</p>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Remarks (Optional)</label>
                                <textarea
                                    value={receiptRemarks}
                                    onChange={e => setReceiptRemarks(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all resize-none"
                                    rows={2}
                                    placeholder="e.g. Received in good condition"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-violet-50 dark:bg-violet-500/10 text-violet-800 dark:text-violet-300 p-4 rounded-xl text-sm border border-violet-200 dark:border-violet-500/20">
                                <p className="font-semibold mb-1">Confirming {selectedDelivery?.title}.</p>
                                <p className="opacity-80 text-sm">
                                    <span className="font-bold">{selectedDelivery?.material_name}</span> — qty{' '}
                                    <span className="font-mono font-bold">{selectedDelivery?.quantity}</span>{' '}
                                    {selectedDelivery?.unit} issued to{' '}
                                    <span className="font-bold">{selectedDelivery?.issued_to}</span>.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Quantity Actually Received *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={itemQuantities[selectedDelivery?.id] || ''}
                                        onChange={e => setItemQuantities(prev => ({ ...prev, [selectedDelivery.id]: e.target.value }))}
                                        max={selectedDelivery?.quantity}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500 transition-all font-mono"
                                        placeholder="0.00"
                                    />
                                    {Number(itemQuantities[selectedDelivery?.id]) < Number(selectedDelivery?.quantity) && Number(itemQuantities[selectedDelivery?.id]) > 0 && (
                                        <p className="text-amber-500 text-[10px] font-bold flex items-center gap-1 mt-1">
                                            <AlertTriangle size={12} /> Partial receipt — {(Number(selectedDelivery?.quantity) - Number(itemQuantities[selectedDelivery?.id])).toLocaleString()} {selectedDelivery?.unit} short
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Remarks (Optional)</label>
                                    <textarea
                                        value={receiptRemarks}
                                        onChange={e => setReceiptRemarks(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500 transition-all resize-none"
                                        rows={2}
                                        placeholder="e.g. Received in good condition"
                                    />
                                </div>
                            </div>

                            <p className="opacity-60 text-xs mt-1">This acknowledges that materials dispatched from the warehouse have physically arrived at the site.</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={closeModal}
                            disabled={!!confirming}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitReceipt}
                            disabled={!!confirming || (selectedDelivery?.type === 'site_release' && !itemQuantities[selectedDelivery?.id])}
                            className={`
                                ${selectedDelivery?.type === 'purchase_order'
                                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                                    : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20'
                                }
                                text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-md
                            `}
                        >
                            {confirming === selectedDelivery?.id ? (
                                'Processing...'
                            ) : (
                                <><CheckCircle size={16} /> Confirm Receipt</>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

/* ─── Sub-tables ─────────────────────────────────────────────────────────── */

function AllTable({ rows, confirming, onOpen }) {
    return (
        <table className="w-full text-sm">
            <THead cols={['Type', 'Reference', 'Project', 'Info', 'Date', 'Action']} />
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {rows.map(row => (
                    <tr key={`${row.type}-${row.id}`} className="hover:bg-white/60 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3">
                            <TypeBadge type={row.type} />
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{row.title}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{row.project_name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                            {row.type === 'purchase_order'
                                ? <span>{row.supplier} · {row.items?.length} item{row.items?.length !== 1 ? 's' : ''}</span>
                                : <span>{row.material_name} · {Number(row.quantity).toLocaleString()} {row.unit}</span>
                            }
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs flex items-center gap-1">
                            <Clock size={12} /> {row.created_at}
                        </td>
                        <td className="px-4 py-3 text-center">
                            <ActionButton row={row} confirming={confirming} onOpen={onOpen} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function SupplierTable({ rows, confirming, onOpen }) {
    return (
        <table className="w-full text-sm">
            <THead cols={['PO Reference', 'Supplier', 'Project', 'Items', 'Status', 'Updated', 'Action']} />
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {rows.map(row => (
                    <tr key={row.id} className="hover:bg-white/60 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Package size={14} className="text-blue-500" /> {row.title}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.supplier}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{row.project_name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{row.items?.length} line item{row.items?.length !== 1 ? 's' : ''}</td>
                        <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {row.created_at}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                            <ActionButton row={row} confirming={confirming} onOpen={onOpen} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function WarehouseTable({ rows, confirming, onOpen }) {
    return (
        <table className="w-full text-sm">
            <THead cols={['Reference', 'Material', 'Project', 'Issued To', 'Qty', 'Released', 'Action']} />
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {rows.map(row => (
                    <tr key={row.id} className="hover:bg-white/60 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Truck size={14} className="text-violet-500" /> {row.title}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.material_name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{row.project_name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{row.issued_to}</td>
                        <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400 text-xs">
                            {Number(row.quantity).toLocaleString()} <span className="font-normal text-slate-400 uppercase">{row.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                            <span className="flex items-center gap-1"><Clock size={12} /> {row.created_at}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                            <ActionButton row={row} confirming={confirming} onOpen={onOpen} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/* ─── Shared helpers ─────────────────────────────────────────────────────── */

function THead({ cols }) {
    return (
        <thead className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200/60 dark:border-zinc-700/60">
            <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {cols.map(c => <th key={c} className="px-4 py-3 text-left first:pl-5">{c}</th>)}
            </tr>
        </thead>
    );
}

function ActionButton({ row, confirming, onOpen }) {
    const isPO = row.type === 'purchase_order';
    return (
        <button
            onClick={() => onOpen(row)}
            disabled={confirming === row.id}
            className={`
                shrink-0 text-white px-3 py-1.5 rounded-xl text-xs font-bold
                flex items-center gap-1.5 mx-auto transition-all active:scale-95 disabled:opacity-60 shadow-sm
                ${isPO
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                    : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20'
                }
            `}
        >
            <CheckCircle size={13} />
            {confirming === row.id ? 'Loading…' : isPO ? 'Receive' : 'Confirm'}
        </button>
    );
}

function TypeBadge({ type }) {
    return type === 'purchase_order' ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
            <Package size={10} /> Supplier
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20">
            <Warehouse size={10} /> Warehouse
        </span>
    );
}

function StatusBadge({ status }) {
    const map = {
        'APPROVED': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
        'PARTIALLY DELIVERED': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    };
    return (
        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {status}
        </span>
    );
}

function Badge({ n }) {
    return (
        <span className="ml-1 bg-white/30 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {n}
        </span>
    );
}

function EmptyState({ tab }) {
    const msgs = {
        all: { title: 'No pending deliveries', sub: 'All deliveries have been confirmed.' },
        supplier: { title: 'No supplier deliveries', sub: 'No approved POs awaiting receipt at site.' },
        warehouse: { title: 'No warehouse dispatches', sub: 'No in-transit site releases to confirm.' },
    };
    const { title, sub } = msgs[tab];
    return (
        <div className="text-center py-20 text-slate-400">
            <Truck size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest opacity-50">{title}</p>
            <p className="text-xs opacity-40 mt-1">{sub}</p>
        </div>
    );
}
