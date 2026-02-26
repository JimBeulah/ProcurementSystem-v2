import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import { ArrowLeft, Plus, CheckCircle, Factory } from 'lucide-react';

export default function RfqShow() {
    const { rfq, suppliers } = usePage().props;
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteForm, setQuoteForm] = useState({ supplier_id: '', prices: {} });
    const [submitting, setSubmitting] = useState(false);

    if (!rfq) return <div className="p-12 text-center text-red-500">RFQ not found</div>;

    const handleSubmitQuote = (e) => {
        e.preventDefault();
        setSubmitting(true);
        const items = rfq.items.map(item => ({
            material_name: item.material_name,
            quantity: Number(item.quantity),
            unit_price: Number(quoteForm.prices[item.id] || 0),
        }));
        router.post(`/purchasing/rfq/${rfq.id}/quotation`, { supplier_id: quoteForm.supplier_id, items }, {
            onSuccess: () => { setShowQuoteModal(false); setQuoteForm({ supplier_id: '', prices: {} }); },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleAward = (quotationId) => {
        if (confirm('Are you sure you want to award this supplier? This will close the RFQ.')) {
            router.post(`/purchasing/rfq/${rfq.id}/award/${quotationId}`);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={rfq.title} />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <header className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <Link href="/purchasing/rfq" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                {rfq.title}
                                <span className={`text-sm px-2 py-1 rounded border ${rfq.status === 'OPEN' ? 'border-cyan-500 text-cyan-600' :
                                    rfq.status === 'AWARDED' ? 'border-emerald-500 text-emerald-600' : 'border-slate-500 text-slate-500'
                                    }`}>{rfq.status}</span>
                            </h1>
                            <p className="text-slate-500 text-sm">Created {new Date(rfq.created_at).toLocaleDateString()} • Due {rfq.due_date ? new Date(rfq.due_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    {rfq.status === 'OPEN' && (
                        <button onClick={() => setShowQuoteModal(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors">
                            <Plus size={18} /> Add Quotation
                        </button>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Items Panel */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 h-fit">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Requested Items</h2>
                        <div className="space-y-3">
                            {(rfq.items || []).map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                    <div>
                                        <div className="text-slate-900 dark:text-white font-medium">{item.material_name}</div>
                                        <div className="text-xs text-slate-500">{item.quantity} {item.unit}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quotation Comparison */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Received Quotations</h2>
                        <div className="overflow-x-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="p-4">Supplier</th>
                                        <th className="p-4 text-center">Total Amount (PHP)</th>
                                        <th className="p-4 text-center">Date</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {(rfq.quotations || []).map(quote => (
                                        <tr key={quote.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${quote.is_selected ? 'bg-emerald-50 dark:bg-emerald-500/5' : ''}`}>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <Factory size={16} className="text-slate-400" /> {quote.supplier?.name}
                                                </div>
                                                <div className="text-xs text-slate-500">{quote.items?.length || 0} items quoted</div>
                                            </td>
                                            <td className="p-4 text-center font-mono text-slate-900 dark:text-white text-base">
                                                {Number(quote.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 text-center text-slate-500">
                                                {new Date(quote.quote_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                {quote.is_selected ? (
                                                    <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                                                        <CheckCircle size={14} /> AWARDED
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500">Submitted</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {rfq.status === 'OPEN' && !quote.is_selected && (
                                                    <button onClick={() => handleAward(quote.id)} className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                        Award PO
                                                    </button>
                                                )}
                                                {quote.is_selected && (
                                                    <Link href={`/purchasing/orders/create?rfqId=${rfq.id}&quoteId=${quote.id}`}>
                                                        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                            Create PO
                                                        </button>
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!rfq.quotations || rfq.quotations.length === 0) && (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">No quotations received yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Quote Entry Modal */}
                <Modal isOpen={showQuoteModal} onClose={() => setShowQuoteModal(false)} title="Enter Supplier Quotation">
                    <form onSubmit={handleSubmitQuote} className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Supplier</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white" value={quoteForm.supplier_id} onChange={e => setQuoteForm({ ...quoteForm, supplier_id: e.target.value })} required>
                                <option value="">Select Supplier...</option>
                                {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 space-y-4 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-slate-900 dark:text-white font-bold text-sm">Unit Prices (PHP)</h3>
                            {(rfq.items || []).map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                                        {item.material_name} <span className="text-slate-500">({item.quantity} {item.unit})</span>
                                    </div>
                                    <input type="number" step="0.01" placeholder="Unit Price" className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-right text-slate-900 dark:text-white font-mono" onChange={e => setQuoteForm({ ...quoteForm, prices: { ...quoteForm.prices, [item.id]: parseFloat(e.target.value) } })} required />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button type="button" onClick={() => setShowQuoteModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase">Cancel</button>
                            <button type="submit" disabled={submitting} className="bg-emerald-600 px-6 py-2 rounded-lg text-white font-bold text-xs uppercase hover:bg-emerald-500 disabled:opacity-50 transition-colors">Submit Quotation</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
