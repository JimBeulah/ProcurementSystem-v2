import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import { Package, Search, MapPin, ArrowRightCircle, Clock, User, AlertTriangle, CheckCircle2, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function SiteReleaseIndex() {
    const { inventory, releases, flash, auth } = usePage().props;
    const items = inventory || [];
    const releaseHistory = releases || [];

    const [search, setSearch] = useState('');
    const [releaseModal, setReleaseModal] = useState({ open: false, item: null });
    const [confirmModal, setConfirmModal] = useState({ open: false, release: null });
    const [qty, setQty] = useState('');
    const [issuedTo, setIssuedTo] = useState('');
    const [purpose, setPurpose] = useState('');
    const [receiptQty, setReceiptQty] = useState('');
    const [receiptRemarks, setReceiptRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const filtered = items.filter(i => i.material_name?.toLowerCase().includes(search.toLowerCase()));

    const canRelease = auth?.permissions?.includes('create site release') || auth?.roles?.includes('admin');
    const canConfirm = auth?.permissions?.includes('confirm site release') || auth?.roles?.includes('admin');

    const openRelease = (item) => {
        setReleaseModal({ open: true, item });
        setQty('');
        setIssuedTo('');
        setPurpose('');
    };

    const openConfirm = (release) => {
        setConfirmModal({ open: true, release });
        setReceiptQty(release.quantity_released);
        setReceiptRemarks('');
    };

    const handleRelease = () => {
        if (!qty || Number(qty) <= 0 || !issuedTo.trim()) return;
        setSubmitting(true);
        router.post('/site-release', {
            inventory_item_id: releaseModal.item.id,
            quantity_released: Number(qty),
            issued_to: issuedTo,
            purpose,
        }, {
            onSuccess: () => setReleaseModal({ open: false, item: null }),
            onFinish: () => setSubmitting(false),
            preserveScroll: true,
        });
    };

    const handleConfirmReceipt = () => {
        if (!receiptQty || Number(receiptQty) <= 0) return;
        setSubmitting(true);
        router.post(`/site-release/${confirmModal.release.id}/confirm`, {
            quantity_received: Number(receiptQty),
            receipt_remarks: receiptRemarks,
        }, {
            onSuccess: () => setConfirmModal({ open: false, release: null }),
            onFinish: () => setSubmitting(false),
            preserveScroll: true,
        });
    };

    const isExceeded = releaseModal.item && Number(qty) > Number(releaseModal.item.quantity);

    return (
        <AuthenticatedLayout>
            <Head title="Site Release / Issuance" />

            <div className="p-6 max-w-[1920px] mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg shadow-black/5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/30">
                                    <ArrowRightCircle size={20} />
                                </div>
                                <span className="opacity-90">Site Release / Issuance</span>
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 font-medium ml-1">Issue materials from site inventory to workers</p>
                    </div>

                    {/* Search */}
                    <div className="relative group w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                        <input type="text" placeholder="Search materials..." className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-emerald-500/50 focus:ring-0 outline-none transition-all placeholder:text-slate-400" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </header>

                {/* Inventory Table */}
                {canRelease && (
                    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
                        <div className="overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                    <tr className="border-b border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                                        <th className="p-4 w-12 text-center">#</th>
                                        <th className="p-4 min-w-[250px]">Material Name</th>
                                        <th className="p-4 min-w-[180px]">Project Site</th>
                                        <th className="p-4 text-right w-32">Available Qty</th>
                                        <th className="p-4 w-20 text-center">Unit</th>
                                        <th className="p-4 w-32 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-700 dark:text-slate-200">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center">
                                                <Package className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={48} />
                                                <p className="text-slate-400 uppercase tracking-widest font-bold text-xs">No site inventory found</p>
                                            </td>
                                        </tr>
                                    ) : filtered.map((item, idx) => (
                                        <tr key={item.id} className="group hover:bg-white/60 dark:hover:bg-slate-700/40 transition-all duration-200">
                                            <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs border-l-4 border-transparent group-hover:border-emerald-500/50 transition-all">{idx + 1}</td>
                                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{item.material_name}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    {item.project?.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {Number(item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-center text-slate-500 text-xs font-medium uppercase">{item.unit}</td>
                                            <td className="py-3 px-4 text-center">
                                                <button onClick={() => openRelease(item)} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors text-xs font-bold flex items-center gap-1.5 mx-auto active:scale-95">
                                                    <ArrowRightCircle size={14} /> Release
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Recent Releases */}
                {releaseHistory.length > 0 && (
                    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl overflow-hidden shadow-lg">
                        <div className="bg-white/80 dark:bg-slate-900/80 px-5 py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Clock size={14} className="text-slate-400" /> Recent Releases
                            </h2>
                        </div>
                        <div className="overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="p-3 pl-5">Material</th>
                                        <th className="p-3">Issued To</th>
                                        <th className="p-3 text-center">Qty Released</th>
                                        <th className="p-3">Purpose</th>
                                        <th className="p-3">Released By</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-slate-600 dark:text-slate-300">
                                    {releaseHistory.map(r => (
                                        <tr key={r.id} className="hover:bg-white/60 dark:hover:bg-slate-700/20 transition-colors">
                                            <td className="p-3 pl-5 font-medium text-slate-900 dark:text-white">{r.inventory_item?.material_name}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1.5">
                                                    <User size={12} className="text-slate-400" />
                                                    {r.issued_to}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center font-mono font-bold text-red-500">-{Number(r.quantity_released).toLocaleString()}</td>
                                            <td className="p-3 text-slate-400 italic">{r.purpose || '—'}</td>
                                            <td className="p-3 text-slate-500">{r.released_by?.name}</td>
                                            <td className="p-3 text-slate-400">{new Date(r.release_date).toLocaleDateString()}</td>
                                            <td className="p-3 text-center">
                                                {r.status === 'RECEIVED' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                                        <CheckCircle2 size={10} /> Received
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                                        <Truck size={10} /> In Transit
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                {r.status === 'IN_TRANSIT' && canConfirm && (
                                                    <button
                                                        onClick={() => openConfirm(r)}
                                                        className="px-2.5 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1 mx-auto active:scale-95"
                                                    >
                                                        <CheckCircle2 size={12} /> Confirm Receipt
                                                    </button>
                                                )}
                                                {r.status === 'RECEIVED' && (
                                                    <span className="text-[10px] text-slate-400">
                                                        {r.received_by?.name} ({Number(r.quantity_received).toLocaleString()})
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Release Modal */}
                <Modal isOpen={releaseModal.open} onClose={() => setReleaseModal({ open: false, item: null })} title="Release Material">
                    {releaseModal.item && (
                        <div className="space-y-5">
                            {/* Material Info */}
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{releaseModal.item.material_name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={12} /> {releaseModal.item.project?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-mono font-bold text-emerald-600">{Number(releaseModal.item.quantity).toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">{releaseModal.item.unit} available</div>
                                    </div>
                                </div>
                            </div>

                            {/* Issued To */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Issued To *</label>
                                <input type="text" value={issuedTo} onChange={e => setIssuedTo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="e.g. Juan Dela Cruz (Foreman)" />
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Quantity to Release *</label>
                                <input type="number" step="0.01" value={qty} onChange={e => setQty(e.target.value)} className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none transition-all font-mono ${isExceeded ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'}`} placeholder="0.00" />
                                {isExceeded && (
                                    <p className="text-red-500 text-[10px] font-bold flex items-center gap-1 mt-1"><AlertTriangle size={12} /> Exceeds available stock ({Number(releaseModal.item.quantity).toLocaleString()} {releaseModal.item.unit})</p>
                                )}
                            </div>

                            {/* Purpose */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Purpose</label>
                                <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="e.g. Foundation pouring" />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <button onClick={() => setReleaseModal({ open: false, item: null })} className="px-5 py-2.5 text-xs font-bold uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                                <button onClick={handleRelease} disabled={submitting || isExceeded || !qty || Number(qty) <= 0 || !issuedTo.trim()} className="px-5 py-2.5 text-xs font-bold uppercase text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2">
                                    <ArrowRightCircle size={14} /> Confirm Release
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Confirm Receipt Modal */}
                <Modal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, release: null })} title="Confirm Receipt">
                    {confirmModal.release && (
                        <div className="space-y-5">
                            {/* Release Info */}
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{confirmModal.release.inventory_item?.material_name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                            <User size={12} /> Issued to: <span className="font-bold text-slate-700 dark:text-slate-300">{confirmModal.release.issued_to}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Released by: {confirmModal.release.released_by?.name} on {new Date(confirmModal.release.release_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-mono font-bold text-blue-600">{Number(confirmModal.release.quantity_released).toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">{confirmModal.release.unit} released</div>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity Received */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Quantity Actually Received *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={receiptQty}
                                    onChange={e => setReceiptQty(e.target.value)}
                                    max={confirmModal.release.quantity_released}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                                    placeholder="0.00"
                                />
                                {Number(receiptQty) < Number(confirmModal.release.quantity_released) && Number(receiptQty) > 0 && (
                                    <p className="text-amber-500 text-[10px] font-bold flex items-center gap-1 mt-1">
                                        <AlertTriangle size={12} /> Partial receipt — {(Number(confirmModal.release.quantity_released) - Number(receiptQty)).toLocaleString()} {confirmModal.release.unit} short
                                    </p>
                                )}
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Remarks (Optional)</label>
                                <textarea
                                    value={receiptRemarks}
                                    onChange={e => setReceiptRemarks(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                                    rows={3}
                                    placeholder="e.g. 2 bags were damaged during transport"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <button onClick={() => setConfirmModal({ open: false, release: null })} className="px-5 py-2.5 text-xs font-bold uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                                <button
                                    onClick={handleConfirmReceipt}
                                    disabled={submitting || !receiptQty || Number(receiptQty) <= 0}
                                    className="px-5 py-2.5 text-xs font-bold uppercase text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <CheckCircle2 size={14} /> Confirm Received
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
