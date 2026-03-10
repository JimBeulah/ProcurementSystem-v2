import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Printer } from 'lucide-react';
import { usePermissions } from '@/Hooks/usePermissions';

export default function PurchaseOrderShow() {
    const { order: po } = usePage().props;
    const { can } = usePermissions();

    if (!po) return <div className="p-12 text-center text-red-500">PO Not Found</div>;

    const handleApprove = () => {
        if (confirm('Approve this Purchase Order?')) {
            router.post(`/purchasing/orders/${po.id}/approve`);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`PO-${po.id.toString().padStart(4, '0')}`} />
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <header className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <Link href="/purchasing/orders" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                PO-{po.id.toString().padStart(4, '0')}
                                <span className={`text-sm px-2 py-1 rounded border ${po.status === 'APPROVED' ? 'border-emerald-500 text-emerald-500' :
                                    'border-orange-500 text-orange-500'
                                    }`}>{po.status}</span>
                            </h1>
                            <p className="text-slate-500">Issued on {new Date(po.order_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <a href={`/purchasing/orders/${po.id}/print`} target="_blank" rel="noopener noreferrer" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors">
                            <Printer size={18} /> Print
                        </a>
                        {po.status === 'PENDING' && can('approve purchase orders') && (
                            <button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors active:scale-95">
                                <CheckCircle size={18} /> Approve PO
                            </button>
                        )}
                        {po.status !== 'CANCELLED' && po.status !== 'COMPLETED' && can('create purchase orders') && (
                            <button onClick={() => {
                                const remarks = prompt("Please enter the reason for cancellation:");
                                if (remarks) {
                                    router.post(`/purchasing/orders/${po.id}/cancel`, { remarks });
                                }
                            }} className="bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors outline-none">
                                Cancel Order
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                        <h2 className="text-xs text-slate-500 uppercase font-bold mb-4 tracking-widest">Supplier Details</h2>
                        <div className="text-slate-900 dark:text-white font-bold text-lg mb-1">{po.supplier?.name || 'Internal Fulfillment'}</div>
                        <div className="text-slate-500 text-sm">{po.supplier?.address || 'Warehouse Stock'}</div>
                        {po.supplier && <div className="text-slate-500 text-sm">{po.supplier.contact_person}</div>}
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                        <h2 className="text-xs text-slate-500 uppercase font-bold mb-4 tracking-widest">Delivery To</h2>
                        <div className="text-slate-900 dark:text-white font-bold text-lg mb-1">{po.project?.name}</div>
                        <div className="text-slate-500 text-sm">{po.project?.location}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Item</th>
                                <th className="p-4 text-center">Qty</th>
                                <th className="p-4 text-right">Unit Price</th>
                                <th className="p-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {(po.items || []).map(item => (
                                <tr key={item.id}>
                                    <td className="p-4">
                                        <div className="text-slate-900 dark:text-white font-medium">{item.material_name}</div>
                                        <div className="text-xs text-slate-400">{item.description}</div>
                                    </td>
                                    <td className="p-4 text-center font-mono">{item.quantity}</td>
                                    <td className="p-4 text-right font-mono">{Number(item.unit_price).toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-slate-900 dark:text-white font-bold">
                                        {(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                            <tr>
                                <td colSpan={3} className="p-4 text-right">TOTAL AMOUNT (PHP)</td>
                                <td className="p-4 text-right text-emerald-600 text-xl font-mono">
                                    {Number(po.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {po.approver && (
                    <div className="flex justify-end text-sm text-emerald-600 items-center gap-2">
                        <CheckCircle size={14} /> Approved by {po.approver.name}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
