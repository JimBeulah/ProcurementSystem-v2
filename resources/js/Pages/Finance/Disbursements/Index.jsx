import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { CreditCard, Plus, ArrowUpRight, Save } from 'lucide-react';
import Modal from '@/Components/ui/Modal';
import Combobox from '@/Components/ui/Combobox';

export default function DisbursementsIndex() {
    const { payments, orders, users } = usePage().props;
    const list = payments || [];
    const poList = orders || [];
    const userList = users || [];

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [poId, setPoId] = useState('');
    const [receivedById, setReceivedById] = useState('');
    const [amount, setAmount] = useState(0);
    const [method, setMethod] = useState('CHECK');
    const [reference, setReference] = useState('');

    useEffect(() => {
        if (poId) {
            const po = poList.find(p => p.id === Number(poId));
            if (po) setAmount(Number(po.total_amount));
        }
    }, [poId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('finance.disbursements.store'), {
            purchase_order_id: poId ? Number(poId) : null,
            received_by_id: receivedById ? Number(receivedById) : null,
            amount,
            method,
            reference_number: reference,
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setPoId('');
                setReceivedById('');
                setAmount(0);
                setMethod('CHECK');
                setReference('');
            }
        });
    };

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-red-500";

    return (
        <AuthenticatedLayout>
            <Head title="Disbursements" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <CreditCard className="text-red-500" /> Disbursements
                        </h1>
                        <p className="text-slate-500">Track outgoing payments and releases.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors">
                        <Plus size={18} /> Process Payment
                    </button>
                </header>

                <div className="grid gap-4">
                    {list.map(pay => (
                        <div key={pay.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
                                    <ArrowUpRight size={24} />
                                </div>
                                <div>
                                    <div className="text-slate-900 dark:text-white font-bold text-lg">
                                        ₱{Number(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-slate-500">Paid via {pay.method} • Ref: {pay.reference_number}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {pay.purchase_order ? `For PO-${pay.purchase_order.id} (${pay.purchase_order.supplier?.name})` : 'Direct Payment'}
                                        {pay.received_by && <span> • Received by: {pay.received_by.name}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600">{pay.status}</span>
                                <div className="text-xs text-slate-500 mt-2">{new Date(pay.payment_date).toLocaleDateString()}</div>
                            </div>
                        </div>
                    ))}
                    {list.length === 0 && (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            No disbursements recorded.
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Process Payment" maxWidth="max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Link Purchase Order</label>
                        <Combobox
                            value={poId}
                            onChange={(val) => setPoId(val)}
                            options={[{ value: '', label: 'Select PO...' }, ...poList.map(o => ({
                                value: String(o.id),
                                label: `PO-${o.id} - ${o.supplier?.name} (${Number(o.total_amount).toLocaleString()})`
                            }))]}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Received By <span className="text-slate-400 font-normal">(Procurement Officer / Employee)</span></label>
                        <Combobox
                            value={receivedById}
                            onChange={(val) => setReceivedById(val)}
                            options={[{ value: '', label: 'Select receiver (optional)...' }, ...userList.map(u => ({
                                value: String(u.id),
                                label: u.name
                            }))]}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Payment Amount</label>
                        <input type="number" step="0.01" className={`${inputCls} font-mono text-lg`} value={amount} onChange={e => setAmount(parseFloat(e.target.value))} required />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Payment Method</label>
                        <select className={inputCls} value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="CHECK">Check</option>
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="GCASH">GCash</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Reference / Check No.</label>
                        <input className={inputCls} value={reference} onChange={e => setReference(e.target.value)} required placeholder="e.g. C-123456" />
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 w-full justify-center transition-colors">
                            <Save size={18} /> Process Disbursement
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
