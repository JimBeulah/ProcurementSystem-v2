import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function InvoiceCreate() {
    const { suppliers, orders, grns } = usePage().props;

    const [invoiceNo, setInvoiceNo] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [poId, setPoId] = useState('');
    const [grnId, setGrnId] = useState('');
    const [amount, setAmount] = useState(0);

    const filteredOrders = supplierId ? orders.filter(o => o.supplier_id === Number(supplierId)) : orders;
    const filteredGrns = poId ? grns.filter(g => g.purchase_order_id === Number(poId)) : grns;

    useEffect(() => {
        if (poId) {
            const po = orders.find(o => o.id === Number(poId));
            if (po) setAmount(Number(po.total_amount));
        }
    }, [poId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('finance.invoices.store'), {
            invoice_number: invoiceNo,
            supplier_id: Number(supplierId),
            purchase_order_id: poId ? Number(poId) : null,
            receiving_report_id: grnId ? Number(grnId) : null,
            total_amount: amount,
        });
    };

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500";

    return (
        <AuthenticatedLayout>
            <Head title="Record Invoice" />
            <div className="p-6 space-y-6 max-w-lg mx-auto">
                <header className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <Link href={route('finance.invoices')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Record Invoice</h1>
                        <p className="text-slate-500">Enter supplier invoice details.</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Invoice Number</label>
                            <input className={inputCls} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} required placeholder="e.g. INV-2024-001" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Supplier</label>
                            <select className={inputCls} value={supplierId} onChange={e => { setSupplierId(e.target.value); setPoId(''); setGrnId(''); }} required>
                                <option value="">Select Supplier...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Link Purchase Order</label>
                            <select className={inputCls} value={poId} onChange={e => { setPoId(e.target.value); setGrnId(''); }} disabled={!supplierId}>
                                <option value="">Select PO...</option>
                                {filteredOrders.map(o => <option key={o.id} value={o.id}>PO-{o.id} ({Number(o.total_amount).toLocaleString()})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Link Receiving Report (GRN)</label>
                            <select className={inputCls} value={grnId} onChange={e => setGrnId(e.target.value)} disabled={!supplierId}>
                                <option value="">Select GRN...</option>
                                {filteredGrns.map(g => <option key={g.id} value={g.id}>GRN-{g.id} ({new Date(g.received_date).toLocaleDateString()})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Invoice Amount</label>
                            <input type="number" step="0.01" className={`${inputCls} font-mono text-lg`} value={amount} onChange={e => setAmount(parseFloat(e.target.value))} required />
                        </div>
                    </div>

                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 w-full justify-center transition-colors">
                        <Save size={18} /> Save Invoice
                    </button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
