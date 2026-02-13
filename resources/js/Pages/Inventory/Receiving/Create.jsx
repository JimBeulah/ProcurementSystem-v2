import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ArrowLeft, CheckSquare } from 'lucide-react';

export default function ReceivingCreate() {
    const { orders } = usePage().props;
    const poList = orders || [];

    const [selectedPoId, setSelectedPoId] = useState('');
    const [poDetails, setPoDetails] = useState(null);
    const [items, setItems] = useState([]);
    const [deliveryNote, setDeliveryNote] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!selectedPoId) { setPoDetails(null); setItems([]); return; }
        const po = poList.find(p => p.id === Number(selectedPoId));
        if (po) {
            setPoDetails(po);
            setItems((po.items || []).map(i => ({
                material_name: i.material_name,
                quantity_ordered: Number(i.quantity),
                quantity_received: Number(i.quantity),
                status: 'GOOD',
            })));
        }
    }, [selectedPoId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedPoId) return;
        router.post(route('receiving.store'), {
            purchase_order_id: Number(selectedPoId),
            delivery_note_no: deliveryNote,
            notes,
            items: items.map(i => ({ material_name: i.material_name, quantity_received: i.quantity_received, status: i.status })),
        });
    };

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500";

    return (
        <AuthenticatedLayout>
            <Head title="Receive Goods" />
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <header className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <Link href={route('receiving.index')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Receive Goods</h1>
                        <p className="text-slate-500">Record delivery against Purchase Order.</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Select Purchase Order</label>
                            <select className={inputCls} value={selectedPoId} onChange={e => setSelectedPoId(e.target.value)} required>
                                <option value="">Select PO...</option>
                                {poList.map(po => (
                                    <option key={po.id} value={po.id}>PO-{po.id.toString().padStart(4, '0')} — {po.supplier?.name}</option>
                                ))}
                            </select>
                        </div>

                        {poDetails && (
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Delivery Note / Ref #</label>
                                    <input className={inputCls} value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} placeholder="e.g. DR-12345" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Received Date</label>
                                    <input type="date" className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} disabled />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Notes</label>
                                    <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {poDetails && items.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Items to Receive</h2>
                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                                        <div className="flex-1">
                                            <div className="text-slate-900 dark:text-white font-medium">{item.material_name}</div>
                                            <div className="text-xs text-slate-500">Ordered: {item.quantity_ordered}</div>
                                        </div>
                                        <div className="w-32">
                                            <label className="text-xs text-slate-500 block mb-1">Received Qty</label>
                                            <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 font-mono text-center text-slate-900 dark:text-white"
                                                value={item.quantity_received}
                                                onChange={e => { const n = [...items]; n[idx].quantity_received = parseFloat(e.target.value); setItems(n); }}
                                                min="0" max={item.quantity_ordered} />
                                        </div>
                                        <div className="w-32">
                                            <label className="text-xs text-slate-500 block mb-1">Status</label>
                                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm text-slate-900 dark:text-white"
                                                value={item.status}
                                                onChange={e => { const n = [...items]; n[idx].status = e.target.value; setItems(n); }}>
                                                <option value="GOOD">Good</option>
                                                <option value="DAMAGED">Damaged</option>
                                                <option value="WRONG_ITEM">Wrong Item</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button type="submit" disabled={!selectedPoId} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-colors">
                            <CheckSquare size={18} /> Confirm Receipt
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
