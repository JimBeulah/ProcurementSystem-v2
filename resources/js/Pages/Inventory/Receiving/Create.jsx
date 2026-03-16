import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, PackageCheck } from 'lucide-react';

export default function CreateReceiving() {
    const { purchaseOrders, selectedPoId } = usePage().props;

    const [selectedPo, setSelectedPo] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (selectedPoId) {
            handlePoChange(selectedPoId.toString());
        }
    }, [selectedPoId]);

    const handlePoChange = (id) => {
        setSelectedPo(id);
        const po = purchaseOrders.find(p => p.id.toString() === id);
        if (po && po.items) {
            setItems(po.items.map(item => ({
                id: item.id,
                material_name: item.material_name,
                description: item.description || '',
                ordered_quantity: item.quantity,
                unit_price: item.unit_price,
                unit: item.unit,
                quantity_received: item.quantity, // default to full receipt
                status: 'ACCEPTED'
            })));
        } else {
            setItems([]);
        }
    };

    const toggleReject = (idx) => {
        const newItems = [...items];
        newItems[idx].status = newItems[idx].status === 'REJECTED' ? 'ACCEPTED' : 'REJECTED';
        setItems(newItems);
    };

    const handleQuantityChange = (idx, value) => {
        const newItems = [...items];
        newItems[idx].quantity_received = value === '' ? '' : Number(value);
        setItems(newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Valid items are those with quantity > 0 OR those explicitly rejected 
        // (if they reject it, they still need to record the qty received/rejected)
        const validItems = items.filter(i => i.quantity_received > 0 || i.status === 'REJECTED');
        if (!selectedPo || validItems.length === 0) return;

        setSubmitting(true);
        router.post('/inventory/receiving', {
            purchase_order_id: selectedPo,
            delivery_note_no: deliveryNote,
            notes: notes,
            items: validItems
        }, {
            onFinish: () => setSubmitting(false),
        });
    };

    const currentPoObj = purchaseOrders.find(p => p.id.toString() === selectedPo);

    return (
        <AuthenticatedLayout>
            <Head title="Receive Goods" />
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <header className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <Link href="/inventory/receiving" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Receive Goods (GRN)
                        </h1>
                        <p className="text-slate-500">Log deliveries from a Purchase Order into central inventory.</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Select Purchase Order</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                                value={selectedPo}
                                onChange={e => handlePoChange(e.target.value)}
                                required
                            >
                                <option value="">Select PO...</option>
                                {(purchaseOrders || []).map(p => (
                                    <option key={p.id} value={p.id}>
                                        PO-{p.id.toString().padStart(4, '0')} — {p.supplier?.name}
                                    </option>
                                ))}
                            </select>
                            {currentPoObj && (
                                <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-500/20 font-medium">
                                    Supplier: {currentPoObj.supplier?.name}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Delivery Note No. (Optional)</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                                value={deliveryNote}
                                onChange={e => setDeliveryNote(e.target.value)}
                                placeholder="e.g. DR-2026-9012"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Receiving Notes / Quality Issues</label>
                            <textarea
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white h-20 focus:border-blue-500 outline-none"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Any damaged items or specific locations placed..."
                            />
                        </div>
                    </div>

                    {selectedPo && items.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <PackageCheck className="text-orange-500" size={20} /> Verify Delivered Items
                            </h2>

                            <table className="w-full text-left text-sm text-slate-500">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="p-3">Material</th>
                                        <th className="p-3 text-center">Ordered Qty</th>
                                        <th className="p-3">Received Qty</th>
                                        <th className="p-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className={`transition-colors ${item.status === 'REJECTED' ? 'bg-rose-50/50 dark:bg-rose-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                                            <td className="p-3">
                                                <div className={`font-medium transition-all ${item.status === 'REJECTED' ? 'text-rose-500 line-through opacity-60' : 'text-slate-900 dark:text-white'}`}>{item.material_name}</div>
                                                <div className="text-xs text-slate-400">{item.description}</div>
                                            </td>
                                            <td className="p-3 text-center font-mono text-xs">
                                                {item.ordered_quantity} <span className="text-[10px] text-slate-400 uppercase">{item.unit}</span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2 max-w-[180px]">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        max={item.ordered_quantity}
                                                        disabled={item.status === 'REJECTED'}
                                                        className={`w-full bg-white dark:bg-slate-900 border ${item.status === 'REJECTED' ? 'border-transparent' : item.quantity_received < item.ordered_quantity ? 'border-amber-500 focus:border-amber-500 shadow-sm shadow-amber-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'} rounded-lg p-2 text-slate-900 dark:text-white font-mono font-bold text-center disabled:opacity-30`}
                                                        value={item.quantity_received}
                                                        onChange={e => handleQuantityChange(idx, e.target.value)}
                                                    />
                                                    <span className="text-slate-400 uppercase text-[10px] font-bold w-10">{item.unit}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleReject(idx)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                                                        ${item.status === 'REJECTED'
                                                            ? 'bg-rose-600 border-rose-600 text-white'
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-200'
                                                        }`}
                                                >
                                                    {item.status === 'REJECTED' ? 'REJECTED' : 'REJECT'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg text-xs text-orange-800 dark:text-orange-400 flex gap-2">
                                <span className="font-bold uppercase tracking-widest items-center flex">Inventory Intel:</span>
                                <span>Saving this form will officially add these exact quantities directly into the Main Warehouse Stock, allowing the Site Engineer to pull from them instantly.</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button type="submit" disabled={submitting || !selectedPo || items.length === 0} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 text-sm transition-colors active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-600/20">
                            <Save size={18} /> Confirm Receipt & Add to Inventory
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
