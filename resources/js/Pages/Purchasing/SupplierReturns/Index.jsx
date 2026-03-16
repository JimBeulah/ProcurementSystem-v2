import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { ArrowLeftRight, Plus, Calendar, MapPin } from 'lucide-react';

const STATUS_STYLES = {
    DRAFT: 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600',
    PENDING_APPROVAL: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    APPROVED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    RETURNED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function SupplierReturnsIndex() {
    const { returns } = usePage().props;
    const { can } = usePermissions();
    const list = returns?.data || [];

    return (
        <AuthenticatedLayout>
            <Head title="Supplier Returns" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ArrowLeftRight className="text-rose-500" /> Supplier Returns
                        </h1>
                        <p className="text-slate-500">Track wrong or damaged deliveries returned to suppliers.</p>
                    </div>
                    {can('create purchase orders') && (
                        <Link href="/purchasing/supplier-returns/create">
                            <button className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors active:scale-95">
                                <Plus size={18} /> New Return
                            </button>
                        </Link>
                    )}
                </header>

                <div className="grid gap-4">
                    {list.map(ret => (
                        <Link href={`/purchasing/supplier-returns/${ret.id}`} key={ret.id}>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors group shadow-sm hover:shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400 font-bold group-hover:text-rose-500 font-mono text-sm">
                                            SR-{ret.id.toString().padStart(4, '0')}
                                        </div>
                                        <div>
                                            <div className="text-slate-900 dark:text-white font-bold">
                                                {ret.supplier?.name || 'Supplier N/A'}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                <Calendar size={12} /> {new Date(ret.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[ret.status] || STATUS_STYLES.DRAFT}`}>
                                        {ret.status.replace('_', ' ')}
                                    </div>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <MapPin size={14} /> {ret.project?.name}
                                    </div>
                                    <div className="text-sm text-slate-500 italic line-clamp-1 max-w-xs text-right">
                                        {ret.reason}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {list.length === 0 && (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <ArrowLeftRight size={48} className="mx-auto mb-4 opacity-30" />
                            No supplier returns found.
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
