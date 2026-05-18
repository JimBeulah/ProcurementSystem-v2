import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import Modal from '@/Components/UI/Modal';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import Drawer from '@/Components/UI/Drawer';
import PdfPreviewModal from '@/Components/UI/PdfPreviewModal';
import CreatePurchaseOrder from '@/Pages/Purchasing/Orders/Create';
import {
    Plus, CheckCircle, XCircle, Trash2,
    Briefcase, Calendar, User, Package, ShoppingCart,
    Printer, Eye, Search, TrendingUp, TrendingDown
} from 'lucide-react';
import DataTable from '@/Components/UI/DataTable';

const VARIANCE_THRESHOLD = 5;

function getPriceVariance(actualPrice, estimatedPrice) {
    if (!estimatedPrice || estimatedPrice <= 0) return null;
    return ((actualPrice - estimatedPrice) / estimatedPrice) * 100;
}

function StatusBadge({ status }) {
    const styles = {
        PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        PARTIAL: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        COMPLETED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        DECLINED: 'bg-red-500/10 text-red-600 border-red-500/20',
        CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    };
    const key = String(status).toUpperCase();
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[key] || styles.PENDING}`}>{status}</span>;
}

export default function PurchaseRequestsIndex() {
    const { requests, projects, filters } = usePage().props;
    const list = requests?.data || [];
    const { can } = usePermissions();

    const [showCreate, setShowCreate] = useState(false);
    const [selectedPr, setSelectedPr] = useState(null);
    const [showDrawer, setShowDrawer] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false);
    const [isLoadingCreatePo, setIsLoadingCreatePo] = useState(false);

    // Filters
    const [search, setSearch] = useState(filters?.search || '');
    const [dateFilter, setDateFilter] = useState(filters?.date || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'ALL');

    // Create Form State
    const [projectId, setProjectId] = useState('');

    // Handle URL parameters for contextual creation
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('create') === 'true') {
            setShowCreate(true);
            if (params.get('projectId')) {
                setProjectId(params.get('projectId'));
            }
        }
    }, []);
    const [purpose, setPurpose] = useState('');
    const [remarks, setRemarks] = useState('');
    const [cart, setCart] = useState([]);

    // Cart Item State
    const [itemDesc, setItemDesc] = useState('');
    const [itemQty, setItemQty] = useState('');
    const [itemUnit, setItemUnit] = useState('');
    const [itemCost, setItemCost] = useState('');

    // Handle search/filter with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (
                search !== (filters?.search || '') ||
                dateFilter !== (filters?.date || '') ||
                statusFilter !== (filters?.status || 'ALL')
            ) {
                router.get('/purchasing/requests', {
                    search,
                    date: dateFilter,
                    status: statusFilter,
                }, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, dateFilter, statusFilter, filters?.search, filters?.date, filters?.status]);

    // Expanded rows logic removed in favor of Drawer
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
            onSuccess: () => setShowDrawer(false)
        });
    };

    const handleDecline = (id) => {
        router.post(`/purchasing/requests/${id}/decline`, {}, {
            preserveScroll: true,
            onSuccess: () => setShowDrawer(false)
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/purchasing/requests/${deleteTarget.id}`, {
            onSuccess: () => {
                setDeleteTarget(null);
                setShowDrawer(false);
            },
            preserveScroll: true,
        });
    };

    const columns = React.useMemo(() => [
        {
            accessorKey: 'id',
            header: '#',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {row.original.id}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                            {row.original.project?.name || 'No Project'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Briefcase size={10} /> {row.original.request_number}
                        </span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'material_name',
            header: 'Material Name',
            cell: ({ row }) => <span className="font-bold text-slate-900 dark:text-white">{row.original.material_name || 'N/A'}</span>
        },
        {
            id: 'requester',
            header: 'Requester / Date',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <User size={12} className="text-slate-400" />
                        {row.original.requester?.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(row.original.created_at).toLocaleDateString()}
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: () => <div className="text-center">Status</div>,
            cell: ({ row }) => <div className="text-center"><StatusBadge status={row.original.status} /></div>
        },
        {
            id: 'actions',
            header: () => <div className="text-right pr-2">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2 pr-2">
                    <button
                        onClick={() => { setSelectedPr(row.original); setShowDrawer(true); }}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <Eye size={16} />
                    </button>
                    {can('delete purchase requests') && row.original.status === 'PENDING' && (
                        <button
                            onClick={() => setDeleteTarget(row.original)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                            title="Delete Request"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ], [can]);

    return (
        <AuthenticatedLayout>
            <Head title="Purchase Requests" />

            <div className="p-6 max-w-[1920px] mx-auto space-y-6">

                {/* PR Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm relative z-0">

                    {/* Quick Filters */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {['ALL', 'PENDING', 'APPROVED', 'PARTIAL', 'COMPLETED', 'DECLINED', 'CANCELLED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${statusFilter === status
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 dark:bg-slate-900/50 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {status === 'ALL' ? 'All Requests' : status}
                            </button>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-6 items-stretch lg:items-center justify-between">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search PR, Project, Purpose..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 h-10"
                                />
                            </div>
                            <div className="relative sm:w-auto">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={e => setDateFilter(e.target.value)}
                                    className="w-full sm:w-auto pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-300 h-10"
                                />
                                {dateFilter && (
                                    <button
                                        onClick={() => setDateFilter('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Global "New Request" removed to enforce project-based creation */}
                        </div>
                    </div>

                    <DataTable
                        data={list}
                        columns={columns}
                        overflowVisible={true}
                        onRowClick={(pr) => { setSelectedPr(pr); setShowDrawer(true); }}
                        searchPlaceholder="Search PR, Project, Purpose..."
                        showSearch={false} // We have our own filters
                        showPagination={true}
                        paginationData={requests}
                    />
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    title="Confirm Delete"
                    message={`Are you sure you want to delete Purchase Request PR-${deleteTarget?.id.toString().padStart(5, '0')}? This action is permanent and cannot be undone.`}
                    confirmText="Delete Request"
                    type="danger"
                />

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
                {/* Drawer for PR Details */}
                <Drawer
                    isOpen={showDrawer}
                    onClose={() => setShowDrawer(false)}
                    title={selectedPr ? `PR-${selectedPr.id.toString().padStart(5, '0')} Details` : 'PR Details'}
                >
                    {selectedPr && (
                        <div className="space-y-6">
                            {/* Actions Header */}
                            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                                <button
                                    onClick={() => {
                                        setPreviewUrl(`/purchasing/requests/${selectedPr.id}/print`);
                                        setIsPreviewOpen(true);
                                    }}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <Printer size={14} /> Print PR
                                </button>

                                {(selectedPr.status === 'APPROVED' || selectedPr.status === 'PARTIAL') && can('create purchase orders') && (
                                    <button
                                        onClick={() => {
                                            setIsLoadingCreatePo(true);
                                            router.reload({
                                                only: ['suppliers', 'materials', 'inventoryMatches', 'purchaseRequest'],
                                                data: { prId: selectedPr.id },
                                                onSuccess: () => {
                                                    setIsLoadingCreatePo(false);
                                                    setIsCreatePoModalOpen(true);
                                                }
                                            });
                                        }}
                                        disabled={isLoadingCreatePo}
                                        className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-violet-600/20 cursor-pointer"
                                    >
                                        <ShoppingCart size={14} /> {isLoadingCreatePo ? 'Loading...' : 'Create PO'}
                                    </button>
                                )}

                                {selectedPr.status === 'PENDING' && can('manage purchase requests') && (
                                    <>
                                        <button onClick={() => handleApprove(selectedPr.id)} className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/20">
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                        <button onClick={() => handleDecline(selectedPr.id)} className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-amber-600/20">
                                            <XCircle size={14} /> Decline
                                        </button>
                                    </>
                                )}

                                {can('manage purchase requests') && (
                                    <button onClick={() => setDeleteTarget(selectedPr)} className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors flex items-center gap-2 ml-auto">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                )}
                            </div>

                            {/* Details Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Project</label>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{selectedPr.project?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Requested By</label>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{selectedPr.requester?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Date</label>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{new Date(selectedPr.request_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                                    <div className="mt-1"><StatusBadge status={selectedPr.status} /></div>
                                </div>
                                {selectedPr.purpose && (
                                    <div className="col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Purpose</label>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedPr.purpose}</p>
                                    </div>
                                )}
                                {selectedPr.remarks && (
                                    <div className="col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Remarks</label>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedPr.remarks}</p>
                                    </div>
                                )}
                            </div>

                            {/* Items List */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <Package size={14} className="text-blue-500" /> Requested Items
                                </h3>

                                {selectedPr.items && selectedPr.items.length > 0 ? (
                                    <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
                                        <div className="grid grid-cols-[1fr_60px_60px_90px_90px] gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200 dark:border-slate-700/60">
                                            <div>Description</div>
                                            <div className="text-center">Qty</div>
                                            <div className="text-center">Unit</div>
                                            <div className="text-right">Unit Cost</div>
                                            <div className="text-right">Total</div>
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {selectedPr.items.map(item => {
                                                const rem = item.quantity - (item.ordered_quantity || 0);
                                                return (
                                                    <div key={item.id} className="grid grid-cols-[1fr_60px_60px_90px_90px] gap-2 px-3 py-2.5 items-center text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors bg-white dark:bg-slate-900 border-b last:border-0 border-slate-100 dark:border-slate-800/50">
                                                        <div>
                                                            <div className="font-medium text-slate-800 dark:text-slate-200">{item.item_description}</div>
                                                            {item.ordered_quantity > 0 && (
                                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                                                    <div className="text-[9px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                                                                        {item.supplier_quantity > 0 && (
                                                                            <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-500/20">
                                                                                {Number(item.supplier_quantity).toFixed(0)} Ordered
                                                                            </span>
                                                                        )}
                                                                        {item.warehouse_quantity > 0 && (
                                                                            <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-500/20">
                                                                                {Number(item.warehouse_quantity).toFixed(0)} from Warehouse
                                                                            </span>
                                                                        )}
                                                                        <span className="text-slate-400">•</span>
                                                                        <span className={rem > 0 ? "text-emerald-600 font-bold" : "text-slate-400"}>
                                                                            {rem > 0 ? `${Number(rem).toFixed(0)} Remaining` : 'Fully Sourced'}
                                                                        </span>
                                                                    </div>
                                                                    {item.purchase_order_items?.length > 0 && (() => {
                                                                        const avgActualPrice = item.purchase_order_items.reduce((sum, poi) => sum + Number(poi.unit_price), 0) / item.purchase_order_items.length;
                                                                        const variance = getPriceVariance(avgActualPrice, Number(item.estimated_unit_cost));
                                                                        
                                                                        if (variance === null) return null;
                                                                        
                                                                        if (variance > VARIANCE_THRESHOLD) {
                                                                            return (
                                                                                <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-tighter bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-1.5 py-0.5 rounded">
                                                                                    <TrendingUp size={10} /> +{variance.toFixed(0)}% Overage
                                                                                </span>
                                                                            );
                                                                        }
                                                                        if (variance < -VARIANCE_THRESHOLD) {
                                                                            return (
                                                                                <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-tighter bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                                                                                    <TrendingDown size={10} /> {Math.abs(variance).toFixed(0)}% Savings
                                                                                </span>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-center font-mono text-blue-600 dark:text-blue-400">{Number(item.quantity).toFixed(0)}</div>
                                                        <div className="text-center text-slate-500 uppercase">{item.unit}</div>
                                                        <div className="text-right font-mono text-slate-500">
                                                            <div>₱{Number(item.estimated_unit_cost).toLocaleString()}</div>
                                                            {item.purchase_order_items?.length > 0 && (() => {
                                                                const avgActualPrice = item.purchase_order_items.reduce((sum, poi) => sum + Number(poi.unit_price), 0) / item.purchase_order_items.length;
                                                                if (Math.abs(avgActualPrice - Number(item.estimated_unit_cost)) > 0.01) {
                                                                    return <div className="text-[9px] text-slate-400 italic">Actual: ₱{avgActualPrice.toLocaleString()}</div>;
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        <div className="text-right font-mono font-bold text-slate-800 dark:text-slate-200">₱{Number(item.estimated_total_cost).toLocaleString()}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-2.5 border-t border-slate-200 dark:border-slate-700 text-right flex items-center justify-end gap-3">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Est. Cost</span>
                                            <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">₱{Number(selectedPr.total_estimated_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
                                        <p className="text-slate-400 text-xs italic">No items listed.</p>
                                    </div>
                                )}
                            </div>

                            {selectedPr.approver && (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                    <CheckCircle size={14} /> Processed by <b className="ml-1">{selectedPr.approver.name}</b>
                                </div>
                            )}
                        </div>
                    )}
                </Drawer>
            </div>

            <PdfPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                url={previewUrl}
                title="Purchase Request Preview"
            />

            <Modal
                isOpen={isCreatePoModalOpen}
                onClose={() => setIsCreatePoModalOpen(false)}
                title="Create Purchase Order"
                maxWidth="max-w-6xl"
            >
                <div className="pt-4">
                    {isCreatePoModalOpen && <CreatePurchaseOrder onSuccess={() => {
                        setIsCreatePoModalOpen(false);
                        setShowDrawer(false);
                    }} />}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
