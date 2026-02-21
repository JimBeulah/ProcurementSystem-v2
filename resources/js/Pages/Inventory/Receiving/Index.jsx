import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ClipboardCheck, Plus, Package, Truck } from 'lucide-react';

export default function ReceivingIndex() {
    const { reports, auth } = usePage().props;
    const list = reports || [];

    return (
        <AuthenticatedLayout>
            <Head title="Goods Receipt (GRN)" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ClipboardCheck className="text-orange-500" /> Goods Receipt (GRN)
                        </h1>
                        <p className="text-slate-500">Track received materials and deliveries.</p>
                    </div>
                    {auth.permissions.includes('create receiving') && (
                        <Link href="/inventory/receiving/create">
                            <button className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors">
                                <Plus size={18} /> Receive Goods
                            </button>
                        </Link>
                    )}
                </header>

                <div className="grid gap-4">
                    {list.map(rr => (
                        <div key={rr.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <div className="text-slate-900 dark:text-white font-bold text-lg">GRN-{rr.id.toString().padStart(4, '0')}</div>
                                    <div className="text-xs text-slate-500">Received on {new Date(rr.received_date).toLocaleDateString()}</div>
                                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                        <Truck size={12} /> PO-{rr.purchase_order?.id?.toString().padStart(4, '0')} • {rr.purchase_order?.supplier?.name}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{rr.items?.length || 0}</div>
                                <div className="text-xs text-slate-500 uppercase">Items</div>
                            </div>
                        </div>
                    ))}
                    {list.length === 0 && (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            No receiving reports found.
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
