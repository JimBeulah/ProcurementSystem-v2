import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import Drawer from '@/Components/UI/Drawer';
import AddBoqItemWizard from '@/Components/Boq/AddBoqItemWizard'; // Import the wizard
import {
    ClipboardList, Plus, RefreshCcw, Upload, FileDown, Search, Home, Car, TrendingUp,
    ChevronDown, ChevronRight, Calculator, Trash2, Settings, AlertTriangle, Pencil, MoreHorizontal,
    Box, Layers, Hammer, Truck, Info
} from 'lucide-react';

export default function ProjectBoq() {
    const { project, boqItems: initialItems, materials, units, isApproved, auth } = usePage().props;

    const [items, setItems] = useState(initialItems || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerItem, setDrawerItem] = useState(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [loading, setLoading] = useState(false);

    // Edit Item State
    const [editItem, setEditItem] = useState(null);

    // Resource State
    const [resourceModal, setResourceModal] = useState({ open: false, mode: 'add', parentItem: null, data: null });
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const handleWizardSubmit = (payload) => {
        return new Promise((resolve, reject) => {
            setLoading(true);
            router.post(`/projects/${project.id}/boq`, payload, {
                onSuccess: () => {
                    toast.success('BOQ Item Added');
                    setIsWizardOpen(false);
                    setLoading(false);
                    resolve(true);
                },
                onError: (errors) => {
                    toast.error('Failed to add item');
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
                toast.success('Item Deleted');
                setDeleteTarget(null);
            }
        });
    };

    const handleApprove = () => {
        if (confirm('Are you sure you want to approve this BOQ? This will lock all items from further editing.')) {
            router.post(`/projects/${project.id}/boq/approve`, {}, {
                onSuccess: () => toast.success('BOQ Approved & Locked'),
                onError: () => toast.error('Failed to approve BOQ')
            });
        }
    };

    const handleUpdateItem = (e) => {
        e.preventDefault();
        setLoading(true);
        router.put(`/projects/${project.id}/boq/${editItem.id}`, editItem, {
            onSuccess: () => {
                toast.success('Item Updated');
                setEditItem(null);
                setLoading(false);
            },
            onError: () => {
                toast.error('Failed to update item');
                setLoading(false);
            }
        });
    };

    const handleResourceSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        const { mode, parentItem, data } = resourceModal;

        let quantityFactor = data.quantity_factor !== undefined && data.quantity_factor !== '' ? Number(data.quantity_factor) : 0;

        // If not MATERIAL, calculate factor: (Persons * Hours) / ItemQuantity
        if (data.resource_type !== 'MATERIAL') {
            const persons = data.no_of_persons !== undefined && data.no_of_persons !== '' ? Number(data.no_of_persons) : 0;
            const hours = data.hours !== undefined && data.hours !== '' ? Number(data.hours) : 0;
            const itemQty = Number(parentItem.quantity) || 1;
            quantityFactor = (persons * hours) / itemQty;
        }

        const payload = {
            resourceType: data.resource_type,
            name: data.name,
            quantityFactor: quantityFactor,
            clientUnitRate: data.client_unit_rate !== undefined && data.client_unit_rate !== '' ? Number(data.client_unit_rate) : (data.unit_rate !== undefined && data.unit_rate !== '' ? Number(data.unit_rate) : 0),
            altapilUnitRate: data.altapil_unit_rate !== undefined && data.altapil_unit_rate !== '' ? Number(data.altapil_unit_rate) : 0,
            noOfPersons: data.no_of_persons !== undefined && data.no_of_persons !== '' ? Number(data.no_of_persons) : 0,
            hours: data.hours !== undefined && data.hours !== '' ? Number(data.hours) : 0,
        };

        if (mode === 'add') {
            router.post(`/projects/${project.id}/boq/${parentItem.id}/components`, payload, {
                onSuccess: () => {
                    toast.success('Resource Added');
                    setResourceModal({ ...resourceModal, open: false });
                    setLoading(false);
                },
                onError: (errors) => {
                    toast.error('Failed to add resource. Please check the inputs.');
                    console.error('Add Resource Error:', errors);
                    setLoading(false);
                }
            });
        } else {
            router.put(`/projects/${project.id}/boq/components/${data.id}`, payload, {
                onSuccess: () => {
                    toast.success('Resource Updated');
                    setResourceModal({ ...resourceModal, open: false });
                    setLoading(false);
                },
                onError: (errors) => {
                    toast.error('Failed to update resource. Please check the inputs.');
                    console.error('Update Resource Error:', errors);
                    setLoading(false);
                }
            });
        }
    };

    const handleDeleteResource = (component) => {
        if (confirm('Delete this resource?')) {
            router.delete(`/projects/${project.id}/boq/components/${component.id}`, {
                onSuccess: () => toast.success('Resource Deleted'),
            });
        }
    };

    const toggleRow = (id) => {
        // Obsolete function, leaving empty to avoid unused variable errors if lingering
    };

    useEffect(() => {
        if (drawerItem) {
            const updatedItem = items.find(i => i.id === drawerItem.id);
            if (updatedItem) setDrawerItem(updatedItem);
        }
    }, [items]);

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

    // Computed values for metrics
    const totalMaterialCost = items.reduce((sum, item) => sum + (Number(item.material_unit_price) * Number(item.quantity)), 0);
    const totalLaborCost = items.reduce((sum, item) => sum + (Number(item.labor_unit_price || 0) * Number(item.quantity)), 0);
    const totalConstructionCost = totalMaterialCost + totalLaborCost;

    const baseCarportAmount = items.filter(i => i.is_carport).reduce((sum, i) => sum + ((Number(i.material_unit_price) + Number(i.labor_unit_price || 0)) * Number(i.quantity)), 0);
    const amountOfCarportWithProfit = baseCarportAmount * 1.1;
    const totalWithProfit = totalConstructionCost * 1.1;
    const amountWithoutCarportWithProfit = totalWithProfit - amountOfCarportWithProfit;

    const floorArea = Number(project.total_floor_area) || 0;
    const carportArea = Number(project.carport_area) || 0;

    const amountPerSqmBuilding = floorArea > 0 ? amountWithoutCarportWithProfit / floorArea : 0;
    const amountPerSqmCarport = carportArea > 0 ? amountOfCarportWithProfit / carportArea : 0;

    // CSV Download
    const downloadTemplate = () => {
        const headers = [
            'ROW TYPE', 'DESCRIPTION/NAME', 'UNIT', 'QUANTITY',
            'MAT. UNIT COST', 'LAB. UNIT COST', 'IS CARPORT',
            'RESOURCE TYPE', 'QTY FACTOR/HOURS', 'NO. OF PERSONS', 'UNIT RATE'
        ];
        const instructions = [
            '# INSTRUCTIONS:',
            'Use "ITEM" for main BOQ items. Use "RESOURCE" for breakdown components below an item.',
            'For ITEMS: Fill columns B to G. Leave H to K blank.',
            'For RESOURCES: Fill columns B (Name), H (Type), I (Factor/Hours), J (Persons), K (Rate).',
            'Resource Types: MATERIAL, LABOR, EQUIPMENT'
        ];
        const examples = [
            'ITEM,Concreting Works,lot,1.00,,,NO,,,,',
            'RESOURCE,Portland Cement,,,,,MATERIAL,9.00,,230.00',
            'RESOURCE,Washed Sand,,,,,MATERIAL,0.50,,850.00',
            'RESOURCE,Foreman,,,,,LABOR,8.00,1.00,85.00',
            'RESOURCE,Skilled Labor,,,,,LABOR,8.00,2.00,65.00'
        ];
        const csvContent = [headers.join(','), ...instructions.map(i => `"${i}",,,,,,,,,,`), ...examples].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `boq_template_project_${project.id}.csv`;
        a.click();
    };

    // Bulk Upload
    const handleBulkUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = (event.target?.result).replace(/^\uFEFF/, '');
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

            const resultItems = [];
            let currentItem = null;

            lines.forEach((line, idx) => {
                if (idx === 0 || line.startsWith('#') || line.startsWith('"#')) return;

                const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
                if (cols.length < 2) return;

                const rowType = cols[0].toUpperCase();
                if (rowType === 'ITEM') {
                    if (currentItem) resultItems.push(currentItem);
                    currentItem = {
                        itemDescription: cols[1],
                        unit: cols[2],
                        quantity: parseFloat(cols[3] || 1),
                        materialUnitPrice: cols[4] ? parseFloat(cols[4]) : 0,
                        laborUnitPrice: cols[5] ? parseFloat(cols[5]) : 0,
                        isCarport: ['YES', 'TRUE', '1'].includes((cols[6] || '').toUpperCase()),
                        components: []
                    };
                } else if (rowType === 'RESOURCE' && currentItem) {
                    currentItem.components.push({
                        resourceType: cols[7].toUpperCase(),
                        name: cols[1],
                        quantityFactor: parseFloat(cols[8] || 0),
                        noOfPersons: parseFloat(cols[9] || 1),
                        hours: parseFloat(cols[8] || 0), // Use same col for hours if Labor
                        unitRate: parseFloat(cols[10] || 0)
                    });
                }
            });
            if (currentItem) resultItems.push(currentItem);

            if (resultItems.length > 0) {
                setLoading(true);
                router.post(`/projects/${project.id}/boq/bulk`, { items: resultItems }, {
                    onSuccess: () => { toast.success('Bulk Upload Complete'); setLoading(false); },
                    onError: () => { toast.error('Upload Failed'); setLoading(false); }
                });
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset
    };

    return (
        <AuthenticatedLayout>
            <Head title={`BOQ - ${project.name}`} />

            <div className="p-6 space-y-6 max-w-[1920px] mx-auto h-[calc(100vh-65px)] overflow-hidden flex flex-col">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg shadow-black/5 shrink-0 z-20">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                                    <ClipboardList size={20} className="text-white" />
                                </div>
                                <span className="opacity-90">Bill of Quantities</span>
                            </h1>
                            {isApproved && (
                                <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider flex items-center gap-1">
                                    Approved
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 font-medium ml-1">
                            Project: <span className="text-slate-800 dark:text-slate-200 font-bold">{project.name}</span> <span className="text-slate-400 mx-1">•</span> <span className="font-mono text-slate-400">#{project.id}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative group w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-purple-500/50 focus:ring-0 outline-none transition-all placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                        {isApproved ? (
                            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Locked
                            </div>
                        ) : (
                            ['admin', 'project_manager'].includes(auth.user.role) && (
                                <button onClick={handleApprove} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                    Approve BOQ
                                </button>
                            )
                        )}

                        {!isApproved && (
                            <button onClick={() => setIsWizardOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95">
                                <Plus size={18} /> <span className="hidden sm:inline">Add Item</span>
                            </button>
                        )}

                        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button onClick={() => setIsInfoModalOpen(true)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow" title="Project Info">
                                <Info size={16} />
                            </button>
                            <button onClick={() => router.reload()} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow" title="Refresh">
                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button onClick={downloadTemplate} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow" title="Download Template">
                                <FileDown size={16} />
                            </button>
                            {!isApproved && (
                                <label className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow cursor-pointer" title="Bulk Upload">
                                    <Upload size={16} />
                                    <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} disabled={loading} />
                                </label>
                            )}
                        </div>
                    </div>
                </header>

                {/* Metrics Grid Modal */}
                <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="Project Metrics" maxWidth="max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp size={48} className="text-purple-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Project Cost</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight relative z-10">
                                <span className="text-lg text-slate-400 mr-1">₱</span>
                                {(Number(project.appropriation) || totalWithProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>

                        {project.project_type === 'BUILDING' ? (
                            <>
                                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Home size={48} className="text-blue-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-2 relative z-10">
                                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <Home size={20} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Building Value</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 relative z-10">
                                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                            ₱ {amountPerSqmBuilding.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </p>
                                        <span className="text-xs text-slate-500 font-medium">/ sqm ({floorArea})</span>
                                    </div>
                                </div>

                                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Car size={48} className="text-amber-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-2 relative z-10">
                                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <Car size={20} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carport Value</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 relative z-10">
                                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                            ₱ {amountPerSqmCarport.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </p>
                                        <span className="text-xs text-slate-500 font-medium">/ sqm ({carportArea})</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Settings size={48} className="text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-2 relative z-10">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <Settings size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Infra Value</span>
                                </div>
                                <div className="flex items-baseline gap-2 relative z-10">
                                    <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                        ₱ {(project.net_length > 0 ? totalConstructionCost / Number(project.net_length) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                    <span className="text-xs text-slate-500 font-medium">/ meter ({project.net_length || 0})</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-end shadow-sm relative">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost Distribution</span>
                            </div>
                            <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden flex mb-2">
                                <div className="bg-cyan-500 h-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${(amountWithoutCarportWithProfit / totalWithProfit) * 100 || 0}%` }} />
                                <div className="bg-amber-500 h-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${(amountOfCarportWithProfit / totalWithProfit) * 100 || 0}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500"></div> Building ({((amountWithoutCarportWithProfit / totalWithProfit) * 100 || 0).toFixed(0)}%)</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Carport</span>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Table Container - Flex grow to take up remaining space */}
                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/5 flex-grow relative flex flex-col">
                    <div className="overflow-auto custom-scrollbar flex-grow">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                <tr className="border-b border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                                    <th className="p-4 w-12 text-center text-slate-400">#</th>
                                    <th className="p-4 min-w-[300px]">
                                        <div className="flex items-center gap-2">
                                            Description
                                        </div>
                                    </th>
                                    <th className="p-4 w-20 text-center text-slate-400">Unit</th>
                                    <th className="p-4 w-24 text-center">Qty</th>
                                    <th className="p-4 w-32 text-right text-slate-500">
                                        <div className="flex items-center justify-end gap-1">
                                            Mat. Rate
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50"></div>
                                        </div>
                                    </th>
                                    <th className="p-4 w-36 text-right text-cyan-600 dark:text-cyan-400">Total Material</th>
                                    <th className="p-4 w-32 text-right text-slate-500">
                                        <div className="flex items-center justify-end gap-1">
                                            Lab. Rate
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50"></div>
                                        </div>
                                    </th>
                                    <th className="p-4 w-36 text-right text-purple-600 dark:text-purple-400">Total Labor</th>
                                    <th className="p-4 w-40 text-right text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10">Line Total</th>
                                    <th className="p-4 w-16 text-center text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-700 dark:text-slate-200">
                                {filteredItems.map((item, idx) => {
                                    const matTotal = Number(item.material_unit_price) * Number(item.quantity);
                                    const laborTotal = (Number(item.labor_unit_price) || 0) * Number(item.quantity);
                                    const rowTotal = matTotal + laborTotal;
                                    const hasComponents = item.components && item.components.length > 0;

                                    return (
                                        <React.Fragment key={item.id}>
                                            <tr
                                                className={`group hover:bg-white/60 dark:hover:bg-slate-700/40 transition-all duration-200 cursor-pointer ${drawerItem?.id === item.id ? 'bg-white/80 dark:bg-slate-700/30' : ''}`}
                                                onClick={() => setDrawerItem(item)}
                                            >
                                                <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs border-l-4 border-transparent group-hover:border-purple-500/50 transition-all">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {idx + 1}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                                                    <div className="flex items-center gap-3">
                                                        <button className={`p-1 rounded-md transition-all ${drawerItem?.id === item.id ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                            <Layers size={14} />
                                                        </button>
                                                        <div>
                                                            <div className="group-hover:text-purple-600 transition-colors">{highlightMatch(item.item_description)}</div>
                                                            {item.is_carport && (
                                                                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase font-bold tracking-wider mt-1">
                                                                    <Car size={10} /> Carport
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center text-slate-500 text-xs font-medium uppercase tracking-wide bg-slate-50/50 dark:bg-slate-800/50 rounded-lg mx-2">{item.unit}</td>
                                                <td className="py-3 px-4 text-center font-bold font-mono text-slate-800 dark:text-slate-200">{item.quantity}</td>
                                                <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                                                    <span className="text-[10px] text-slate-300 mr-1">₱</span>{Number(item.material_unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono font-medium text-cyan-700 dark:text-cyan-400 tabular-nums">
                                                    <span className="text-[10px] text-cyan-300/50 mr-1">₱</span>{matTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                                                    <span className="text-[10px] text-slate-300 mr-1">₱</span>{Number(item.labor_unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono font-medium text-purple-700 dark:text-purple-400 tabular-nums">
                                                    <span className="text-[10px] text-purple-300/50 mr-1">₱</span>{laborTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums bg-emerald-500/5 dark:bg-emerald-500/10 mb-1">
                                                    <span className="text-[10px] text-emerald-400/50 mr-1">₱</span>{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                                                    {!isApproved && (
                                                        <div className="flex items-center justify-center gap-1 transition-all duration-200">
                                                            <button
                                                                onClick={() => setEditItem(item)}
                                                                className="p-1.5 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteTarget(item)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 z-10 shadow-inner backdrop-blur-sm">
                                <tr className="text-xs font-bold text-slate-900 dark:text-white">
                                    <td colSpan={4} className="p-4 text-right text-slate-500 uppercase tracking-widest">Grand Totals</td>
                                    <td className="p-4 text-right text-slate-300 font-mono">---</td>
                                    <td className="p-4 text-right font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50/30 dark:bg-cyan-900/20">{totalMaterialCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-right text-slate-300 font-mono">---</td>
                                    <td className="p-4 text-right font-mono text-purple-700 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-900/20">{totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-right font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/20">{totalConstructionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <Drawer
                    isOpen={!!drawerItem}
                    onClose={() => setDrawerItem(null)}
                    title={
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{drawerItem?.item_description}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 font-medium font-mono border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md w-fit bg-white dark:bg-slate-800">
                                    DUPA / RESOURCES
                                </span>
                                {drawerItem?.quantity && drawerItem?.unit && (
                                    <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold font-mono border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded-md w-fit">
                                        QTY: {drawerItem.quantity} {drawerItem.unit}
                                    </span>
                                )}
                            </div>
                        </div>
                    }
                >
                    {drawerItem && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border border-cyan-200/50 dark:border-cyan-900/30 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-slate-900 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Box size={40} /></div>
                                    <div className="text-[10px] font-bold text-cyan-600/70 dark:text-cyan-400/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Box size={12} /> Material Total</div>
                                    <div className="text-xl font-black text-cyan-700 dark:text-cyan-400 font-mono tracking-tight tabular-nums">
                                        <span className="text-cyan-600/40 text-sm mr-1">₱</span>{Number(drawerItem.material_unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 font-medium">per unit</div>
                                </div>
                                <div className="p-4 rounded-xl border border-purple-200/50 dark:border-purple-900/30 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Hammer size={40} /></div>
                                    <div className="text-[10px] font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Hammer size={12} /> Labor Total</div>
                                    <div className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono tracking-tight tabular-nums">
                                        <span className="text-purple-600/40 text-sm mr-1">₱</span>{Number(drawerItem.labor_unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 font-medium">per unit</div>
                                </div>
                            </div>

                            {/* Header row before list */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Layers size={14} className="text-purple-500" />
                                    Resource Components
                                </h3>
                                {!isApproved && (
                                    <button
                                        onClick={() => setResourceModal({ open: true, mode: 'add', parentItem: drawerItem, data: { resource_type: 'MATERIAL', quantity_factor: 1, client_unit_rate: 0, altapil_unit_rate: 0, no_of_persons: 1, hours: 0 } })}
                                        className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                        <Plus size={12} /> Add Resource
                                    </button>
                                )}
                            </div>

                            {/* DUPA List */}
                            <div className="space-y-3">
                                {drawerItem.components && drawerItem.components.length > 0 ? (
                                    drawerItem.components.map(comp => (
                                        <div key={comp.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 shadow-sm group hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {comp.resource_type === 'MATERIAL' && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400"><Box size={8} /> Mat</span>}
                                                        {comp.resource_type === 'LABOR' && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"><Hammer size={8} /> Lab</span>}
                                                        {comp.resource_type === 'EQUIPMENT' && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"><Truck size={8} /> Eqp</span>}
                                                        <span className="font-bold text-sm text-slate-900 dark:text-white leading-none">{comp.name}</span>
                                                    </div>
                                                    {comp.resource_type !== 'MATERIAL' && <div className="text-[10px] text-slate-400 font-mono mt-1">{comp.no_of_persons} Persons × {comp.hours} Hours</div>}
                                                </div>

                                                {!isApproved && (
                                                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setResourceModal({ open: true, mode: 'edit', parentItem: drawerItem, data: comp })} className="p-1.5 text-slate-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 rounded-md transition-colors"><Pencil size={12} /></button>
                                                        <button onClick={() => handleDeleteResource(comp)} className="p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-md transition-colors"><Trash2 size={12} /></button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                                                <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-slate-400 uppercase tracking-wider font-bold text-[9px] mb-1">Qty Factor</span>
                                                    <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                                                        {comp.resource_type === 'MATERIAL'
                                                            ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(Number(comp.quantity_factor))
                                                            : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(((Number(comp.no_of_persons) || 0) * (Number(comp.hours) || 0)) / (Number(drawerItem?.quantity) || 1))
                                                        }
                                                    </span>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-slate-400 uppercase tracking-wider font-bold text-[9px] mb-1">Client Rate</span>
                                                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold tabular-nums">₱ {Number(comp.client_unit_rate || comp.unit_rate || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-orange-50/50 dark:bg-orange-900/10 p-2.5 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                                    <span className="block text-orange-500 uppercase tracking-wider font-bold text-[9px] mb-1">Altapil Rate</span>
                                                    <span className="font-mono text-orange-700 dark:text-orange-400 font-bold tabular-nums">₱ {Number(comp.altapil_unit_rate || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                                    <span className="block text-emerald-600 uppercase tracking-wider font-bold text-[9px] mb-1">Profit/Unit</span>
                                                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black tabular-nums">₱ {(Number(comp.client_unit_rate || comp.unit_rate || 0) - Number(comp.altapil_unit_rate || 0)).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl border-dashed">
                                        <Layers size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No resources defined.</p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Add materials, labor, or equipment breakdowns.</p>
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

                {/* Delete Confirmation Modal */}
                <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-red-500 shadow-sm shrink-0"><AlertTriangle size={24} /></div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete Item?</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">"{deleteTarget?.item_description}"</span>?
                                    <br />This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-colors flex items-center gap-2"><Trash2 size={14} /> Delete Item</button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Item Modal */}
                <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit BOQ Item">
                    <form onSubmit={handleUpdateItem} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Description</label>
                            <input
                                type="text"
                                required
                                value={editItem?.item_description || ''}
                                onChange={e => setEditItem({ ...editItem, item_description: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Unit</label>
                                <input
                                    type="text"
                                    required
                                    value={editItem?.unit || ''}
                                    onChange={e => setEditItem({ ...editItem, unit: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Quantity</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    required
                                    value={editItem?.quantity || ''}
                                    onChange={e => setEditItem({ ...editItem, quantity: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        {editItem?.components && editItem.components.length === 0 && (
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Mat. Unit Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editItem?.material_unit_price || ''}
                                            onChange={e => setEditItem({ ...editItem, material_unit_price: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Lab. Unit Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editItem?.labor_unit_price || ''}
                                            onChange={e => setEditItem({ ...editItem, labor_unit_price: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 pt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <input
                                type="checkbox"
                                id="isCarport"
                                checked={editItem?.is_carport || false}
                                onChange={e => setEditItem({ ...editItem, is_carport: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-800"
                            />
                            <label htmlFor="isCarport" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none flex items-center gap-2">
                                <Car size={16} className="text-amber-500" /> Mark as Carport / Garage Area
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <button type="button" onClick={() => setEditItem(null)} className="px-5 py-2.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" disabled={loading} className="px-5 py-2.5 text-xs font-bold uppercase text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-600/20 transition-all transform active:scale-95">Save Changes</button>
                        </div>
                    </form>
                </Modal>

                {/* Resource Modal */}
                <Modal isOpen={resourceModal.open} onClose={() => setResourceModal({ ...resourceModal, open: false })} title={`${resourceModal.mode === 'add' ? 'Add' : 'Edit'} Resource`}>
                    <form onSubmit={handleResourceSubmit} className="space-y-5">

                        {/* Resource Type Selector */}
                        <div className="grid grid-cols-3 gap-3">
                            {['MATERIAL', 'LABOR', 'EQUIPMENT'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, resource_type: type } })}
                                    className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${resourceModal.data?.resource_type === type
                                        ? type === 'MATERIAL' ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20' :
                                            type === 'LABOR' ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20' :
                                                'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Name / Description</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Portland Cement"
                                value={resourceModal.data?.name || ''}
                                onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, name: e.target.value } })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Client Unit Rate</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={resourceModal.data?.client_unit_rate !== undefined ? resourceModal.data.client_unit_rate : (resourceModal.data?.unit_rate || '')}
                                        onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, client_unit_rate: e.target.value } })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-500 dark:text-orange-400 uppercase mb-2">Altapil Unit Rate</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300">₱</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={resourceModal.data?.altapil_unit_rate || ''}
                                        onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, altapil_unit_rate: e.target.value } })}
                                        className="w-full bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {resourceModal.data?.resource_type === 'MATERIAL' ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                        Quantity Factor
                                    </label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        required
                                        value={resourceModal.data?.quantity_factor || ''}
                                        onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, quantity_factor: e.target.value } })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">No. of Persons</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={resourceModal.data?.no_of_persons !== undefined ? resourceModal.data.no_of_persons : ''}
                                            onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, no_of_persons: e.target.value } })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Hours</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={resourceModal.data?.hours !== undefined ? resourceModal.data.hours : ''}
                                            onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, hours: e.target.value } })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {resourceModal.data?.resource_type !== 'MATERIAL' && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Calculated Quantity Factor</span>
                                <div className="font-mono text-sm text-slate-700 dark:text-slate-300 font-bold">
                                    {(((Number(resourceModal.data?.no_of_persons) || 0) * (Number(resourceModal.data?.hours) || 0)) / (Number(drawerItem?.quantity) || 1)).toFixed(4)}
                                    <span className="text-[10px] text-slate-400 font-medium ml-2">((Persons × Hours) / Base Qty)</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <button type="button" onClick={() => setResourceModal({ ...resourceModal, open: false })} className="px-5 py-2.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" disabled={loading} className="px-5 py-2.5 text-xs font-bold uppercase text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-600/20 transition-all transform active:scale-95">Save Resource</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
