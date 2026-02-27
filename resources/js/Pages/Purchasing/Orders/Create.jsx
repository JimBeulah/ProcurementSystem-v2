import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, Search, Plus, X, Package, AlertTriangle, CheckCircle, Warehouse } from 'lucide-react';

export default function CreatePurchaseOrder() {
    const { projects, suppliers, materials, rfqId, quoteId, purchaseRequest, inventoryMatches = {} } = usePage().props;
    const hasInventoryMatches = Object.keys(inventoryMatches).length > 0;
    const [dismissedMatches, setDismissedMatches] = useState({});


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
                    {/* Smart Inventory Match Panel */}
                    {hasInventoryMatches && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-500/30 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                <Warehouse size={18} />
                                <span className="font-bold text-sm">Warehouse Stock Available</span>
                                <span className="text-xs font-normal opacity-70 ml-1">— Some requested items are in stock. Review before creating a PO.</span>
                            </div>
                            {Object.entries(inventoryMatches).map(([itemName, data]) => {
                                if (dismissedMatches[itemName]) return null;
                                const totalStock = data.stock.reduce((sum, s) => sum + parseFloat(s.quantity), 0);
                                return (
                                    <div key={itemName} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/20 rounded-lg px-4 py-3 gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">{itemName}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                Requested: <span className="font-bold text-slate-700 dark:text-slate-300">{data.requested_qty} {data.unit}</span>
                                                &nbsp;&bull;&nbsp;
                                                In Warehouse: <span className="font-bold text-emerald-600">{totalStock.toFixed(2)} {data.unit}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const useQty = Math.min(totalStock, data.requested_qty);
                                                    setItems(prev => {
                                                        const newItems = [];
                                                        prev.forEach(it => {
                                                            if (it.material_name === itemName) {
                                                                const remaining = Math.max(0, it.quantity - useQty);
                                                                if (remaining > 0) {
                                                                    newItems.push({ ...it, quantity: remaining });
                                                                }
                                                                newItems.push({
                                                                    ...it,
                                                                    quantity: useQty,
                                                                    unit_price: 0,
                                                                    description: `Sourced from Warehouse`
                                                                });
                                                            } else {
                                                                newItems.push(it);
                                                            }
                                                        });
                                                        return newItems;
                                                    });
                                                    setDismissedMatches(d => ({ ...d, [itemName]: true }));
                                                }}
                                                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95"
                                            >
                                                <CheckCircle size={13} /> Use from Warehouse
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDismissedMatches(d => ({ ...d, [itemName]: true }))}
                                                className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1.5 rounded-lg transition-colors"
                                            >
                                                Ignore
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

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
                            <select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none" value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}>
                                <option value="">None (Internal Fulfill / Optional)</option>
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
                                {items.map((item, idx) => {
                                    const isWarehouse = item.description === 'Sourced from Warehouse';
                                    return (
                                        <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${isWarehouse ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-slate-900 dark:text-white font-medium">{item.material_name}</div>
                                                    {isWarehouse && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-md">
                                                            <Warehouse size={10} /> Internal
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400">{item.description}</div>
                                            </td>
                                            <td className="p-3 text-right font-mono">{item.quantity}</td>
                                            <td className="p-3 text-right font-mono text-slate-400">
                                                {isWarehouse ? '—' : item.unit_price.toLocaleString()}
                                            </td>
                                            <td className={`p-3 text-right font-mono font-bold ${isWarehouse ? 'text-slate-400' : 'text-emerald-600'}`}>
                                                {isWarehouse ? '—' : (item.quantity * item.unit_price).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right">
                                                <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {items.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 text-sm">No items added yet. Search products above to add.</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                                <tr>
                                    <td colSpan={3} className="p-3 text-right uppercase text-xs tracking-widest">Grand Total</td>
                                    <td className="p-3 text-right text-emerald-600 text-lg font-mono">
                                        {items.filter(i => i.description !== 'Sourced from Warehouse').reduce((sum, i) => sum + (i.quantity * i.unit_price), 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || items.length === 0}
                            className={`${items.every(i => i.description === 'Sourced from Warehouse') ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'} text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors active:scale-95 disabled:opacity-50 shadow-lg`}
                        >
                            <Save size={18} />
                            {items.length > 0 && items.every(i => i.description === 'Sourced from Warehouse') ? 'Process Internal Release Only' : 'Issue Purchase Order'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
