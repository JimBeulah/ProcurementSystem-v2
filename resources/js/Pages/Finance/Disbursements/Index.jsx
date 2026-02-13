import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { CreditCard, Plus, ArrowUpRight } from 'lucide-react';

export default function DisbursementsIndex() {
    const { payments } = usePage().props;
    const list = payments || [];

    return (
        <AuthenticatedLayout>
            <Head title="Disbursements" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <CreditCard className="text-red-500" /> Disbursements
                        </h1>
                        <p className="text-slate-500">Track outgoing payments and releases.</p>
                    </div>
                    <button className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold">
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
        </AuthenticatedLayout>
    );
}
