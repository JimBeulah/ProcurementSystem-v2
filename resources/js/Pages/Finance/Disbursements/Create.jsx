import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function DisbursementCreate() {
    const { orders } = usePage().props;
    const poList = orders || [];

    const [poId, setPoId] = useState('');
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
            amount,
            method,
            reference_number: reference,
        });
    };

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500";

    return (
        <AuthenticatedLayout>
            <Head title="Process Payment" />
            <div className="p-6 space-y-6 max-w-lg mx-auto">
                <header className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <Link href={route('finance.disbursements')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Process Payment</h1>
                        <p className="text-slate-500">Release funds for purchase order.</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Link Purchase Order</label>
                            <select className={inputCls} value={poId} onChange={e => setPoId(e.target.value)}>
                                <option value="">Select PO...</option>
                                {poList.map(o => <option key={o.id} value={o.id}>PO-{o.id} - {o.supplier?.name} ({Number(o.total_amount).toLocaleString()})</option>)}
                            </select>
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
                    </div>

                    <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 w-full justify-center transition-colors">
                        <Save size={18} /> Process Disbursement
                    </button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
