import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import { 
    Package, 
    Search, 
    MapPin, 
    ArrowRightCircle, 
    Clock, 
    User, 
    AlertTriangle, 
    CheckCircle2, 
    Truck,
    Info,
    LayoutList,
    History
} from 'lucide-react';
import { toast } from 'sonner';

export default function SiteReleaseIndex() {
    const { pendingReleases = [], recentReleases = [], auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('queue');
    const [dispatchModal, setDispatchModal] = useState({ open: false, release: null });
    const [submitting, setSubmitting] = useState(false);

    const filteredPending = useMemo(() => (pendingReleases || []).filter(r => 
        (r.inventory_item?.material_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (r.project?.name?.toLowerCase() || '').includes(search.toLowerCase())
    ), [pendingReleases, search]);

    const filteredHistory = useMemo(() => (recentReleases || []).filter(r => 
        (r.inventory_item?.material_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (r.project?.name?.toLowerCase() || '').includes(search.toLowerCase())
    ), [recentReleases, search]);

    const openDispatch = (release) => {
        setDispatchModal({ open: true, release });
    };

    const handleDispatch = () => {
        setSubmitting(true);
        router.post(`/site-release/${dispatchModal.release.id}/dispatch`, {}, {
            onSuccess: () => {
                setDispatchModal({ open: false, release: null });
            },
            onFinish: () => setSubmitting(false),
            preserveScroll: true,
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                        <Clock size={10} /> Pending Dispatch
                    </span>
                );
            case 'IN_TRANSIT':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 font-black">
                        <Truck size={10} /> In Transit
                    </span>
                );
            case 'RECEIVED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                        <CheckCircle2 size={10} /> Received
                    </span>
                );
            default:
                return status;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Warehouse Dispatch Queue" />

            <div className="p-6 max-w-[1920px] mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg shadow-black/5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                                    <Truck size={20} />
                                </div>
                                <span className="opacity-90">Warehouse Dispatch</span>
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 font-medium ml-1">Manage pending dispatches from warehouse to project sites</p>
                    </div>

                    {/* Search & Tabs */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                            <button
                                onClick={() => setActiveTab('queue')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeTab === 'queue' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutList size={14} />
                                Pending Queue
                                <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'queue' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                    {pendingReleases.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <History size={14} />
                                History
                                <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'history' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                    {recentReleases.length}
                                </span>
                            </button>
                        </div>

                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search records..." 
                                className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500/50 focus:ring-0 outline-none transition-all placeholder:text-slate-400" 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                            />
                        </div>
                    </div>
                </header>

                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/5 min-h-[400px]">
                    {activeTab === 'queue' ? (
                        <div className="overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200/60 dark:border-slate-700/60">
                                    <tr className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">
                                        <th className="p-4 w-12 text-center">#</th>
                                        <th className="p-4 min-w-[200px]">Material Name</th>
                                        <th className="p-4 min-w-[180px]">Destination Project</th>
                                        <th className="p-4 text-center w-32">Qty to Send</th>
                                        <th className="p-4 w-32 text-center">Requested Date</th>
                                        <th className="p-4 w-32 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                                    {filteredPending.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-300 dark:text-slate-700">
                                                        <Truck size={48} />
                                                    </div>
                                                    <p className="text-slate-400 uppercase tracking-widest font-black text-xs">No pending dispatches</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredPending.map((release, idx) => (
                                        <tr key={release.id} className="group hover:bg-white/60 dark:hover:bg-slate-700/40 transition-all duration-200">
                                            <td className="py-4 px-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                                    {release.inventory_item?.material_name}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                                    ID: DISP-{release.id.toString().padStart(4, '0')}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-tight">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    {release.project?.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="font-mono font-black text-blue-600 dark:text-blue-400 text-lg leading-none tabular-nums">
                                                    {Number(release.quantity_released).toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                    {release.unit}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center text-slate-500 text-xs font-medium">
                                                {new Date(release.created_at).toLocaleDateString()}
                                                <div className="text-[10px] text-slate-400 mt-1">
                                                    {new Date(release.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <button 
                                                    onClick={() => openDispatch(release)} 
                                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 rounded-xl transition-all text-xs font-bold flex items-center gap-2 mx-auto active:scale-95 shadow-lg shadow-blue-600/20 uppercase tracking-tight"
                                                >
                                                    <Truck size={14} /> Confirm Dispatch
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200/60 dark:border-slate-700/60">
                                    <tr className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">
                                        <th className="p-4 w-12 text-center">#</th>
                                        <th className="p-4 min-w-[200px]">Material Name</th>
                                        <th className="p-4 min-w-[180px]">Project</th>
                                        <th className="p-4 text-center">Qty Sent</th>
                                        <th className="p-4">Dispatched By</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                                    {filteredHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-300 dark:text-slate-700">
                                                        <History size={48} />
                                                    </div>
                                                    <p className="text-slate-400 uppercase tracking-widest font-black text-xs">No history found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredHistory.map((release, idx) => (
                                        <tr key={release.id} className="group hover:bg-white/60 dark:hover:bg-slate-700/40 transition-all duration-200">
                                            <td className="py-4 px-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {release.inventory_item?.material_name}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                                    ID: DISP-{release.id.toString().padStart(4, '0')}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-tight">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    {release.project?.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                    {Number(release.quantity_released).toLocaleString()} {release.unit}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-tight">
                                                    <User size={12} className="text-slate-400" />
                                                    {release.released_by?.name || 'Automated'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-slate-500 text-xs font-bold">
                                                {new Date(release.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                {getStatusBadge(release.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Dispatch Confirmation Modal */}
                <Modal isOpen={dispatchModal.open} onClose={() => setDispatchModal({ open: false, release: null })} title="Confirm Dispatch">
                    {dispatchModal.release && (
                        <div className="space-y-6 pt-2">
                            <div className="p-5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl">
                                <p className="text-blue-700 dark:text-blue-400 text-sm font-medium flex items-center gap-2 mb-4 italic">
                                    <Info size={16} /> Confirming that these physical materials are loaded and leaving the warehouse.
                                </p>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Material</label>
                                        <div className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{dispatchModal.release.inventory_item?.material_name}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Quantity</label>
                                        <div className="text-base font-black text-blue-600 uppercase tracking-tight tabular-nums">{Number(dispatchModal.release.quantity_released).toLocaleString()} {dispatchModal.release.unit}</div>
                                    </div>
                                    <div className="col-span-2 space-y-1 border-t border-blue-100 dark:border-blue-900/30 pt-4">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Destination Project</label>
                                        <div className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                                            <MapPin size={16} /> {dispatchModal.release.project?.name}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    onClick={() => setDispatchModal({ open: false, release: null })} 
                                    className="px-6 py-3 text-xs font-black uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDispatch} 
                                    disabled={submitting} 
                                    className="px-8 py-3 text-xs font-black uppercase text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 tracking-widest"
                                >
                                    {submitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Dispatching...
                                        </div>
                                    ) : (
                                        <><Truck size={14} /> Send materials</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
