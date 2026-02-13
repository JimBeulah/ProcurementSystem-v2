import React, { useState, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import {
    ClipboardList, Plus, Search, Trash2, ChevronDown, ChevronRight, Upload
} from 'lucide-react';

export default function ProjectBoq() {
    const { project, boqItems: initialItems } = usePage().props;
    const boqItems = initialItems || [];

    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        item_description: '', unit: '', quantity: '',
        material_unit_price: '', labor_unit_price: '', is_carport: false,
    });

    const resetForm = () => setFormData({ item_description: '', unit: '', quantity: '', material_unit_price: '', labor_unit_price: '', is_carport: false });

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(`/projects/${project.id}/boq`, {
            ...formData,
            quantity: Number(formData.quantity),
            material_unit_price: Number(formData.material_unit_price) || 0,
            labor_unit_price: Number(formData.labor_unit_price) || 0,
        }, {
            onSuccess: () => { setShowModal(false); resetForm(); },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleDelete = (itemId) => {
        if (!confirm('Delete this BOQ item?')) return;
        router.delete(`/projects/${project.id}/boq/${itemId}`);
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const filtered = boqItems.filter(item =>
        item.item_description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculations
    const totalMaterial = boqItems.reduce((s, i) => s + (Number(i.material_unit_price) * Number(i.quantity)), 0);
    const totalLabor = boqItems.reduce((s, i) => s + (Number(i.labor_unit_price) * Number(i.quantity)), 0);
    const grandTotal = totalMaterial + totalLabor;

    const highlightMatch = (text) => {
        if (!searchTerm) return text;
        const idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
        if (idx === -1) return text;
        return <>{text.slice(0, idx)}<mark className="bg-yellow-300/30 text-yellow-200 rounded px-0.5">{text.slice(idx, idx + searchTerm.length)}</mark>{text.slice(idx + searchTerm.length)}</>;
    };

    return (
        <AuthenticatedLayout>
            <Head title={`BOQ - ${project.name}`} />
            <div className="p-4 space-y-4 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Link href="/projects" className="hover:text-cyan-600 transition-colors">Projects</Link>
                    <span>/</span>
                    <Link href={`/projects/${project.id}`} className="hover:text-cyan-600 transition-colors">{project.name}</Link>
                    <span>/</span>
                    <span className="text-slate-900 dark:text-white font-medium">BOQ</span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500"><ClipboardList size={20} /></div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Items</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{boqItems.length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Material Cost</p>
                        <p className="text-xl font-black text-cyan-600 font-mono">₱ {totalMaterial.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Labor Cost</p>
                        <p className="text-xl font-black text-blue-600 font-mono">₱ {totalLabor.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 border-l-4 border-l-emerald-500">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Grand Total</p>
                        <p className="text-xl font-black text-emerald-600 font-mono">₱ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="text" placeholder="Search items..." className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-slate-900 dark:text-white text-xs focus:border-orange-500/50 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                {/* BOQ Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 w-8"></th>
                                    <th className="p-3 min-w-[250px]">Item Description</th>
                                    <th className="p-3 text-center">Unit</th>
                                    <th className="p-3 text-center">Qty</th>
                                    <th className="p-3 text-right">Mat. Unit</th>
                                    <th className="p-3 text-right">Mat. Total</th>
                                    <th className="p-3 text-right">Lab. Unit</th>
                                    <th className="p-3 text-right">Lab. Total</th>
                                    <th className="p-3 text-right">Total</th>
                                    <th className="p-3 text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                                {filtered.map(item => {
                                    const matTotal = Number(item.material_unit_price) * Number(item.quantity);
                                    const labTotal = Number(item.labor_unit_price) * Number(item.quantity);
                                    const rowTotal = matTotal + labTotal;
                                    const hasComponents = item.components && item.components.length > 0;
                                    const isExpanded = expandedRows.has(item.id);

                                    return (
                                        <React.Fragment key={item.id}>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group transition-colors">
                                                <td className="p-3 text-center">
                                                    {hasComponents && (
                                                        <button onClick={() => toggleRow(item.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="p-3 font-medium text-slate-900 dark:text-white">
                                                    {highlightMatch(item.item_description)}
                                                    {item.is_carport && <span className="ml-2 text-[8px] bg-orange-500/10 text-orange-500 border border-orange-500/20 px-1 py-0.5 rounded font-black uppercase">Carport</span>}
                                                </td>
                                                <td className="p-3 text-center text-slate-500 uppercase">{item.unit}</td>
                                                <td className="p-3 text-center font-mono text-cyan-600">{Number(item.quantity).toLocaleString()}</td>
                                                <td className="p-3 text-right font-mono text-slate-500 text-[11px] italic">{Number(item.material_unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">{matTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right font-mono text-slate-500 text-[11px] italic">{Number(item.labor_unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">{labTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right font-mono text-emerald-600 font-bold">{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                                                </td>
                                            </tr>
                                            {/* Expanded Components */}
                                            {isExpanded && hasComponents && item.components.map(comp => (
                                                <tr key={comp.id} className="bg-slate-50/50 dark:bg-slate-900/30">
                                                    <td className="p-2"></td>
                                                    <td className="p-2 pl-8 text-[10px] text-slate-500">
                                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black mr-2 ${comp.resource_type === 'MATERIAL' ? 'bg-cyan-500/10 text-cyan-600' : comp.resource_type === 'LABOR' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'}`}>{comp.resource_type}</span>
                                                        {comp.name}
                                                    </td>
                                                    <td className="p-2 text-center text-[10px] text-slate-400">{comp.unit || '-'}</td>
                                                    <td className="p-2 text-center text-[10px] font-mono text-slate-400">{comp.quantity_factor}</td>
                                                    <td colSpan={5} className="p-2 text-right text-[10px] font-mono text-slate-400">₱ {Number(comp.unit_rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td></td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={10} className="p-20 text-center text-slate-400 uppercase text-xs tracking-widest font-bold">
                                        <ClipboardList size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                        No BOQ items found
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Item Modal */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add BOQ Item">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Item Description</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none" value={formData.item_description} onChange={e => setFormData({ ...formData, item_description: e.target.value })} required placeholder="e.g. Portland Cement Type I" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Unit</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} required placeholder="bags, cu.m, pcs" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Quantity</label>
                                <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none font-mono" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-cyan-600 uppercase font-black mb-1 block tracking-widest">Material Unit Price</label>
                                <input type="number" step="0.01" className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none font-mono" value={formData.material_unit_price} onChange={e => setFormData({ ...formData, material_unit_price: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-blue-600 uppercase font-black mb-1 block tracking-widest">Labor Unit Price</label>
                                <input type="number" step="0.01" className="w-full bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none font-mono" value={formData.labor_unit_price} onChange={e => setFormData({ ...formData, labor_unit_price: e.target.value })} />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-orange-500 focus:ring-orange-500" checked={formData.is_carport} onChange={e => setFormData({ ...formData, is_carport: e.target.checked })} />
                            This item is for Carport area
                        </label>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest">Cancel</button>
                            <button type="submit" disabled={submitting} className="bg-orange-600 px-6 py-2 rounded-lg text-white font-black text-xs uppercase tracking-widest hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all active:scale-95 disabled:opacity-50">Add Item</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
