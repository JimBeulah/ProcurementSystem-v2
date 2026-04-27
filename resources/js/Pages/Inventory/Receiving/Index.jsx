import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ClipboardCheck, Plus, Truck, Calendar, FileText, MapPin } from 'lucide-react';
import DataTable from '@/Components/UI/DataTable';
import Drawer from '@/Components/UI/Drawer';

export default function ReceivingIndex() {
    const { reports, auth } = usePage().props;
    const list = reports || [];
    const [selectedReport, setSelectedReport] = useState(null);

    const columns = [
        {
            accessorKey: 'id',
            header: 'GRN #',
            cell: ({ row }) => (
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600 dark:text-orange-400 font-bold font-mono text-sm max-w-max">
                    GRN-{row.original.id.toString().padStart(4, '0')}
                </div>
            )
        },
        {
            accessorKey: 'received_date',
            header: 'Date Received',
            cell: ({ row }) => (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Calendar size={12} /> {new Date(row.original.received_date).toLocaleDateString()}
                </div>
            )
        },
        {
            id: 'po_number',
            accessorFn: row => `PO-${row.purchase_order?.id?.toString().padStart(4, '0')}`,
            header: 'PO #',
            cell: ({ row }) => (
                <div className="text-slate-900 dark:text-white font-mono font-bold">
                    PO-{row.original.purchase_order?.id?.toString().padStart(4, '0')}
                </div>
            )
        },
        {
            id: 'supplier',
            accessorFn: row => row.purchase_order?.supplier?.name || '',
            header: 'Supplier',
            cell: ({ row }) => (
                <div className="text-slate-900 dark:text-white font-medium">
                    {row.original.purchase_order?.supplier?.name}
                </div>
            )
        },
        {
            id: 'project',
            accessorFn: row => row.purchase_order?.project?.name || '',
            header: 'Project',
            cell: ({ row }) => (
                <div className="text-sm text-slate-500 flex items-center gap-2">
                    <MapPin size={14} /> {row.original.purchase_order?.project?.name}
                </div>
            )
        },
        {
            id: 'items_count',
            header: 'Items',
            cell: ({ row }) => (
                <div className="text-center font-bold">
                    {row.original.items?.length || 0}
                </div>
            )
        }
    ];

    const renderReportDetails = (report) => {
        if (!report) return null;
        return (
            <div className="space-y-6">
                <header className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            GRN-{report.id.toString().padStart(4, '0')}
                        </h1>
                        <p className="text-slate-500">Received on {new Date(report.received_date).toLocaleDateString()}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                        <h2 className="text-xs text-slate-500 uppercase font-bold mb-4 tracking-widest">Reference Details</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Truck size={16} className="text-slate-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Purchase Order</div>
                                    <div className="text-slate-900 dark:text-white font-bold">PO-{report.purchase_order?.id?.toString().padStart(4, '0')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-slate-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Delivery Note #</div>
                                    <div className="text-slate-900 dark:text-white font-bold">{report.delivery_note_no || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                        <h2 className="text-xs text-slate-500 uppercase font-bold mb-4 tracking-widest">Project & Supplier</h2>
                        <div className="space-y-3">
                            <div className="text-slate-900 dark:text-white font-bold">{report.purchase_order?.supplier?.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                <MapPin size={14} /> {report.purchase_order?.project?.name}
                            </div>
                        </div>
                    </div>
                </div>

                {report.notes && (
                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/20 p-4 rounded-xl">
                        <h3 className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase tracking-widest mb-2">Remarks</h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300">{report.notes}</p>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Material Name</th>
                                <th className="p-4 text-center">Qty Received</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {(report.items || []).map(item => (
                                <tr key={item.id}>
                                    <td className="p-4 text-slate-900 dark:text-white font-medium">{item.material_name}</td>
                                    <td className="p-4 text-center font-mono font-bold text-slate-900 dark:text-white">{item.quantity_received}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                            item.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Goods Receipt (GRN)" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ClipboardCheck className="text-orange-500" /> Goods Receipt (GRN)
                        </h1>
                        <p className="text-slate-500">Track received materials and deliveries.</p>
                    </div>
                    {auth.permissions.includes('create receiving') && (
                        <Link href="/inventory/receiving/create">
                            <button className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors shadow-lg shadow-orange-600/20">
                                <Plus size={18} /> Receive Goods
                            </button>
                        </Link>
                    )}
                </header>

                <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                    <DataTable
                        columns={columns}
                        data={list}
                        onRowClick={(row) => setSelectedReport(row)}
                    />
                </div>
            </div>

            <Drawer
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="Goods Receipt Details"
                width="w-full max-w-3xl"
            >
                {renderReportDetails(selectedReport)}
            </Drawer>
        </AuthenticatedLayout>
    );
}
