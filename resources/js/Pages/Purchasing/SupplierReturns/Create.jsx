import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, AlertTriangle } from 'lucide-react';

const REASONS = [
    'Wrong item delivered (not as per PO)',
    'Wrong specifications / brand',
    'Damaged upon delivery',
    'Quantity over-shipped',
    'Defective item',
    'Other',
];

export default function SupplierReturnCreate() {
    const { projects, suppliers, purchaseOrder } = usePage().props;

    const [form, setForm] = useState({
        project_id: purchaseOrder?.project_id ?? '',
        supplier_id: purchaseOrder?.supplier_id ?? '',
        purchase_order_id: purchaseOrder?.id ?? '',
        reason: '',
        remarks: '',
        items: purchaseOrder?.items?.map(i => ({
            purchase_order_item_id: i.id,
            material_name: i.material_name,
            unit: i.unit,
            quantity: '',
            unit_price: i.unit_price ?? 0,
            notes: '',
        })) ?? [{ purchase_order_item_id: '', material_name: '', unit: '', quantity: '', unit_price: 0, notes: '' }],
    });

    const [processing, setProcessing] = useState(false);

    const updateItem = (idx, field, value) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
        }));
    };

    const addItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { purchase_order_item_id: '', material_name: '', unit: '', quantity: '', unit_price: 0, notes: '' }],
        }));
    };

    const removeItem = (idx) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/purchasing/supplier-returns', form, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="New Supplier Return" />
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <Link href="/purchasing/supplier-returns" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Supplier Return</h1>
                        <p className="text-slate-500 text-sm">Return wrong or damaged items back to the supplier.</p>
                    </div>
                </header>

                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-rose-700 dark:text-rose-400">
                        Submitting this return will immediately <strong>deduct</strong> the selected items from the project&apos;s site inventory.
                        A new Purchase Request/Order will be needed to procure the correct items.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header info */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                        <h2 className="text-xs text-slate-500 uppercase font-bold tracking-widest">Return Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project *</label>
                                <select value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))} required
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                    <option value="">Select project…</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                                <select value={form.supplier_id} onChange={e => setForm(p => ({ ...p, supplier_id: e.target.value }))}
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                    <option value="">— Select supplier —</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for Return *</label>
                            <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} required
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                <option value="">— Choose reason —</option>
                                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Additional Remarks</label>
                            <textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} rows={2}
                                placeholder="Optional notes…"
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none" />
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs text-slate-500 uppercase font-bold tracking-widest">Items to Return</h2>
                            {!purchaseOrder && (
                                <button type="button" onClick={addItem} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-500">
                                    <Plus size={14} /> Add Item
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {form.items.map((item, idx) => (
                                <div key={idx} className="border border-slate-100 dark:border-slate-700 rounded-lg p-4 grid grid-cols-12 gap-2">
                                    <div className="col-span-4">
                                        <label className="text-xs text-slate-400 mb-1 block">Material Name *</label>
                                        <input value={item.material_name}
                                            onChange={e => updateItem(idx, 'material_name', e.target.value)}
                                            readOnly={!!purchaseOrder}
                                            required
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white read-only:opacity-70" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-slate-400 mb-1 block">Unit *</label>
                                        <input value={item.unit}
                                            onChange={e => updateItem(idx, 'unit', e.target.value)}
                                            readOnly={!!purchaseOrder}
                                            required
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white read-only:opacity-70" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-slate-400 mb-1 block">Return Qty *</label>
                                        <input type="number" min="0.01" step="0.01" value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                            required
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-slate-400 mb-1 block">Unit Price</label>
                                        <input type="number" min="0" step="0.01" value={item.unit_price}
                                            onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                                    </div>
                                    <div className="col-span-1 flex items-end justify-center">
                                        {!purchaseOrder && form.items.length > 1 && (
                                            <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="col-span-12">
                                        <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                                        <input value={item.notes}
                                            onChange={e => updateItem(idx, 'notes', e.target.value)}
                                            placeholder="e.g. Wrong brand received"
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/purchasing/supplier-returns" className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                            Cancel
                        </Link>
                        <button type="submit" disabled={processing}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                            {processing ? 'Submitting…' : 'Submit Return Request'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
