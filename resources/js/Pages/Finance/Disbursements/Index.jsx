import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { CreditCard, Plus, ArrowUpRight, Save, Receipt, CheckCircle2, Eye, FileText, Calendar, User, Wallet, Loader2 } from 'lucide-react';
import { useBlobUpload } from '@/Hooks/useBlobUpload';
import Modal from '@/Components/UI/Modal';
import Combobox from '@/Components/UI/Combobox';
import DataTable from '@/Components/UI/DataTable';
import Drawer from '@/Components/UI/Drawer';
import { toast } from 'sonner';

export default function DisbursementsIndex() {
    const { payments, orders, users, is_vercel } = usePage().props;
    const { uploadFile, isUploading } = useBlobUpload();
    const list = payments || [];
    const poList = orders || [];
    const userList = users || [];

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isLiquidateOpen, setIsLiquidateOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [viewItem, setViewItem] = useState(null);

    // Create Form State
    const [poId, setPoId] = useState('');
    const [receivedById, setReceivedById] = useState('');
    const [amount, setAmount] = useState(0);
    const [method, setMethod] = useState('CHECK');
    const [reference, setReference] = useState('');

    // Liquidation Form State
    const [actualAmount, setActualAmount] = useState(0);
    const [receiptNumber, setReceiptNumber] = useState('');
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptFile, setReceiptFile] = useState(null);
    const [remarks, setRemarks] = useState('');

    const openLiquidation = React.useCallback((pay) => {
        setSelectedPayment(pay);
        setActualAmount(Number(pay.amount));
        setIsLiquidateOpen(true);
    }, [setSelectedPayment, setActualAmount, setIsLiquidateOpen]);

    const columns = React.useMemo(() => [
        {
            accessorKey: 'payment_date',
            header: 'Date',
            cell: ({ row }) => (
                <div className="text-slate-500">
                    {new Date(row.original.payment_date).toLocaleDateString()}
                </div>
            ),
        },
        {
            accessorKey: 'amount',
            header: () => <div className="text-right">Amount</div>,
            cell: ({ row }) => (
                <div className="text-right font-bold text-slate-900 dark:text-white flex items-center justify-end gap-2">
                    ₱{Number(row.original.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    {row.original.is_liquidated && (
                        <span className="text-[8px] bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Liquidated</span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'method',
            header: 'Method',
            cell: ({ row }) => (
                <div className="text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{row.original.method}</span>
                    {row.original.reference_number && (
                        <div className="text-slate-400 text-[10px]">Ref: {row.original.reference_number}</div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'purchase_order.id',
            header: 'Reference',
            cell: ({ row }) => (
                <div className="text-xs">
                    {row.original.purchase_order ? (
                        <>
                            <div className="text-blue-500 font-medium">PO-{row.original.purchase_order.id}</div>
                            <div className="text-slate-400 text-[10px] truncate max-w-[150px]">{row.original.purchase_order.supplier?.name}</div>
                        </>
                    ) : (
                        <span className="text-slate-400 italic text-[10px]">Direct Payment</span>
                    )}
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const pay = row.original;
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 inline-block text-center font-medium">
                            {pay.status}
                        </span>
                        {pay.is_liquidated && (
                            <div className="text-[9px] text-slate-400">
                                OR: {pay.receipt_number}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: () => <div className="text-center">Action</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewItem(row.original);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                        title="View Details"
                    >
                        <Eye size={18} />
                    </button>
                    {!row.original.is_liquidated && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openLiquidation(row.original);
                            }}
                            className="bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white px-2 py-1.5 rounded border border-red-500/20 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                            <Receipt size={14} /> Liquidate
                        </button>
                    )}
                </div>
            ),
        }
    ], [openLiquidation]);


    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('finance.disbursements.store'), {
            purchase_order_id: poId ? Number(poId) : null,
            received_by_id: receivedById ? Number(receivedById) : null,
            amount,
            method,
            reference_number: reference,
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setPoId('');
                setReceivedById('');
                setAmount(0);
                setMethod('CHECK');
                setReference('');
            }
        });
    };

    const handleLiquidateSubmit = async (e) => {
        e.preventDefault();

        if (isUploading) return;

        const payload = {
            actual_amount: actualAmount,
            receipt_number: receiptNumber,
            receipt_date: receiptDate,
            liquidation_remarks: remarks,
        };

        if (receiptFile) {
            if (is_vercel) {
                try {
                    const url = await uploadFile(receiptFile);
                    payload.receipt_url = url;
                } catch {
                    toast.error('Failed to upload receipt to Vercel Blob. Please check your connection and try again.');
                    return;
                }
            } else {
                // Local multipart upload
                const formData = new FormData();
                Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
                formData.append('receipt_file', receiptFile);
                
                router.post(route('finance.disbursements.liquidate', selectedPayment.id), formData, {
                    onSuccess: () => {
                        setIsLiquidateOpen(false);
                        resetLiquidation();
                    }
                });
                return;
            }
        } else if (is_vercel) {
            // Optional: You might want to require a file on Vercel if you expect one
            // toast.error('Please upload a scan of the receipt.');
            // return;
        }

        router.post(route('finance.disbursements.liquidate', selectedPayment.id), payload, {
            onSuccess: () => {
                setIsLiquidateOpen(false);
                resetLiquidation();
            }
        });
    };

    const resetLiquidation = () => {
        setReceiptNumber('');
        setActualAmount(0);
        setReceiptFile(null);
        setRemarks('');
        setSelectedPayment(null);
        if (viewItem && selectedPayment && viewItem.id === selectedPayment.id) {
            router.reload({ only: ['payments'] });
        }
    };

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-red-500";

    return (
        <AuthenticatedLayout>
            <Head title="Disbursements" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <CreditCard className="text-red-500" /> Disbursements
                        </h1>
                        <p className="text-slate-500">Track outgoing payments and releases.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors shadow-sm shadow-red-500/20">
                        <Plus size={18} /> Process Payment
                    </button>
                </header>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden p-4">
                    <DataTable
                        columns={columns}
                        data={list}
                        overflowVisible={true}
                        onRowClick={(row) => setViewItem(row)}
                    />
                </div>
            </div>

            <Drawer
                isOpen={!!viewItem}
                onClose={() => setViewItem(null)}
                title={
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Disbursement Details</span>
                        {viewItem?.reference_number && (
                            <span className="text-xs text-slate-500 font-mono">Ref: {viewItem.reference_number}</span>
                        )}
                    </div>
                }
            >
                {viewItem && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Disbursed Amount</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                                        ₱{Number(viewItem.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] border font-bold uppercase tracking-wider ${viewItem.is_liquidated ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-600' : 'border-slate-400 bg-slate-50 dark:bg-slate-500/10 text-slate-500'
                                    }`}>
                                    {viewItem.status}
                                </span>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span className="text-slate-500 uppercase text-[10px] font-bold w-20">Date:</span>
                                    <span className="text-slate-700 dark:text-slate-200 font-medium">{new Date(viewItem.payment_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Wallet size={14} className="text-slate-400" />
                                    <span className="text-slate-500 uppercase text-[10px] font-bold w-20">Method:</span>
                                    <span className="text-slate-700 dark:text-slate-200 font-medium">{viewItem.method}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <User size={14} className="text-slate-400" />
                                    <span className="text-slate-500 uppercase text-[10px] font-bold w-20">Recipient:</span>
                                    <span className="text-slate-700 dark:text-slate-200 font-medium">{viewItem.received_by?.name || '---'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Reference Context */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                                <ArrowUpRight size={14} className="text-blue-500" /> Source Reference
                            </h3>
                            <div className="p-4 rounded-xl border border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 shadow-sm">
                                {viewItem.purchase_order ? (
                                    <>
                                        <div className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-widest mb-1">Purchase Order</div>
                                        <div className="text-lg font-black text-blue-700 dark:text-blue-400 font-mono tracking-tight">PO-{viewItem.purchase_order.id}</div>
                                        <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{viewItem.purchase_order.supplier?.name}</div>
                                    </>
                                ) : (
                                    <div className="text-sm font-medium text-slate-400 italic">Direct Payment (No PO)</div>
                                )}
                            </div>
                        </div>

                        {/* Liquidation Data */}
                        {viewItem.is_liquidated && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1 text-green-600">
                                    <CheckCircle2 size={14} /> Liquidation Summary
                                </h3>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                            <div className="text-[8px] font-bold text-slate-400 uppercase mb-1">Actual Spent</div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">₱{Number(viewItem.actual_amount).toLocaleString()}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                                            <div className="text-[8px] font-bold text-green-500 uppercase mb-1">Savings/Refund</div>
                                            <div className="text-sm font-bold text-green-600 font-mono">₱{(Number(viewItem.amount) - Number(viewItem.actual_amount)).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-medium">Receipt #</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{viewItem.receipt_number}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-medium">Receipt Date</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(viewItem.receipt_date).toLocaleDateString()}</span>
                                        </div>
                                        {viewItem.liquidation_remarks && (
                                            <div className="pt-2">
                                                <div className="text-[8px] font-bold text-slate-400 uppercase mb-1">Remarks</div>
                                                <div className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-900 p-2 rounded leading-relaxed">{viewItem.liquidation_remarks}</div>
                                            </div>
                                        )}
                                        {viewItem.receipt_path && (
                                            <a
                                                href={viewItem.receipt_path.startsWith('http') ? viewItem.receipt_path : `/storage/${viewItem.receipt_path}`}
                                                target="_blank"
                                                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                                            >
                                                <FileText size={14} /> View Receipt Document
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!viewItem.is_liquidated && (
                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        setViewItem(null);
                                        openLiquidation(viewItem);
                                    }}
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <Receipt size={18} /> Open Liquidation Form
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>

            {/* Create Payment Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Process Payment" maxWidth="max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Link Purchase Order</label>
                        <Combobox
                            value={poId}
                            onChange={(val) => {
                                setPoId(val);
                                if (val) {
                                    const po = poList.find(p => p.id === Number(val));
                                    if (po) setAmount(Number(po.total_amount));
                                }
                            }}
                            options={[{ value: '', label: 'Select PO...' }, ...poList.map(o => ({
                                value: String(o.id),
                                label: `PO-${o.id} - ${o.supplier?.name} (${Number(o.total_amount).toLocaleString()})`
                            }))]}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Received By <span className="text-slate-400 font-normal">(Procurement Officer)</span></label>
                        <Combobox
                            value={receivedById}
                            onChange={(val) => setReceivedById(val)}
                            options={[{ value: '', label: 'Select procurement officer...' }, ...userList.map(u => ({
                                value: String(u.id),
                                label: u.name
                            }))]}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Payment Amount</label>
                        <input type="number" step="0.01" className={`${inputCls} font-mono text-lg`} value={amount} onChange={e => setAmount(parseFloat(e.target.value))} required />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Payment Method</label>
                        <select className={inputCls} value={method} onChange={e => {
                            setMethod(e.target.value);
                            if (e.target.value === 'CASH') setReference('');
                        }}>
                            <option value="CHECK">Check</option>
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="GCASH">GCash</option>
                        </select>
                    </div>
                    {method !== 'CASH' && (
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Reference / Check No.</label>
                            <input 
                                className={inputCls} 
                                value={reference} 
                                onChange={e => setReference(e.target.value)} 
                                required={method !== 'CASH'} 
                                placeholder="e.g. C-123456" 
                            />
                        </div>
                    )}
                    <div className="pt-2">
                        <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 w-full justify-center transition-colors">
                            <Save size={18} /> Process Disbursement
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Liquidation Modal */}
            <Modal isOpen={isLiquidateOpen} onClose={() => setIsLiquidateOpen(false)} title="Liquidate Disbursement" maxWidth="max-w-md">
                {selectedPayment && (
                    <form onSubmit={handleLiquidateSubmit} className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg mb-4">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Liquidating Payment</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">₱{Number(selectedPayment.amount).toLocaleString()}</div>
                            {selectedPayment.reference_number && (
                                <div className="text-xs text-slate-500">Ref: {selectedPayment.reference_number}</div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Actual Amount Spent</label>
                            <input type="number" step="0.01" className={`${inputCls} font-mono text-lg`} value={actualAmount} onChange={e => setActualAmount(parseFloat(e.target.value))} required />
                            {actualAmount < Number(selectedPayment.amount) && (
                                <div className="text-[10px] text-green-600 font-bold mt-1 uppercase">Refund to Company: ₱{(Number(selectedPayment.amount) - actualAmount).toLocaleString()}</div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Official Receipt / Invoice Number</label>
                            <input className={inputCls} value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} required placeholder="OR-XXXXXX" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Receipt Date</label>
                            <input type="date" className={inputCls} value={receiptDate} onChange={e => setReceiptDate(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Scan of Receipt <span className="text-slate-400 font-normal">(PDF or Image)</span></label>
                            <input type="file" className={inputCls} onChange={e => setReceiptFile(e.target.files[0])} accept=".pdf,image/*" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Liquidation Remarks</label>
                            <textarea className={inputCls} rows="3" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes regarding the liquidation..."></textarea>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={isUploading}
                                className="bg-green-600 hover:bg-green-500 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 w-full justify-center transition-colors disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                {isUploading ? 'Uploading to Vercel...' : 'Submit Liquidation'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}


