import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { FileSearch, Plus, Calendar } from 'lucide-react';

export default function RfqIndex() {
    const { rfqs } = usePage().props;
    const { can } = usePermissions();
    const list = rfqs || [];

    return (
        <AuthenticatedLayout>
            <Head title="Request for Quotations" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <FileSearch className="text-pink-500" /> Request for Quotations (RFQ)
                        </h1>
                        <p className="text-slate-500">Manage RFQs and supplier pricing.</p>
                    </div>
                    {can('manage rfq') && (
                        <Link href="/purchasing/rfq/create">
                            <button className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors active:scale-95">
                                <Plus size={18} /> Create RFQ
                            </button>
                        </Link>
                    )}
                </header>

                {list.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <FileSearch size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No RFQs found. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {list.map(rfq => (
                            <Link href={`/purchasing/rfq/${rfq.id}`} key={rfq.id}>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors group shadow-sm hover:shadow-md">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-slate-900 dark:text-white font-bold text-lg">{rfq.title}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                <Calendar size={12} /> Due: {rfq.due_date ? new Date(rfq.due_date).toLocaleDateString() : 'N/A'}
                                                <span className="mx-1">•</span>
                                                {rfq.items?.length || 0} items
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded border font-bold ${rfq.status === 'OPEN' ? 'border-cyan-500 text-cyan-600 bg-cyan-500/10' :
                                            rfq.status === 'AWARDED' ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10' :
                                                'border-slate-300 text-slate-500 bg-slate-100 dark:border-slate-600 dark:bg-slate-700'
                                            }`}>
                                            {rfq.status}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
