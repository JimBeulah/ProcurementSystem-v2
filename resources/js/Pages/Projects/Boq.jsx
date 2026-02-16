import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import AddBoqItemWizard from '@/Components/Boq/AddBoqItemWizard'; // Import the wizard
import { toast } from 'sonner';
import {
    ClipboardList, Plus, RefreshCcw, Upload, FileDown, Search, Home, Car, TrendingUp,
    ChevronDown, ChevronRight, Calculator, Trash2, Settings, AlertTriangle, Pencil, MoreHorizontal
} from 'lucide-react';

export default function ProjectBoq() {
    const { project, boqItems: initialItems, materials, units, isApproved, auth } = usePage().props;

    const [items, setItems] = useState(initialItems || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [loading, setLoading] = useState(false);

    // Edit Item State
    const [editItem, setEditItem] = useState(null);

    // Resource State
    const [resourceModal, setResourceModal] = useState({ open: false, mode: 'add', parentItem: null, data: null });

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

        const payload = {
            resourceType: data.resource_type,
            name: data.name,
            quantityFactor: data.quantity_factor,
            unitRate: data.unit_rate,
            noOfPersons: data.no_of_persons,
            hours: data.hours,
        };

        if (mode === 'add') {
            router.post(`/projects/${project.id}/boq/${parentItem.id}/components`, payload, {
                onSuccess: () => {
                    toast.success('Resource Added');
                    setResourceModal({ ...resourceModal, open: false });
                    setLoading(false);
                },
                onError: () => setLoading(false)
            });
        } else {
            router.put(`/projects/${project.id}/boq/components/${data.id}`, payload, {
                onSuccess: () => {
                    toast.success('Resource Updated');
                    setResourceModal({ ...resourceModal, open: false });
                    setLoading(false);
                },
                onError: () => setLoading(false)
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
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
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
            regex.test(part) ? <mark key={i} className="bg-orange-500/30 text-foreground rounded px-0.5">{part}</mark> : part
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
            // Basic CSV parsing logic... reusing functionality from original request

            // Simplified for brevity, assume strict CSV format
            // ... (Insert CSV parsing logic here similar to original file, resulting in `items` array)
            // For now, simpler implementation or direct pass to backend validation?
            // Backend expects structured array. Client side parsing is robust.

            // Let's implement a robust parser quickly:
            const resultItems = [];
            let currentItem = null;

            lines.forEach((line, idx) => {
                if (idx === 0 || line.startsWith('#') || line.startsWith('"#')) return;

                // Split by comma but respect quotes is complex, simple split for template:
                // The template doesn't use commas in descriptions usually, but to be safe:
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

            <div className="p-4 space-y-4 max-w-[1920px] mx-auto max-h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ClipboardList className="text-orange-500" size={24} />
                            <span className="hidden md:inline">Bill of Quantities: </span>
                            <span className="text-orange-600 dark:text-orange-400">{project.name}</span>
                            {isApproved && (
                                <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider flex items-center gap-1">
                                    Approved
                                </span>
                            )}
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black opacity-60">Project ID: #{project.id}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {isApproved ? (
                            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Locked
                            </div>
                        ) : (
                            ['ADMIN', 'PROJECT_MANAGER'].includes(auth.user.role) && (
                                <>
                                    <button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                                        Approve BOQ
                                    </button>
                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                                </>
                            )
                        )}

                        <div className="relative group max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-slate-900 dark:text-white text-xs focus:border-cyan-500/50 outline-none transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {!isApproved && (
                            <button onClick={() => setIsWizardOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-orange-600/20 active:scale-95">
                                <Plus size={16} /> <span className="hidden sm:inline">Add Item</span>
                            </button>
                        )}

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                        <div className="flex items-center gap-1">
                            <button onClick={() => router.reload()} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Refresh">
                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button onClick={downloadTemplate} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Template">
                                <FileDown size={16} />
                            </button>
                            {!isApproved && (
                                <label className="p-1.5 text-cyan-500 hover:bg-cyan-500/10 rounded-lg cursor-pointer transition-colors" title="Bulk Upload">
                                    <Upload size={16} />
                                    <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} disabled={loading} />
                                </label>
                            )}
                        </div>
                    </div>
                </header>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:border-orange-500/30 transition-all">
                        <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">
                                {project.appropriation ? 'Appropriation' : 'Total Cost (+10%)'}
                            </p>
                            <p className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-none">
                                ₱ {(Number(project.appropriation) || totalWithProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {project.project_type === 'BUILDING' ? (
                        <>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2 hover:border-cyan-500/30 transition-all">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 uppercase font-black">Building Metrics</span>
                                    <Home size={14} className="text-cyan-500" />
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono">₱ {amountPerSqmBuilding.toLocaleString(undefined, { maximumFractionDigits: 0 })}<span className="text-[10px] text-slate-400">/sqm</span></p>
                                    <div className="text-right">
                                        <span className="text-xs font-mono text-cyan-600 font-bold">{floorArea}</span>
                                        <span className="text-[10px] text-slate-400 ml-1">sqm</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2 hover:border-orange-500/30 transition-all">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 uppercase font-black">Carport Metrics</span>
                                    <Car size={14} className="text-orange-500" />
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono">₱ {amountPerSqmCarport.toLocaleString(undefined, { maximumFractionDigits: 0 })}<span className="text-[10px] text-slate-400">/sqm</span></p>
                                    <div className="text-right">
                                        <span className="text-xs font-mono text-orange-600 font-bold">{carportArea}</span>
                                        <span className="text-[10px] text-slate-400 ml-1">sqm</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2 hover:border-emerald-500/30 transition-all">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 uppercase font-black">Infra Metrics</span>
                                <Settings size={14} className="text-emerald-500" />
                            </div>
                            <div className="flex justify-between items-end">
                                <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                                    ₱ {(project.net_length > 0 ? totalConstructionCost / Number(project.net_length) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    <span className="text-[10px] text-slate-400"> / unit</span>
                                </p>
                                <div className="text-right">
                                    <span className="text-xs text-emerald-500 font-mono">{project.net_length || 0}</span>
                                    <span className="text-[10px] text-slate-400 ml-1">meters</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Cost Distribution</span>
                            <span className="text-[9px] font-bold text-emerald-500">{((amountWithoutCarportWithProfit / totalWithProfit) * 100 || 0).toFixed(0)}% Building</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
                            <div className="bg-cyan-500 h-full" style={{ width: `${(amountWithoutCarportWithProfit / totalWithProfit) * 100 || 0}%` }} />
                            <div className="bg-orange-500 h-full" style={{ width: `${(amountOfCarportWithProfit / totalWithProfit) * 100 || 0}%` }} />
                        </div>
                        <div className="flex justify-between text-[8px] mt-1 text-slate-400 font-bold">
                            <span>M: ₱ {(totalMaterialCost * 1.1).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <span>L: ₱ {(totalLaborCost * 1.1).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-3 w-12 text-center">#</th>
                                    <th className="p-3 min-w-[300px]">Description</th>
                                    <th className="p-3 w-20 text-center">Unit</th>
                                    <th className="p-3 w-24 text-center">Qty</th>
                                    <th className="p-3 w-32 text-right">Mat. Unit</th>
                                    <th className="p-3 w-36 text-right text-cyan-600/90">Mat. Total</th>
                                    <th className="p-3 w-32 text-right">Lab. Unit</th>
                                    <th className="p-3 w-36 text-right text-purple-600/90">Lab. Total</th>
                                    <th className="p-3 w-40 text-right text-emerald-600/90 bg-emerald-500/5">Total Amount</th>
                                    <th className="p-3 w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-900 dark:text-slate-100">
                                {filteredItems.map((item, idx) => {
                                    const matTotal = Number(item.material_unit_price) * Number(item.quantity);
                                    const laborTotal = (Number(item.labor_unit_price) || 0) * Number(item.quantity);
                                    const rowTotal = matTotal + laborTotal;
                                    const isExpanded = expandedRows.has(item.id);
                                    const hasComponents = item.components && item.components.length > 0;

                                    return (
                                        <React.Fragment key={item.id}>
                                            <tr
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group transition-colors cursor-pointer"
                                                onClick={() => toggleRow(item.id)}
                                            >
                                                <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {isExpanded ? <ChevronDown size={14} className="text-orange-500" /> : <ChevronRight size={14} />}
                                                        {idx + 1}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className="group-hover:text-cyan-600 transition-colors uppercase tracking-tight">{highlightMatch(item.item_description)}</span>
                                                        {item.is_carport && (
                                                            <span className="text-[9px] bg-orange-500/10 text-orange-600 border border-orange-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 uppercase font-bold tracking-wider">
                                                                <Car size={10} strokeWidth={3} /> Carport
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-center text-slate-500">{item.unit}</td>
                                                <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{item.quantity}</td>
                                                <td className="py-2 px-3 text-right font-mono text-slate-500 tabular-nums">
                                                    {Number(item.material_unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-cyan-700 font-medium bg-cyan-50/50 dark:bg-cyan-900/10 tabular-nums">
                                                    {matTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-slate-500 tabular-nums">
                                                    {Number(item.labor_unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-purple-700 font-medium bg-purple-50/50 dark:bg-purple-900/10 tabular-nums">
                                                    {laborTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold bg-emerald-50/50 dark:bg-emerald-900/10 tabular-nums">
                                                    {rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <td className="py-2 px-3 text-center">
                                                        {!isApproved && (
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                                                                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-cyan-50 text-cyan-400 hover:text-cyan-500 rounded-md transition-all duration-200"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                                                                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-md transition-all duration-200"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </td>
                                            </tr>
                                            {isExpanded && hasComponents && (
                                                <tr className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-700/50">
                                                    <td colSpan={10} className="p-0">
                                                        <div className="pl-14 pr-4 py-3 space-y-2">
                                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                                                                <div className="bg-slate-100/50 dark:bg-slate-900/50 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                        <Calculator size={12} /> Detailed Cost Breakdown
                                                                    </p>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-[10px] text-slate-400">Unit: {item.unit}</span>
                                                                        {!isApproved && (
                                                                            <button
                                                                                onClick={() => setResourceModal({ open: true, mode: 'add', parentItem: item, data: { resource_type: 'MATERIAL', quantity_factor: 1, unit_rate: 0, no_of_persons: 1, hours: 0 } })}
                                                                                className="text-[10px] flex items-center gap-1 font-bold text-cyan-600 hover:text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded transition-colors"
                                                                            >
                                                                                <Plus size={12} /> Add Resource
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <table className="w-full text-xs">
                                                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase text-[9px] font-medium">
                                                                        <tr>
                                                                            <th className="p-2 pl-4 text-left w-24">Type</th>
                                                                            <th className="p-2 text-left">Resource Name</th>
                                                                            <th className="p-2 text-center w-32">Persons/Hours</th>
                                                                            <th className="p-2 text-center w-24">Factor</th>
                                                                            <th className="p-2 text-right w-32">Unit Rate</th>
                                                                            <th className="p-2 text-right w-32 pr-6">Cost/Unit</th>
                                                                            <th className="p-2 w-16"></th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                                        {item.components.map(comp => (
                                                                            <tr key={comp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group/row">
                                                                                <td className="p-2 pl-4">
                                                                                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-16 ${comp.resource_type === 'MATERIAL' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400' :
                                                                                        comp.resource_type === 'LABOR' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' :
                                                                                            'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'
                                                                                        }`}>
                                                                                        {comp.resource_type.substring(0, 3)}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="p-2 text-slate-700 dark:text-slate-300 font-medium">{comp.name}</td>
                                                                                <td className="p-2 text-center font-mono text-slate-500 bg-slate-50 dark:bg-slate-900/30 text-[10px]">
                                                                                    {comp.resource_type !== 'MATERIAL' ?
                                                                                        <span className="opacity-80">{comp.no_of_persons}p × {comp.hours}h</span> :
                                                                                        <span className="opacity-20">--</span>}
                                                                                </td>
                                                                                <td className="p-2 text-center font-mono text-slate-500 tabular-nums text-[10px]">{Number(comp.quantity_factor).toFixed(4)}</td>
                                                                                <td className="p-2 text-right font-mono text-slate-500 tabular-nums">₱ {Number(comp.unit_rate).toLocaleString()}</td>
                                                                                <td className="p-2 text-right pr-6 font-mono font-bold text-slate-900 dark:text-white tabular-nums bg-slate-50/50 dark:bg-slate-900/20">₱ {Number(comp.total_component_cost).toLocaleString()}</td>
                                                                                <td className="p-2 text-center">
                                                                                    {!isApproved && (
                                                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                                                            <button
                                                                                                onClick={() => setResourceModal({ open: true, mode: 'edit', parentItem: item, data: comp })}
                                                                                                className="p-1 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 rounded"
                                                                                            >
                                                                                                <Pencil size={12} />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleDeleteResource(comp)}
                                                                                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                                                            >
                                                                                                <Trash2 size={12} />
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold sticky bottom-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] backdrop-blur-sm">
                                <tr>
                                    <td colSpan={4} className="p-3 text-right text-slate-500 uppercase tracking-widest">Grand Totals</td>
                                    <td className="p-3 text-right text-slate-400 opacity-30 font-mono">---</td>
                                    <td className="p-3 text-right font-mono text-cyan-700 bg-cyan-50/50 dark:bg-cyan-900/10">{totalMaterialCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right text-slate-400 opacity-30 font-mono">---</td>
                                    <td className="p-3 text-right font-mono text-purple-700 bg-purple-50/50 dark:bg-purple-900/10">{totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right font-mono text-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10">{totalConstructionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <AddBoqItemWizard
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    onSubmit={handleWizardSubmit}
                    materials={materials || []}
                    units={units || []}
                />

                <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 shrink-0"><AlertTriangle size={24} /></div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Are you sure you want to delete <span className="font-bold">"{deleteTarget?.item_description}"</span>?</p>
                                <p className="text-xs text-slate-500 leading-relaxed">This action is permanent and cannot be undone.</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleDelete} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 rounded-xl transition-all flex items-center gap-2"><Trash2 size={14} /> Delete Item</button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Item Modal */}
                <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit BOQ Item">
                    <form onSubmit={handleUpdateItem} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Description</label>
                            <input
                                type="text"
                                required
                                value={editItem?.item_description || ''}
                                onChange={e => setEditItem({ ...editItem, item_description: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Unit</label>
                                <input
                                    type="text"
                                    required
                                    value={editItem?.unit || ''}
                                    onChange={e => setEditItem({ ...editItem, unit: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Quantity</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    required
                                    value={editItem?.quantity || ''}
                                    onChange={e => setEditItem({ ...editItem, quantity: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>
                        {editItem?.components && editItem.components.length === 0 && (
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Mat. Unit Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editItem?.material_unit_price || ''}
                                        onChange={e => setEditItem({ ...editItem, material_unit_price: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Lab. Unit Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editItem?.labor_unit_price || ''}
                                        onChange={e => setEditItem({ ...editItem, labor_unit_price: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="isCarport"
                                checked={editItem?.is_carport || false}
                                onChange={e => setEditItem({ ...editItem, is_carport: e.target.checked })}
                                className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-800"
                            />
                            <label htmlFor="isCarport" className="text-sm font-medium text-slate-700 dark:text-slate-300">Is Carport Area?</label>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-bold uppercase text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-lg shadow-cyan-600/20">Save Changes</button>
                        </div>
                    </form>
                </Modal>

                {/* Resource Modal */}
                <Modal isOpen={resourceModal.open} onClose={() => setResourceModal({ ...resourceModal, open: false })} title={`${resourceModal.mode === 'add' ? 'Add' : 'Edit'} Resource`}>
                    <form onSubmit={handleResourceSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Resource Type</label>
                            <select
                                value={resourceModal.data?.resource_type || 'MATERIAL'}
                                onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, resource_type: e.target.value } })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                            >
                                <option value="MATERIAL">MATERIAL</option>
                                <option value="LABOR">LABOR</option>
                                <option value="EQUIPMENT">EQUIPMENT</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Name / Description</label>
                            <input
                                type="text"
                                required
                                value={resourceModal.data?.name || ''}
                                onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, name: e.target.value } })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Unit Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={resourceModal.data?.unit_rate || ''}
                                    onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, unit_rate: e.target.value } })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                                    {resourceModal.data?.resource_type === 'MATERIAL' ? 'Quantity Factor' : 'No. of Persons'}
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    required
                                    value={resourceModal.data?.resource_type === 'MATERIAL' ? (resourceModal.data?.quantity_factor || '') : (resourceModal.data?.no_of_persons || '')}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (resourceModal.data?.resource_type === 'MATERIAL') {
                                            setResourceModal({ ...resourceModal, data: { ...resourceModal.data, quantity_factor: val } });
                                        } else {
                                            setResourceModal({ ...resourceModal, data: { ...resourceModal.data, no_of_persons: val } });
                                        }
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        {resourceModal.data?.resource_type !== 'MATERIAL' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Hours</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={resourceModal.data?.hours || ''}
                                    onChange={e => setResourceModal({ ...resourceModal, data: { ...resourceModal.data, hours: e.target.value } })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setResourceModal({ ...resourceModal, open: false })} className="px-4 py-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-bold uppercase text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-lg shadow-cyan-600/20">Save</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
