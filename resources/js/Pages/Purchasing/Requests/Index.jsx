import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import Modal from '@/Components/UI/Modal';
import {
    ClipboardList, Plus, CheckCircle, XCircle, Trash2, ChevronDown, ChevronRight,
    Briefcase, Calendar, User, PhilippinePeso, AlertTriangle, Package, ShoppingCart,
    MoreVertical, Printer
} from 'lucide-react';
import { toast } from 'sonner';

function StatusBadge({ status }) {
    const styles = {
        PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        DECLINED: 'bg-red-500/10 text-red-600 border-red-500/20',
        CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    };
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[status] || styles.PENDING}`}>{status}</span>;
}

export default function PurchaseRequestsIndex() {
    const { requests, projects, flash } = usePage().props;
    const list = requests?.data || [];
    const paginationLinks = requests?.links || [];
    const { can } = usePermissions();

    const [showCreate, setShowCreate] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Create Form State
    const [projectId, setProjectId] = useState('');
    const [purpose, setPurpose] = useState('');
    const [remarks, setRemarks] = useState('');
    const [cart, setCart] = useState([]);

    // Cart Item State
    const [itemDesc, setItemDesc] = useState('');
    const [itemQty, setItemQty] = useState('');
    const [itemUnit, setItemUnit] = useState('');
    const [itemCost, setItemCost] = useState('');

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const toggleRow = (id) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const addToCart = () => {
        if (!itemDesc || !itemQty || Number(itemQty) <= 0 || !itemUnit) return;
        setCart([...cart, {
            item_description: itemDesc,
            quantity: Number(itemQty),
            unit: itemUnit,
            estimated_unit_cost: Number(itemCost) || 0,
        }]);
        setItemDesc(''); setItemQty(''); setItemUnit(''); setItemCost('');
    };

    const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));

    const cartTotal = cart.reduce((sum, i) => sum + (i.quantity * i.estimated_unit_cost), 0);

    const handleSubmit = () => {
        if (!projectId || cart.length === 0) return;
        setSubmitting(true);
        router.post('/purchasing/requests', { project_id: projectId, purpose, remarks, items: cart }, {
            onSuccess: () => {
                setShowCreate(false);
                setCart([]); setPurpose(''); setRemarks(''); setProjectId('');
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleApprove = (id) => {
        router.post(`/purchasing/requests/${id}/approve`, {}, {
            preserveScroll: true,
        });
    };

    const handleDecline = (id) => {
        router.post(`/purchasing/requests/${id}/decline`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/purchasing/requests/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Purchase Requests" />

            <div className="p-6 max-w-[1920px] mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg shadow-black/5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                                    <ClipboardList size={20} />
                                </div>
                                <span className="opacity-90">Purchase Requests</span>
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 font-medium ml-1">Internal requests for materials and services</p>
                    </div>
                    {can('manage purchase requests') && (
                        <button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                            <Plus size={18} /> New Request
                        </button>
                    )}
                </header>

                {/* PR Table */}
                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
                    <div className="overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                <tr className="border-b border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                                    <th className="p-4 w-12 text-center">#</th>
                                    <th className="p-4 min-w-[120px]">PR Number</th>
                                    <th className="p-4 min-w-[200px]">Project</th>
                                    <th className="p-4 min-w-[120px]">Requested By</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4 text-right">Est. Cost</th>
                                    <th className="p-4 w-32 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-700 dark:text-slate-200">
                                {list.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-16 text-center">
                                            <ClipboardList className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={48} />
                                            <p className="text-slate-400 uppercase tracking-widest font-bold text-xs">No Purchase Requests Found</p>
                                            <p className="text-slate-400 text-xs mt-1">Click "New Request" to create one.</p>
                                        </td>
                                    </tr>
                                ) : list.map((pr, idx) => {
                                    const isExpanded = expandedRows.has(pr.id);
                                    return (
                                        <React.Fragment key={pr.id}>
                                            <tr className="group hover:bg-white/60 dark:hover:bg-slate-700/40 transition-all duration-200 cursor-pointer" onClick={() => toggleRow(pr.id)}>
                                                <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs border-l-4 border-transparent group-hover:border-blue-500/50 transition-all">{idx + 1}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <button className={`p-1 rounded-md transition-all ${isExpanded ? 'bg-slate-200 dark:bg-slate-600 rotate-90' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                            <ChevronRight size={14} />
                                                        </button>
                                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">PR-{pr.id.toString().padStart(5, '0')}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase size={14} className="text-slate-400" />
                                                        <span className="font-semibold text-slate-900 dark:text-white">{pr.project?.name || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className="text-slate-400" />
                                                        <span className="text-slate-600 dark:text-slate-300">{pr.requester?.name || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center"><StatusBadge status={pr.status} /></td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                        <Calendar size={12} />
                                                        {new Date(pr.request_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    <span className="text-[10px] text-slate-400 mr-1">₱</span>
                                                    {Number(pr.total_estimated_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                                                    <div className="relative group/actions inline-block">
                                                        <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-black/10 border border-slate-100 dark:border-slate-700/50 opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible group-focus-within/actions:opacity-100 group-focus-within/actions:visible transition-all z-50 py-1">
                                                            <a href={`/purchasing/requests/${pr.id}/print`} target="_blank" rel="noopener noreferrer" className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                                                                <Printer size={14} className="text-slate-400" /> Print PR
                                                            </a>

                                                            {pr.status === 'PENDING' && can('manage purchase requests') && (
                                                                <>
                                                                    <button onClick={() => handleApprove(pr.id)} className="w-full text-left px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center gap-2">
                                                                        <CheckCircle size={14} /> Approve
                                                                    </button>
                                                                    <button onClick={() => handleDecline(pr.id)} className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-center gap-2">
                                                                        <XCircle size={14} /> Decline
                                                                    </button>
                                                                </>
                                                            )}

                                                            {pr.status === 'APPROVED' && can('create purchase orders') && (
                                                                <Link href={`/purchasing/orders/create?prId=${pr.id}`} className="w-full text-left px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center gap-2">
                                                                    <ShoppingCart size={14} /> Create PO
                                                                </Link>
                                                            )}

                                                            {can('manage purchase requests') && (
                                                                <button onClick={() => setDeleteTarget(pr)} className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                                                                    <Trash2 size={14} /> Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50/50 dark:bg-black/20">
                                                    <td colSpan={8} className="p-0">
                                                        <div className="pl-12 pr-4 py-4">
                                                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
                                                                <div className="bg-slate-50/80 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                                    <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                                        <Package size={14} className="text-slate-400" /> Requested Items
                                                                    </h3>
                                                                    {pr.purpose && <span className="text-[10px] text-slate-400 italic">Purpose: {pr.purpose}</span>}
                                                                </div>
                                                                {pr.items && pr.items.length > 0 ? (
                                                                    <div className="w-full text-xs">
                                                                        <div className="grid grid-cols-[1fr_80px_80px_120px_120px] gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                                                            <div>Description</div>
                                                                            <div className="text-center">Qty</div>
                                                                            <div className="text-center">Unit</div>
                                                                            <div className="text-right">Unit Cost</div>
                                                                            <div className="text-right">Total</div>
                                                                        </div>
                                                                        {pr.items.map(item => (
                                                                            <div key={item.id} className="grid grid-cols-[1fr_80px_80px_120px_120px] gap-2 px-4 py-2.5 items-center border-b last:border-0 border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                                                                <div className="font-medium text-slate-700 dark:text-slate-300">{item.item_description}</div>
                                                                                <div className="text-center font-mono text-slate-600 dark:text-slate-400">{Number(item.quantity).toFixed(2)}</div>
                                                                                <div className="text-center text-slate-500 uppercase text-[10px]">{item.unit}</div>
                                                                                <div className="text-right font-mono text-slate-500">₱ {Number(item.estimated_unit_cost).toLocaleString()}</div>
                                                                                <div className="text-right font-mono font-bold text-slate-800 dark:text-slate-200">₱ {Number(item.estimated_total_cost).toLocaleString()}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-8 text-center text-slate-400 text-xs italic">No items.</div>
                                                                )}
                                                                {pr.approver && (
                                                                    <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-emerald-600 flex items-center gap-1">
                                                                        <CheckCircle size={12} /> Processed by {pr.approver.name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {paginationLinks.length > 3 && (
                        <div className="bg-slate-50/80 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Showing <span className="font-bold text-slate-900 dark:text-white">{requests.from}</span> to <span className="font-bold text-slate-900 dark:text-white">{requests.to}</span> of <span className="font-bold text-slate-900 dark:text-white">{requests.total}</span> requests
                            </span>
                            <div className="flex gap-1">
                                {paginationLinks.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${link.active ? 'bg-blue-600 text-white shadow-md' : link.url ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700' : 'text-slate-400 cursor-not-allowed opacity-50'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-red-500 shadow-sm shrink-0"><AlertTriangle size={24} /></div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete Purchase Request?</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    PR-{deleteTarget?.id.toString().padStart(5, '0')} will be permanently deleted.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="px-5 py-2.5 text-xs font-bold uppercase text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-colors flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                        </div>
                    </div>
                </Modal>

                {/* Create PR Modal */}
                <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Purchase Request">
                    <div className="space-y-5">
                        {/* Project Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Project</label>
                            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all">
                                <option value="">Select Project...</option>
                                {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* Purpose */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Purpose</label>
                            <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="e.g. Foundation pouring for Phase 1" />
                        </div>

                        {/* Item Entry */}
                        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Items</h4>
                            <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-4">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Description</label>
                                    <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white h-9 focus:outline-none focus:border-blue-500" value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="Portland Cement" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Qty</label>
                                    <input type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white h-9 focus:outline-none focus:border-blue-500 font-mono" value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="0" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Unit</label>
                                    <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white h-9 focus:outline-none focus:border-blue-500" value={itemUnit} onChange={e => setItemUnit(e.target.value)} placeholder="bags" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Est. Cost</label>
                                    <input type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white h-9 focus:outline-none focus:border-blue-500 font-mono" value={itemCost} onChange={e => setItemCost(e.target.value)} placeholder="₱0" />
                                </div>
                                <div className="col-span-2">
                                    <button type="button" onClick={addToCart} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-bold text-[10px] uppercase h-9 flex items-center justify-center gap-1 transition-all active:scale-95">
                                        <Plus size={14} /> Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cart Table */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <table className="w-full text-[10px] text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-black tracking-widest text-[9px]">
                                    <tr>
                                        <th className="p-3 pl-4">Item</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-center">Unit</th>
                                        <th className="p-3 text-right">Unit Cost</th>
                                        <th className="p-3 text-right">Est. Total</th>
                                        <th className="p-3 text-center w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {cart.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="p-3 pl-4 font-medium text-slate-900 dark:text-white">{item.item_description}</td>
                                            <td className="p-3 text-center text-blue-600 font-mono">{item.quantity}</td>
                                            <td className="p-3 text-center text-slate-500 uppercase">{item.unit}</td>
                                            <td className="p-3 text-right text-slate-500 font-mono">₱{Number(item.estimated_unit_cost).toLocaleString()}</td>
                                            <td className="p-3 text-right text-slate-900 dark:text-white font-mono font-bold">₱{(item.quantity * item.estimated_unit_cost).toLocaleString()}</td>
                                            <td className="p-3 text-center"><button onClick={() => removeFromCart(idx)} className="text-slate-400 hover:text-red-500 transition-colors font-bold text-base">&times;</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                                {cart.length > 0 && (
                                    <tfoot className="bg-slate-50 dark:bg-slate-800/80">
                                        <tr>
                                            <td colSpan={4} className="p-3 text-right text-xs font-bold text-slate-500 uppercase">Total Est. Cost</td>
                                            <td className="p-3 text-right font-mono font-bold text-emerald-600">₱{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                            {cart.length === 0 && <div className="text-center text-slate-400 text-[10px] py-10 uppercase font-black tracking-[0.2em] opacity-30">Cart is Empty</div>}
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Remarks</label>
                            <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white h-20 focus:outline-none focus:border-blue-500 transition-all" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any additional notes..." />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-xs font-bold uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleSubmit} disabled={cart.length === 0 || !projectId || submitting} className="px-5 py-2.5 text-xs font-bold uppercase text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95">Submit Request</button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
