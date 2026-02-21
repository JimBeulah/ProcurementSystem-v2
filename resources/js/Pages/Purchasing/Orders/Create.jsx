import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, Search, Plus, X } from 'lucide-react';

export default function CreatePurchaseOrder() {
    const { projects, suppliers, materials, rfqId, quoteId, purchaseRequest } = usePage().props;

    const [formData, setFormData] = useState({
        project_id: purchaseRequest?.project_id || '',
        supplier_id: '',
        remarks: purchaseRequest ? `PO for PR-${purchaseRequest.id.toString().padStart(5, '0')}` : '',
        purchase_request_id: purchaseRequest?.id || null
    });

    // Auto-fill items if PR exists
    const [items, setItems] = useState(() => {
        if (purchaseRequest?.items) {
            return purchaseRequest.items.map(item => ({
                material_name: item.item_description,
                description: 'From PR',
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.estimated_unit_cost || 0
            }));
        }
        return [];
    });

    const [submitting, setSubmitting] = useState(false);

    // Item Entry
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const [newItem, setNewItem] = useState({ material_name: '', description: '', quantity: 0, unit_price: 0, unit: 'pcs' });

    const filteredMaterials = searchTerm
        ? (materials || []).filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase()))).slice(0, 10)
        : [];

    useEffect(() => {
        function handler(e) {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelectMaterial = (mat) => {
        setNewItem({ ...newItem, material_name: mat.name, unit: mat.unit || 'pcs', description: mat.description || '' });
        setSearchTerm(mat.name);
        setShowResults(false);
    };

    const handleAddItem = () => {
        if (!newItem.material_name || newItem.quantity <= 0) return;
        setItems([...items, newItem]);
        setNewItem({ material_name: '', description: '', quantity: 0, unit_price: 0, unit: 'pcs' });
        setSearchTerm('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (items.length === 0) return;
        setSubmitting(true);
        router.post('/purchasing/orders', { ...formData, items }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Purchase Order" />
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <header className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <Link href="/purchasing/orders" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Create Purchase Order
                            {purchaseRequest && (
                                <span className="text-xs bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-full border border-blue-500/20 font-mono">
                                    From PR-{purchaseRequest.id.toString().padStart(5, '0')}
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500">Issue a new order to supplier.</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Project</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none" value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })} required>
                                <option value="">Select Project...</option>
                                {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <label className="text-xs text-slate-500 uppercase font-bold tracking-widest">Supplier</label>
                                <Link href="/purchasing/suppliers" className="text-[10px] text-blue-500 hover:text-blue-600 font-bold uppercase tracking-wider">
                                    + Add New
                                </Link>
                            </div>
                            <select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none" value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })} required>
                                <option value="">Select Supplier...</option>
                                {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Remarks / Delivery Instructions</label>
                            <textarea className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white h-20 focus:border-blue-500 outline-none" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Order Items</h2>

                        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-5 relative" ref={searchRef}>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Search Product</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 p-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Search by name or code..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} />
                                </div>
                                {showResults && searchTerm && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                        {filteredMaterials.length > 0 ? filteredMaterials.map(mat => (
                                            <button key={mat.id} type="button" onClick={() => handleSelectMaterial(mat)} className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                                                <span className="text-slate-900 dark:text-white font-medium">{mat.name}</span>
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="text-xs text-slate-500">{mat.code}</span>
                                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">{mat.category || 'N/A'}</span>
                                                </div>
                                            </button>
                                        )) : (
                                            <div className="p-4 text-center text-slate-500 text-sm">No materials found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Qty</label>
                                <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono" value={newItem.quantity || ''} onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })} />
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Unit Price</label>
                                <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono" value={newItem.unit_price || ''} onChange={e => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) })} />
                            </div>
                            <div className="col-span-2">
                                <button type="button" onClick={handleAddItem} disabled={!newItem.material_name || newItem.quantity <= 0} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-colors active:scale-95">
                                    <Plus size={18} /> Add
                                </button>
                            </div>
                        </div>

                        <table className="w-full text-left text-sm text-slate-500">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-3">Material</th>
                                    <th className="p-3 text-right">Qty</th>
                                    <th className="p-3 text-right">Unit Price</th>
                                    <th className="p-3 text-right">Total</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3">
                                            <div className="text-slate-900 dark:text-white font-medium">{item.material_name}</div>
                                            <div className="text-xs text-slate-400">{item.description}</div>
                                        </td>
                                        <td className="p-3 text-right font-mono">{item.quantity}</td>
                                        <td className="p-3 text-right font-mono">{item.unit_price.toLocaleString()}</td>
                                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">{(item.quantity * item.unit_price).toLocaleString()}</td>
                                        <td className="p-3 text-right">
                                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 transition-colors">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 text-sm">No items added yet. Search products above to add.</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                                <tr>
                                    <td colSpan={3} className="p-3 text-right uppercase text-xs tracking-widest">Grand Total</td>
                                    <td className="p-3 text-right text-emerald-600 text-lg font-mono">
                                        {items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={submitting || items.length === 0} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20">
                            <Save size={18} /> Issue Purchase Order
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
