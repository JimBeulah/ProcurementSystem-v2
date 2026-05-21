import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import Drawer from '@/Components/UI/Drawer';
import AddBoqItemWizard from '@/Components/Boq/AddBoqItemWizard';
import BoqMetricsModal from '@/Components/Boq/BoqMetricsModal';
import EditBoqItemModal from '@/Components/Boq/EditBoqItemModal';
import ResourceModal from '@/Components/Boq/ResourceModal';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import SmartImportPreviewModal from '@/Components/Boq/SmartImportPreviewModal';
import axios from 'axios';
import { useBoqCalculations } from '@/Hooks/useBoqCalculations';
import { downloadBoqTemplate, parseBoqCsv } from '@/Utils/boqFileUtils';
import {
    Plus, RefreshCcw, Upload, FileDown, Search, Layers,
    Trash2, Pencil, Box, Hammer, Truck, Info, Car,
    TrendingUp, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectBoq() {
    const { project, boqItems: initialItems, materials, units, isApproved, auth } = usePage().props;

    const [searchTerm, setSearchTerm] = useState('');
    const [drawerItemId, setDrawerItemId] = useState(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [loading, setLoading] = useState(false);

    // Edit Item State
    const [editItem, setEditItem] = useState(null);

    // Resource State
    const [resourceModal, setResourceModal] = useState({ open: false, mode: 'add', data: null });
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: 'confirm',
        title: '',
        message: '',
        onConfirm: () => {}
    });
    const [smartImport, setSmartImport] = useState({ open: false, data: null, analyzing: false });

    const items = initialItems || [];
    const drawerItem = items.find(i => i.id === drawerItemId) || null;

    // Memoized calculations
    const calculations = useBoqCalculations(items, project);

    const handleWizardSubmit = (payload) => {
        return new Promise((resolve, reject) => {
            setLoading(true);
            router.post(`/projects/${project.id}/boq`, payload, {
                onSuccess: () => {
                    setIsWizardOpen(false);
                    setLoading(false);
                    resolve(true);
                },
                onError: (errors) => {
                    console.error(errors);
                    setLoading(false);
                    reject(errors);
                }
            });
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/projects/${project.id}/boq/${deleteTarget.id}`, {
            onSuccess: () => {
                setDeleteTarget(null);
            }
        });
    };

    const handleApprove = () => {
        setConfirmModal({
            isOpen: true,
            type: 'confirm',
            title: 'Approve BOQ',
            message: 'Are you sure you want to approve this BOQ? This will lock all items from further editing.',
            onConfirm: () => router.post(`/projects/${project.id}/boq/approve`)
        });
    };

    const handleUnlock = () => {
        setConfirmModal({
            isOpen: true,
            type: 'prompt',
            title: 'Request Revision',
            message: 'Please enter the reason for revision (e.g., Price Increase, Scope Change):',
            inputPlaceholder: 'Reason for revision...',
            onConfirm: (reason) => {
                if (reason && reason.length >= 5) {
                    router.post(`/projects/${project.id}/boq/revise`, { reason });
                } else if (reason) {
                    toast.error('Reason must be at least 5 characters.');
                }
            }
        });
    };

    const handleUpdateItem = (e) => {
        e.preventDefault();
        setLoading(true);
        const { ...payload } = editItem;
        router.put(`/projects/${project.id}/boq/${editItem.id}`, payload, {
            onSuccess: () => {
                setEditItem(null);
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
            }
        });
    };

    const handleResourceSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        const { mode, data } = resourceModal;
        const parentItem = drawerItem;

        let quantityFactor = data.quantity_factor !== undefined && data.quantity_factor !== '' ? Number(data.quantity_factor) : 0;

        if (data.resource_type !== 'MATERIAL') {
            const persons = data.no_of_persons !== undefined && data.no_of_persons !== '' ? Number(data.no_of_persons) : 0;
            const hours = data.hours !== undefined && data.hours !== '' ? Number(data.hours) : 0;
            const itemQty = Number(parentItem.quantity) || 1;
            quantityFactor = (persons * hours) / itemQty;
        }

        const payload = {
            resourceType: data.resource_type,
            name: data.name,
            unit: data.unit || '',
            quantityFactor: quantityFactor,
            clientUnitRate: data.client_unit_rate !== undefined && data.client_unit_rate !== '' ? Number(data.client_unit_rate) : (data.unit_rate !== undefined && data.unit_rate !== '' ? Number(data.unit_rate) : 0),
            altapilUnitRate: data.altapil_unit_rate !== undefined && data.altapil_unit_rate !== '' ? Number(data.altapil_unit_rate) : 0,
            noOfPersons: data.no_of_persons !== undefined && data.no_of_persons !== '' ? Number(data.no_of_persons) : 0,
            hours: data.hours !== undefined && data.hours !== '' ? Number(data.hours) : 0,
        };

        if (mode === 'add') {
            router.post(`/projects/${project.id}/boq/${parentItem.id}/components`, payload, {
                onSuccess: () => {
                    setResourceModal({ ...resourceModal, open: false });
                    setLoading(false);
                },
                onError: () => {
                    setLoading(false);
                }
            });
        } else {
            router.put(`/projects/${project.id}/boq/components/${data.id}`, payload, {
                onSuccess: () => {
                    setResourceModal({ ...resourceModal, open: false });
                    setLoading(false);
                },
                onError: () => {
                    setLoading(false);
                }
            });
        }
    };

    const handleDeleteResource = (component) => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Delete Resource',
            message: 'Are you sure you want to delete this resource?',
            confirmText: 'Delete',
            onConfirm: () => router.delete(`/projects/${project.id}/boq/components/${component.id}`)
        });
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const resultItems = await parseBoqCsv(file);
            if (resultItems.length > 0) {
                setLoading(true);
                router.post(`/projects/${project.id}/boq/bulk`, { items: resultItems }, {
                    onSuccess: () => { setLoading(false); },
                    onError: () => { setLoading(false); }
                });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to parse file');
        }
        e.target.value = '';
    };

    const handleSmartImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        setSmartImport(s => ({ ...s, analyzing: true }));

        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await axios.post(
                `/projects/${project.id}/boq/smart-import/analyze`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setSmartImport({ open: true, data, analyzing: false });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to analyze file. Please check the format.');
            setSmartImport({ open: false, data: null, analyzing: false });
        }
    };

    const handleClearAll = () => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Clear All BOQ Items',
            message: 'Are you sure you want to delete all BOQ items? This action cannot be undone.',
            confirmText: 'Delete All',
            onConfirm: () => {
                setLoading(true);
                router.delete(`/projects/${project.id}/boq`, {
                    onSuccess: () => setLoading(false),
                    onError: () => setLoading(false),
                });
            }
        });
    };

    const filteredItems = items.filter(item =>
        item.item_description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const highlightMatch = (text) => {
        if (!searchTerm.trim()) return text;
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? <mark key={i} className="bg-amber-400/30 text-amber-900 dark:text-amber-100 rounded px-0.5">{part}</mark> : part
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={`BOQ - ${project.name}`} />

            <div className="p-6 space-y-6 max-w-[1920px] mx-auto h-[calc(100vh-65px)] overflow-hidden flex flex-col">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg shadow-black/5 shrink-0 z-20">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <Box size={24} />
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Bill of Quantities</h1>
                                {isApproved && (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/20">Approved</span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 font-medium truncate max-w-[200px] sm:max-w-md">
                                Project: <span className="text-slate-800 dark:text-slate-200 font-bold">{project.name}</span> <span className="text-slate-400 mx-1">•</span> <span className="font-mono text-slate-400">#{project.id}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                        <div className="relative group w-full lg:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-purple-500/50 focus:ring-0 outline-none transition-all placeholder:text-slate-400 h-10"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {isApproved ? (
                                <div className="flex items-center gap-2">
                                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 h-10">
                                        <span className="w-2 h-2 rounded-full bg-slate-400"></span> Locked
                                    </div>
                                    {['admin', 'project_manager'].includes(auth.user.role) && (
                                        <button 
                                            onClick={handleUnlock} 
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95 h-10"
                                        >
                                            <RefreshCcw size={14} /> <span className="whitespace-nowrap">Revision</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                ['admin', 'project_manager'].includes(auth.user.role) && (
                                    <button onClick={handleApprove} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 h-10">
                                        Approve BOQ
                                    </button>
                                )
                            )}

                            {!isApproved && (
                                <button onClick={() => setIsWizardOpen(true)} className="flex-1 lg:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95 h-10">
                                    <Plus size={18} /> <span>Add Item</span>
                                </button>
                            )}

                            <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-10">
                                <button onClick={() => setIsInfoModalOpen(true)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow" title="Project Info">
                                    <Info size={16} />
                                </button>
                                <button onClick={() => router.reload()} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow" title="Refresh">
                                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                </button>
                                <button onClick={() => downloadBoqTemplate(project)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow" title="Download Template">
                                    <FileDown size={16} />
                                </button>
                                {!isApproved && (
                                    <>
                                        <label
                                            className="p-2 text-slate-500 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow cursor-pointer"
                                            title={smartImport.analyzing ? 'Analyzing file...' : 'Smart Import — any Excel format'}
                                        >
                                            {smartImport.analyzing
                                                ? <RefreshCcw size={16} className="animate-spin" />
                                                : <Sparkles size={16} />
                                            }
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                className="hidden"
                                                onChange={handleSmartImport}
                                                disabled={loading || smartImport.analyzing}
                                            />
                                        </label>
                                        <label className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow cursor-pointer" title="Import BOQ (CSV or Excel)">
                                            <Upload size={16} />
                                            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleBulkUpload} disabled={loading} />
                                        </label>
                                        {items.length > 0 && (
                                            <button onClick={handleClearAll} disabled={loading} className="p-2 text-slate-500 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed" title="Clear All Items">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <BoqMetricsModal 
                    isOpen={isInfoModalOpen} 
                    onClose={() => setIsInfoModalOpen(false)} 
                    project={project} 
                    calculations={calculations} 
                />

                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/5 flex-grow relative flex flex-col">
                    <div className="overflow-x-auto custom-scrollbar flex-grow">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                <tr className="border-b border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                                    <th className="p-3 w-10 text-center text-slate-400">#</th>
                                    <th className="p-3">Description</th>
                                    <th className="p-3 w-16 text-center text-slate-400">Unit</th>
                                    <th className="p-3 w-16 text-center">Qty</th>
                                    <th className="p-3 w-28 text-right text-slate-500">Mat. Rate</th>
                                    <th className="p-3 w-28 text-right text-cyan-600 dark:text-cyan-400">Total Material</th>
                                    <th className="p-3 w-28 text-right text-slate-500">Lab. Rate</th>
                                    <th className="p-3 w-28 text-right text-purple-600 dark:text-purple-400">Total Labor</th>
                                    <th className="p-3 w-28 text-right text-emerald-600 dark:text-emerald-400 bg-emerald-50/5 dark:bg-emerald-500/10">Line Total</th>
                                    <th className="p-3 w-20 text-center text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-700 dark:text-slate-200">
                                {filteredItems.map((item, idx) => {
                                    const matTotal = Number(item.material_unit_price) * Number(item.quantity);
                                    const laborTotal = (Number(item.labor_unit_price) || 0) * Number(item.quantity);
                                    const rowTotal = matTotal + laborTotal;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`group hover:bg-white/60 dark:hover:bg-slate-700/40 transition-all duration-200 cursor-pointer ${drawerItem?.id === item.id ? 'bg-white/80 dark:bg-slate-700/30' : ''}`}
                                            onClick={() => setDrawerItemId(item.id)}
                                        >
                                            <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs border-l-4 border-transparent group-hover:border-purple-500/50 transition-all">{idx + 1}</td>
                                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white truncate">
                                                <div className="flex items-center gap-2">
                                                    <button className={`p-1 rounded-md transition-all shrink-0 ${drawerItem?.id === item.id ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                        <Layers size={14} />
                                                    </button>
                                                    <div className="min-w-0">
                                                        <div className="group-hover:text-purple-600 transition-colors truncate">{highlightMatch(item.item_description)}</div>
                                                        {item.is_carport && (
                                                            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase font-bold tracking-wider mt-1">
                                                                <Car size={10} /> Carport
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-center text-slate-500 text-xs font-medium uppercase">{item.unit}</td>
                                            <td className="py-3 px-3 text-center font-bold font-mono text-slate-800 dark:text-slate-200">{item.quantity}</td>
                                            <td className="py-3 px-3 text-right font-mono text-slate-500 tabular-nums text-xs">₱{Number(item.material_unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-3 text-right font-mono font-medium text-cyan-700 dark:text-cyan-400 tabular-nums text-xs">₱{matTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-3 text-right font-mono text-slate-500 tabular-nums text-xs">₱{Number(item.labor_unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-3 text-right font-mono font-medium text-purple-700 dark:text-purple-400 tabular-nums text-xs">₱{laborTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums text-xs bg-emerald-50/5 dark:bg-emerald-500/10">₱{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-2 text-center" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => isApproved ? toast.info('BOQ is approved and locked. Request revision to edit.') : setEditItem(item)}
                                                        title={isApproved ? "BOQ Locked" : "Edit Item"}
                                                        className={`p-1.5 rounded-lg transition-all border shadow-sm hover:shadow active:scale-95 ${
                                                            isApproved 
                                                                ? 'bg-slate-50 dark:bg-slate-900/10 text-slate-400 border-slate-200/50 dark:border-slate-800/30 cursor-default' 
                                                                : 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-800/30 hover:text-cyan-700 dark:hover:text-cyan-300 border-cyan-200/50 dark:border-cyan-700/30'
                                                        }`}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => isApproved ? toast.info('BOQ is approved and locked. Request revision to delete.') : setDeleteTarget(item)}
                                                        title={isApproved ? "BOQ Locked" : "Delete Item"}
                                                        className={`p-1.5 rounded-lg transition-all border shadow-sm hover:shadow active:scale-95 ${
                                                            isApproved 
                                                                ? 'bg-slate-50 dark:bg-slate-900/10 text-slate-400 border-slate-200/50 dark:border-slate-800/30 cursor-default' 
                                                                : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/30 hover:text-red-700 dark:hover:text-red-300 border-red-200/50 dark:border-red-700/30'
                                                        }`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 z-10 shadow-inner backdrop-blur-sm">
                                <tr className="text-xs font-bold text-slate-900 dark:text-white">
                                    <td colSpan={4} className="p-3 text-right text-slate-500 uppercase tracking-widest">Grand Totals</td>
                                    <td className="p-3 text-right text-slate-300 font-mono">---</td>
                                    <td className="p-3 text-right font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50/30 dark:bg-cyan-900/20">{calculations.totalMaterialCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right text-slate-300 font-mono">---</td>
                                    <td className="p-3 text-right font-mono text-purple-700 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-900/20">{calculations.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/20">{calculations.totalConstructionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <Drawer
                    isOpen={!!drawerItem}
                    onClose={() => setDrawerItemId(null)}
                    title={
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{drawerItem?.item_description}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 font-medium font-mono border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md w-fit bg-white dark:bg-slate-800">DUPA / RESOURCES</span>
                                {drawerItem?.quantity && <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold font-mono border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded-md w-fit">QTY: {drawerItem.quantity} {drawerItem.unit}</span>}
                            </div>
                        </div>
                    }
                >
                    {drawerItem && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 rounded-xl border border-cyan-200/50 dark:border-cyan-900/30 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-slate-900 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Box size={40} /></div>
                                    <div className="text-[10px] font-bold text-cyan-600/70 dark:text-cyan-400/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Box size={12} /> Material Total</div>
                                    <div className="text-xl font-black text-cyan-700 dark:text-cyan-400 font-mono tracking-tight tabular-nums">₱{Number(drawerItem.material_unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div className="text-[10px] text-slate-400 mt-1 font-medium">per unit</div>
                                </div>
                                <div className="p-4 rounded-xl border border-purple-200/50 dark:border-purple-900/30 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Hammer size={40} /></div>
                                    <div className="text-[10px] font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Hammer size={12} /> Labor Total</div>
                                    <div className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono tracking-tight tabular-nums">₱{Number(drawerItem.labor_unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div className="text-[10px] text-slate-400 mt-1 font-medium">per unit</div>
                                </div>
                                <div className="p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><TrendingUp size={40} className="text-emerald-500" /></div>
                                    <div className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><TrendingUp size={12} /> Overall Profit</div>
                                    <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight tabular-nums">
                                        ₱{drawerItem.components?.reduce((sum, comp) => {
                                            const profitPerUnit = Number(comp.client_unit_rate || comp.unit_rate || 0) - Number(comp.altapil_unit_rate || 0);
                                            const qtyFactor = comp.resource_type === 'MATERIAL' 
                                                ? Number(comp.quantity_factor)
                                                : ((Number(comp.no_of_persons) || 0) * (Number(comp.hours) || 0) / (Number(drawerItem?.quantity) || 1));
                                            return sum + (profitPerUnit * qtyFactor * Number(drawerItem.quantity));
                                        }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 font-medium">total amount</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Layers size={14} className="text-purple-500" /> Resource Components
                                </h3>
                                {!isApproved && (
                                    <button
                                        onClick={() => setResourceModal({ open: true, mode: 'add', data: { resource_type: 'MATERIAL', quantity_factor: 1, client_unit_rate: 0, altapil_unit_rate: 0, no_of_persons: 1, hours: 0 } })}
                                        className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                        <Plus size={12} /> Add Resource
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {drawerItem.components?.length > 0 ? (
                                    drawerItem.components.map(comp => (
                                        <div key={comp.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 shadow-sm group hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {comp.resource_type === 'MATERIAL' && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400"><Box size={8} /> Mat</span>}
                                                        {comp.resource_type === 'LABOR' && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"><Hammer size={8} /> Lab</span>}
                                                        {comp.resource_type === 'EQUIPMENT' && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"><Truck size={8} /> Eqp</span>}
                                                        <span className="font-bold text-sm text-slate-900 dark:text-white">{comp.name}</span>
                                                        {comp.unit && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600">{comp.unit}</span>}
                                                    </div>
                                                    {comp.resource_type !== 'MATERIAL' && <div className="text-[10px] text-slate-400 font-mono mt-1">{comp.no_of_persons} Persons × {comp.hours} Hours</div>}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => isApproved ? toast.info('BOQ is approved and locked. Request revision to edit.') : setResourceModal({ open: true, mode: 'edit', data: comp })} 
                                                        className={`p-1.5 rounded-md transition-all ${
                                                            isApproved 
                                                                ? 'text-slate-300 dark:text-slate-600 cursor-default' 
                                                                : 'text-slate-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600'
                                                        }`}
                                                        title={isApproved ? "Locked" : "Edit Resource"}
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => isApproved ? toast.info('BOQ is approved and locked. Request revision to delete.') : handleDeleteResource(comp)} 
                                                        className={`p-1.5 rounded-md transition-all ${
                                                            isApproved 
                                                                ? 'text-slate-300 dark:text-slate-600 cursor-default' 
                                                                : 'text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                                                        }`}
                                                        title={isApproved ? "Locked" : "Delete Resource"}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-[11px]">
                                                <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-slate-400 uppercase font-bold text-[9px] mb-1">Qty Factor</span>
                                                    <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                                                        {comp.resource_type === 'MATERIAL' 
                                                            ? Number(comp.quantity_factor).toFixed(4)
                                                            : ((Number(comp.no_of_persons) || 0) * (Number(comp.hours) || 0) / (Number(drawerItem?.quantity) || 1)).toFixed(4)
                                                        }
                                                    </span>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-slate-400 uppercase font-bold text-[9px] mb-1">Client Rate</span>
                                                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold tabular-nums">₱{Number(comp.client_unit_rate || comp.unit_rate || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-orange-50/50 dark:bg-orange-900/10 p-2.5 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                                    <span className="block text-orange-500 uppercase font-bold text-[9px] mb-1">Altapil Rate</span>
                                                    <span className="font-mono text-orange-700 dark:text-orange-400 font-bold tabular-nums">₱{Number(comp.altapil_unit_rate || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-emerald-600 uppercase font-bold text-[9px] mb-1">Profit/Unit</span>
                                                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">₱{(Number(comp.client_unit_rate || comp.unit_rate || 0) - Number(comp.altapil_unit_rate || 0)).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                                    <span className="block text-emerald-600 uppercase font-bold text-[9px] mb-1">Total Profit</span>
                                                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black tabular-nums">
                                                        ₱{((Number(comp.client_unit_rate || comp.unit_rate || 0) - Number(comp.altapil_unit_rate || 0)) * 
                                                          (comp.resource_type === 'MATERIAL' 
                                                            ? Number(comp.quantity_factor)
                                                            : ((Number(comp.no_of_persons) || 0) * (Number(comp.hours) || 0) / (Number(drawerItem?.quantity) || 1))) * 
                                                          Number(drawerItem.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl border-dashed">
                                        <Layers size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No resources defined.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Drawer>

                <AddBoqItemWizard
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    onSubmit={handleWizardSubmit}
                    materials={materials || []}
                    units={units || []}
                />

                <ConfirmationModal
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    title="Delete BOQ Item"
                    message={`Are you sure you want to delete "${deleteTarget?.item_description}"? This action is permanent and cannot be undone.`}
                    confirmText="Delete Item"
                    type="danger"
                />

                <EditBoqItemModal 
                    isOpen={!!editItem} 
                    onClose={() => setEditItem(null)} 
                    item={editItem} 
                    setItem={setEditItem} 
                    onSubmit={handleUpdateItem} 
                    loading={loading} 
                />

                <ResourceModal
                    isOpen={resourceModal.open}
                    onClose={() => setResourceModal({ ...resourceModal, open: false })}
                    mode={resourceModal.mode}
                    data={resourceModal.data}
                    setData={(data) => setResourceModal({ ...resourceModal, data })}
                    units={units}
                    onSubmit={handleResourceSubmit}
                    loading={loading}
                    parentItem={drawerItem}
                />

                <SmartImportPreviewModal
                    isOpen={smartImport.open}
                    onClose={() => setSmartImport({ open: false, data: null, analyzing: false })}
                    projectId={project.id}
                    analyzeData={smartImport.data}
                />

                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    type={confirmModal.type}
                    confirmText={confirmModal.confirmText}
                    inputPlaceholder={confirmModal.inputPlaceholder}
                />
            </div>
        </AuthenticatedLayout>
    );
}
