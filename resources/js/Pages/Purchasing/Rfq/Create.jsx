import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export default function CreateRfq() {
    const { materials } = usePage().props;
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [items, setItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [newItem, setNewItem] = useState({ material_name: '', quantity: 0, unit: '' });

    const handleMaterialSelect = (e) => {
        const mat = (materials || []).find(m => m.name === e.target.value);
        if (mat) setNewItem({ ...newItem, material_name: mat.name, unit: mat.unit || '' });
    };

    const handleAddItem = () => {
        if (!newItem.material_name) return;
        setItems([...items, newItem]);
        setNewItem({ material_name: '', quantity: 0, unit: '' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (items.length === 0) return;
        setSubmitting(true);
        router.post('/purchasing/rfq', { title, due_date: dueDate, items }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create RFQ" />
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <header className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <Link href="/purchasing/rfq" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New RFQ</h1>
                        <p className="text-slate-500">Request pricing from suppliers.</p>
                    </div>
                </header>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">RFQ Title</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Due Date</label>
                            <input type="date" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Items Required</h2>
                        <div className="flex gap-2 items-end bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 mb-1 block font-bold">Material</label>
                                <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white" value={newItem.material_name} onChange={handleMaterialSelect}>
                                    <option value="">Select Material...</option>
                                    {(materials || []).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="text-xs text-slate-500 mb-1 block font-bold">Qty</label>
                                <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono" value={newItem.quantity || ''} onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })} />
                            </div>
                            <div className="w-24">
                                <label className="text-xs text-slate-500 mb-1 block font-bold">Unit</label>
                                <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} />
                            </div>
                            <button type="button" onClick={handleAddItem} className="bg-pink-600 hover:bg-pink-500 text-white p-2.5 rounded-lg"><Plus size={20} /></button>
                        </div>
                        <div className="space-y-2">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-900 dark:text-white font-medium">{item.material_name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-500 text-sm font-mono">{item.quantity} {item.unit}</span>
                                        <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={submitting || items.length === 0} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                            <Save size={18} /> Save & Open RFQ
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
