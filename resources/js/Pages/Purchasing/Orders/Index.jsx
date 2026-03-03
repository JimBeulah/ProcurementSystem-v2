import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { ShoppingCart, Plus, Calendar, MapPin, Package, Printer } from 'lucide-react';

export default function PurchaseOrdersIndex() {
    const { orders } = usePage().props;
    const { can } = usePermissions();
    const pos = orders || [];

    return (
        <AuthenticatedLayout>
            <Head title="Purchase Orders" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ShoppingCart className="text-blue-500" /> Purchase Orders
                        </h1>
                        <p className="text-slate-500">Track and manage supplier orders.</p>
                    </div>
                    {can('create purchase orders') && (
                        <Link href="/purchasing/orders/create">
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors active:scale-95">
                                <Plus size={18} /> Create PO
                            </button>
                        </Link>
                    )}
                </header>

                <div className="grid gap-4">
                    {pos.map(po => (
                        <Link href={`/purchasing/orders/${po.id}`} key={po.id}>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors group shadow-sm hover:shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 font-bold group-hover:text-blue-500 font-mono text-sm">
                                            PO-{po.id.toString().padStart(4, '0')}
                                        </div>
                                        <div>
                                            <div className="text-slate-900 dark:text-white font-bold">{po.supplier?.name || 'Internal Fulfillment (Warehouse)'}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                <Calendar size={12} /> {new Date(po.order_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a href={`/purchasing/orders/${po.id}/print`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center" title="Print PO">
                                            <Printer size={16} />
                                        </a>
                                        {(po.status === 'APPROVED' || po.status === 'PARTIALLY DELIVERED') && can('create receiving') && (
                                            <Link href={`/inventory/receiving/create?poId=${po.id}`} onClick={e => e.stopPropagation()} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors flex items-center justify-center" title="Create Receiving">
                                                <Package size={16} />
                                            </Link>
                                        )}
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${po.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                            po.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                po.status === 'PENDING' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'
                                            }`}>
                                            {po.status}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <MapPin size={14} /> {po.project?.name}
                                    </div>
                                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                                        {Number(po.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, style: 'currency', currency: 'PHP' })}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {pos.length === 0 && (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                            No Purchase Orders found.
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
