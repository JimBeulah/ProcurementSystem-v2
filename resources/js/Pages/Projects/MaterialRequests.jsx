import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import DataTable from '@/Components/UI/DataTable';
import { Truck, Plus, AlertTriangle, Info, User, Calendar } from 'lucide-react';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import MRDetailsDrawer from '@/Components/MaterialRequest/MRDetailsDrawer';
import MRCreateModal from '@/Components/MaterialRequest/MRCreateModal';

export default function ProjectMaterialRequests() {
    const { project, materialRequests: initialMRs, boqItems, inventoryItems, auth } = usePage().props;
    const requests = useMemo(() => initialMRs || [], [initialMRs]);

    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedMr, setSelectedMr] = useState(null);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [mrToCancel, setMrToCancel] = useState(null);

    const columns = useMemo(() => [
        {
            accessorKey: 'id',
            header: 'RQ Number',
            cell: info => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">RQ-{(info.getValue() || '').toString().padStart(5, '0')}</span>,
        },
        {
            accessorKey: 'requester.name',
            header: 'Requested By',
            cell: info => <div className="flex items-center gap-2"><User size={14} className="text-slate-400" /><span className="text-slate-600 dark:text-slate-300">{info.getValue() || 'N/A'}</span></div>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: info => {
                const status = info.getValue() || 'PENDING';
                const styles = {
                    PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                    APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                    DECLINED: 'bg-red-500/10 text-red-600 border-red-500/20',
                    CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
                    REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
                    PARTIALLY_FULFILLED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                    FULFILLED: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
                };
                return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[status] || styles.PENDING}`}>{status}</span>;
            }
        },
        {
            accessorKey: 'request_date',
            header: 'Date',
            cell: info => <div className="flex items-center gap-1.5 text-slate-500 text-xs"><Calendar size={12} />{new Date(info.getValue()).toLocaleDateString()}</div>,
        },
        {
            id: 'items_count',
            header: 'Items',
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-300 font-medium">{row.original.items?.length || 0}</span>,
        },
        {
            id: 'total_cost',
            header: 'Est. Total',
            cell: ({ row }) => {
                const total = (row.original.items || []).reduce((sum, item) => sum + ((Number(item.material_unit_price) || 0) + (Number(item.labor_unit_price) || 0)) * Number(item.quantity), 0);
                return <div className="text-right font-mono font-bold text-slate-900 dark:text-white"><span className="text-[10px] text-slate-400 mr-1">₱</span>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>;
            }
        },
        {
            id: 'actions',
            header: 'Details',
            cell: ({ row }) => (
                <div className="text-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedMr(row.original); setShowDrawer(true); }}
                        className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors inline-flex"
                    >
                        <Info size={16} />
                    </button>
                </div>
            ),
        }
    ], []);

    const handleCreateSubmit = (data) => {
        setSubmitting(true);
        router.post(`/projects/${project.id}/material-requests`, data, {
            onSuccess: () => { 
                setShowModal(false); 
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleCancelRequest = (mr) => {
        setMrToCancel(mr);
        setShowCancelModal(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Resource Requests - ${project.name}`} />

            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Truck className="text-blue-600" /> Resource Requests
                        </h1>
                        <p className="text-slate-500">Request resources (Materials, Labor, Equipment) from BOQ tracking.</p>
                    </div>
                    {project.status === 'ACTIVE' ? (
                        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-xs font-bold shadow-lg shadow-blue-600/20 active:scale-95">
                            <Plus size={18} /> Create Request
                        </button>
                    ) : (
                        <div className="flex flex-col items-end gap-1">
                            <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold">
                                <AlertTriangle size={16} /> BOQ Not Approved
                            </div>
                            <p className="text-[10px] text-slate-400 max-w-[200px] text-right">Sourcing is disabled until the Project BOQ is finalized and approved.</p>
                        </div>
                    )}
                </header>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative z-0">
                    <DataTable
                        columns={columns}
                        data={requests}
                        showSearch={true}
                        showPagination={true}
                        overflowVisible={true}
                        onRowClick={(row) => { setSelectedMr(row); setShowDrawer(true); }}
                    />
                </div>

                <MRCreateModal 
                    isOpen={showModal} 
                    onClose={() => setShowModal(false)}
                    onSubmit={handleCreateSubmit}
                    boqItems={boqItems}
                    inventoryItems={inventoryItems}
                    auth={auth}
                    requests={requests}
                    submitting={submitting}
                />

                <MRDetailsDrawer 
                    isOpen={showDrawer}
                    onClose={() => setShowDrawer(false)}
                    selectedMr={selectedMr}
                    onCancel={handleCancelRequest}
                />

                <ConfirmationModal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={() => {
                        if (mrToCancel) {
                            router.post(`/material-requests/${mrToCancel.id}/cancel`, {}, {
                                onSuccess: () => {
                                    setShowDrawer(false);
                                    setShowCancelModal(false);
                                    setMrToCancel(null);
                                }
                            });
                        }
                    }}
                    title="Cancel Resource Request"
                    message={`Are you sure you want to cancel Resource Request RQ-${(mrToCancel?.id || '').toString().padStart(5, '0')}? This action cannot be undone.`}
                    type="danger"
                    confirmText="Yes, Cancel Request"
                    cancelText="No, Keep it"
                />
            </div>
        </AuthenticatedLayout>
    );
}
