import React, { useState } from 'react';
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
    Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function SiteReleaseIndex() {
    const { pendingReleases, recentReleases, auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [dispatchModal, setDispatchModal] = useState({ open: false, release: null });
    const [submitting, setSubmitting] = useState(false);

    const filteredPending = (pendingReleases || []).filter(r => 
        (r.inventory_item?.material_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (r.project?.name?.toLowerCase() || '').includes(search.toLowerCase())
    );

    const openDispatch = (release) => {
        setDispatchModal({ open: true, release });
    };

    const handleDispatch = () => {
        setSubmitting(true);
        router.post(`/site-release/${dispatchModal.release.id}/dispatch`, {}, {
            onSuccess: () => {
                setDispatchModal({ open: false, release: null });
                toast.success('Materials dispatched successfully!');
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
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
                                <span className="opacity-90">Warehouse Dispatch Queue</span>
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 font-medium ml-1">Manage pending dispatches from warehouse to project sites</p>
                    </div>

                    {/* Search */}
                    <div className="relative group w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search requests..." 
                            className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500/50 focus:ring-0 outline-none transition-all placeholder:text-slate-400" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>
                </header>

                {/* Pending Dispatches Table */}
                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
                    <div className="bg-white/80 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Package size={18} className="text-blue-500" />
                            Pending Dispatches
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-black">
                                {filteredPending.length} TOTAL
                            </span>
                        </h2>
                    </div>
                    
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
                                                <p className="text-slate-500 text-sm font-medium -mt-2">Dispatch queue is empty.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPending.map((release, idx) => (
                                    <tr key={release.id} className="group hover:bg-white/60 dark:hover:bg-slate-700/40 transition-all duration-200">
                                        <td className="py-4 px-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {release.inventory_item?.material_name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                                ID: DISP-{release.id.toString().padStart(4, '0')}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
                                                <MapPin size={14} className="text-slate-400" />
                                                {release.project?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="font-mono font-black text-blue-600 dark:text-blue-400 text-lg leading-none">
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
                                                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 rounded-xl transition-all text-xs font-bold flex items-center gap-2 mx-auto active:scale-95 shadow-lg shadow-blue-600/20"
                                            >
                                                <Truck size={14} /> Confirm Dispatch
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Dispatch History */}
                {(recentReleases || []).length > 0 && (
                    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl overflow-hidden shadow-lg">
                        <div className="bg-white/80 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} className="text-slate-400" /> Dispatch History
                            </h2>
                        </div>
                        <div className="overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="text-[10px] text-slate-400 uppercase font-black tracking-wider border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="p-4 pl-6">Material</th>
                                        <th className="p-4">Destination</th>
                                        <th className="p-4 text-center">Qty Sent</th>
                                        <th className="p-4">Dispatched By</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-slate-600 dark:text-slate-300">
                                    {recentReleases.map(r => (
                                        <tr key={r.id} className="hover:bg-white/60 dark:hover:bg-slate-700/20 transition-colors">
                                            <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white uppercase tracking-tight">{r.inventory_item?.material_name}</td>
                                            <td className="p-4 font-semibold">{r.project?.name}</td>
                                            <td className="p-4 text-center font-mono font-bold text-blue-600">
                                                {Number(r.quantity_released).toLocaleString()} {r.unit}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <User size={12} className="text-slate-400" />
                                                    {r.released_by?.name || 'Automated'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-400 font-medium">{new Date(r.updated_at).toLocaleDateString()}</td>
                                            <td className="p-4 text-center">
                                                {getStatusBadge(r.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

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
                                        <div className="text-base font-black text-slate-900 dark:text-white uppercase">{dispatchModal.release.inventory_item?.material_name}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Quantity</label>
                                        <div className="text-base font-black text-blue-600 uppercase tracking-tight">{Number(dispatchModal.release.quantity_released).toLocaleString()} {dispatchModal.release.unit}</div>
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
                                    className="px-8 py-3 text-xs font-black uppercase text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {submitting ? 'Dispatching...' : 'Dispatch materials'}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
