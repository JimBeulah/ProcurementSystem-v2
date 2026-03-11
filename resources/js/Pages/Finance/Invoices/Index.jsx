import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { Receipt, Plus, CheckCircle2, Save } from 'lucide-react';
import Modal from '@/Components/ui/Modal';
import Combobox from '@/Components/ui/Combobox';

export default function InvoicesIndex() {
    const { invoices, suppliers, orders, grns } = usePage().props;
    const list = invoices || [];
    const supplierList = suppliers || [];
    const poList = orders || [];
    const grnList = grns || [];

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [supplierId, setSupplierId] = useState('');
    const [poId, setPoId] = useState('');
    const [grnId, setGrnId] = useState('');
    const [invoiceNum, setInvoiceNum] = useState('');
    const [amount, setAmount] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('finance.invoices.store'), {
            supplier_id: supplierId,
            purchase_order_id: poId || null,
            receiving_report_id: grnId || null,
            invoice_number: invoiceNum,
            total_amount: amount,
            status: 'PENDING'
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setSupplierId('');
                setPoId('');
                setGrnId('');
                setInvoiceNum('');
                setAmount(0);
            }
        });
    };

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500";

    return (
        <AuthenticatedLayout>
            <Head title="Supplier Invoices" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Receipt className="text-emerald-500" /> Supplier Invoices
                        </h1>
                        <p className="text-slate-500">Manage payable invoices and 3-way matching.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors">
                        <Plus size={18} /> Record Invoice
                    </button>
                </header>

                <div className="overflow-x-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Invoice #</th>
                                <th className="p-4">Supplier</th>
                                <th className="p-4">Ref Docs</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {list.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{inv.invoice_number}</td>
                                    <td className="p-4 text-slate-500">{inv.supplier?.name}</td>
                                    <td className="p-4 text-xs space-y-1">
                                        {inv.purchase_order_id ? <div className="text-blue-500">PO-{inv.purchase_order_id}</div> : <div className="text-slate-400">Missing PO</div>}
                                        {inv.receiving_report_id ? <div className="text-orange-500">GRN-{inv.receiving_report_id}</div> : <div className="text-slate-400">No GRN</div>}
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-900 dark:text-white">
                                        {Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs border font-medium ${inv.status === 'MATCHED' ? 'border-emerald-500 text-emerald-600' :
                                            inv.status === 'PAID' ? 'border-blue-500 text-blue-600' :
                                                'border-amber-500 text-amber-600'
                                            }`}>{inv.status}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {inv.status === 'PENDING' && (
                                            <button className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 ml-auto text-sm">
                                                <CheckCircle2 size={16} /> Validate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {list.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No invoices recorded.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Record New Invoice" maxWidth="max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Supplier</label>
                        <Combobox
                            value={supplierId}
                            onChange={(val) => setSupplierId(val)}
                            options={[{ value: '', label: 'Select Supplier...' }, ...supplierList.map(s => ({
                                value: String(s.id),
                                label: s.name
                            }))]}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Link Purchase Order</label>
                        <Combobox
                            value={poId}
                            onChange={(val) => setPoId(val)}
                            options={[{ value: '', label: 'None / Direct...' }, ...poList.filter(o => !supplierId || String(o.supplier_id) === String(supplierId)).map(o => ({
                                value: String(o.id),
                                label: `PO-${o.id} (${Number(o.total_amount).toLocaleString()})`
                            }))]}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Link GRN (Delivery)</label>
                        <Combobox
                            value={grnId}
                            onChange={(val) => setGrnId(val)}
                            options={[{ value: '', label: 'None / Pending...' }, ...grnList.filter(g => !poId || String(g.purchase_order_id) === String(poId)).map(g => ({
                                value: String(g.id),
                                label: `GRN-${g.id} (PO-${g.purchase_order_id})`
                            }))]}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Invoice Number</label>
                        <input className={inputCls} value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} required placeholder="e.g. INV-2023-001" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Amount formatting</label>
                        <input type="number" step="0.01" className={`${inputCls} font-mono text-lg`} value={amount} onChange={e => setAmount(parseFloat(e.target.value))} required />
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 w-full justify-center transition-colors">
                            <Save size={18} /> Save Invoice
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
