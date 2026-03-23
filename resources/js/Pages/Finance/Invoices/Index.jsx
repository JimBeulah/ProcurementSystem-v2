import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { Receipt, Plus, CheckCircle2, Save, Eye, Box, Hammer, FileText, ArrowRight } from 'lucide-react';
import Modal from '@/Components/UI/Modal';
import Combobox from '@/Components/UI/Combobox';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import DataTable from '@/Components/UI/DataTable';
import Drawer from '@/Components/UI/Drawer';

export default function InvoicesIndex() {
    const { invoices, suppliers, orders, grns } = usePage().props;
    const list = invoices || [];
    const supplierList = suppliers || [];
    const poList = orders || [];
    const grnList = grns || [];

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [drawerItem, setDrawerItem] = useState(null);
    const [supplierId, setSupplierId] = useState('');
    const [poId, setPoId] = useState('');
    const [grnId, setGrnId] = useState('');
    const [invoiceNum, setInvoiceNum] = useState('');
    const [amount, setAmount] = useState(0);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        id: null
    });

    const handleValidate = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const columns = [
        {
            accessorKey: 'invoice_number',
            header: 'Invoice #',
            cell: ({ row }) => (
                <span className="font-bold text-slate-900 dark:text-white">
                    {row.original.invoice_number}
                </span>
            ),
        },
        {
            accessorKey: 'supplier.name',
            header: 'Supplier',
            cell: ({ row }) => (
                <span className="text-slate-500">
                    {row.original.supplier?.name}
                </span>
            ),
        },
        {
            id: 'ref_docs',
            header: 'Ref Docs',
            cell: ({ row }) => (
                <div className="text-xs space-y-1">
                    {row.original.purchase_order_id ? (
                        <div className="text-blue-500 text-[10px] bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded inline-block font-medium">
                            PO-{row.original.purchase_order_id}
                        </div>
                    ) : (
                        <div className="text-slate-400">Missing PO</div>
                    )}
                    <br />
                    {row.original.receiving_report_id ? (
                        <div className="text-orange-500 text-[10px] bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded inline-block font-medium">
                            GRN-{row.original.receiving_report_id}
                        </div>
                    ) : (
                        <div className="text-slate-400">No GRN</div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'total_amount',
            header: () => <div className="text-right">Amount</div>,
            cell: ({ row }) => (
                <div className="text-right font-mono text-slate-900 dark:text-white">
                    {Number(row.original.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: () => <div className="text-center">Status</div>,
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <div className="text-center">
                        <span className={`px-2 py-1 rounded text-[10px] border font-bold uppercase tracking-wider ${status === 'MATCHED' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                            status === 'PAID' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600' :
                                'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                            }`}>
                            {status}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-center">Action</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDrawerItem(row.original);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                        title="View Details"
                    >
                        <Eye size={18} />
                    </button>
                    {row.original.status === 'PENDING' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleValidate(row.original.id);
                            }}
                            className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white px-2 py-1.5 rounded border border-emerald-500/20 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                            <CheckCircle2 size={12} /> Validate
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const executeValidate = () => {
        if (!confirmModal.id) return;
        router.post(route('finance.invoices.validate', confirmModal.id), {}, {
            onSuccess: () => {
                setConfirmModal({ isOpen: false, id: null });
                if (drawerItem && drawerItem.id === confirmModal.id) {
                    setDrawerItem({ ...drawerItem, status: 'MATCHED' });
                }
            }
        });
    };

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
                    <button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors shadow-sm shadow-emerald-500/20">
                        <Plus size={18} /> Record Invoice
                    </button>
                </header>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden p-4">
                    <DataTable
                        columns={columns}
                        data={list}
                        onRowClick={(row) => setDrawerItem(row)}
                    />
                </div>
            </div>

            <Drawer
                isOpen={!!drawerItem}
                onClose={() => setDrawerItem(null)}
                title={
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Invoice Details</span>
                        <span className="text-xs text-slate-500 font-mono">#{drawerItem?.invoice_number}</span>
                    </div>
                }
            >
                {drawerItem && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center sm:text-left">Total Amount</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                                        ₱{Number(drawerItem.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] border font-bold uppercase tracking-wider ${drawerItem.status === 'MATCHED' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                    drawerItem.status === 'PAID' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600' :
                                        'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                                    }`}>
                                    {drawerItem.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Supplier</div>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{drawerItem.supplier?.name}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                                <FileText size={14} className="text-blue-500" /> Reference Documents
                            </h3>

                            <div className="grid grid-cols-1 gap-3">
                                {/* PO Card */}
                                <div className="p-4 rounded-xl border border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Box size={40} /></div>
                                    <div className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-mono">Purchase Order</div>
                                    {drawerItem.purchase_order_id ? (
                                        <>
                                            <div className="text-lg font-black text-blue-700 dark:text-blue-400 font-mono tracking-tight">PO-{drawerItem.purchase_order_id}</div>
                                            <div className="text-[10px] text-slate-400 mt-1 font-medium italic">Matched amount: ₱{Number(drawerItem.total_amount).toLocaleString()}</div>
                                        </>
                                    ) : (
                                        <div className="text-sm font-medium text-slate-400 italic">No PO Linked</div>
                                    )}
                                </div>

                                {/* GRN Card */}
                                <div className="p-4 rounded-xl border border-orange-200/50 dark:border-orange-900/30 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Hammer size={40} /></div>
                                    <div className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-mono">Receiving Report</div>
                                    {drawerItem.receiving_report_id ? (
                                        <>
                                            <div className="text-lg font-black text-orange-700 dark:text-orange-400 font-mono tracking-tight">GRN-{drawerItem.receiving_report_id}</div>
                                            <div className="text-[10px] text-slate-400 mt-1 font-medium italic">Confirmed Delivery</div>
                                        </>
                                    ) : (
                                        <div className="text-sm font-medium text-slate-400 italic">No GRN Linked</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {drawerItem.status === 'PENDING' && (
                            <div className="pt-4">
                                <button
                                    onClick={() => handleValidate(drawerItem.id)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <CheckCircle2 size={18} /> Validate & Match Invoice
                                </button>
                                <p className="text-[10px] text-slate-400 text-center mt-3 px-4 italic">
                                    Validating this invoice confirms that the items and amounts match the Purchase Order and Receiving Report.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>

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
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Amount</label>
                        <input type="number" step="0.01" className={`${inputCls} font-mono text-lg`} value={amount} onChange={e => setAmount(parseFloat(e.target.value))} required />
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 w-full justify-center transition-colors">
                            <Save size={18} /> Save Invoice
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={executeValidate}
                title="Validate Invoice"
                message="Mark this invoice as matched and validated?"
                confirmText="Validate"
            />
        </AuthenticatedLayout>
    );
}
