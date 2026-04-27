import React from 'react';
import Drawer from '@/Components/UI/Drawer';
import { Package } from 'lucide-react';

export default function MRDetailsDrawer({ isOpen, onClose, selectedMr, onCancel }) {
    if (!selectedMr) return null;

    const styles = {
        PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        DECLINED: 'bg-red-500/10 text-red-600 border-red-500/20',
        CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
        PARTIALLY_FULFILLED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        FULFILLED: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    };

    const totalCost = (selectedMr.items || []).reduce((sum, item) => 
        sum + ((Number(item.material_unit_price) || 0) + (Number(item.labor_unit_price) || 0)) * Number(item.quantity), 0
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={`MR-${selectedMr.id.toString().padStart(5, '0')} Details`}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Requested By</label>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{selectedMr.requester?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Date</label>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{new Date(selectedMr.request_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                        <div className="mt-1">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[selectedMr.status] || styles.PENDING}`}>
                                {selectedMr.status}
                            </span>
                        </div>
                    </div>
                    {selectedMr.remarks && (
                        <div className="col-span-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400">Remarks</label>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedMr.remarks}</p>
                        </div>
                    )}
                </div>

                {/* Items List */}
                <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <Package size={14} className="text-blue-500" /> Requested Items
                    </h3>

                    {selectedMr.items?.length > 0 ? (
                        <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-x-auto shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[9px] font-bold tracking-wider">
                                    <tr>
                                        <th className="p-3">Item Description</th>
                                        <th className="p-3 text-center">Unit</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-right">Mat. Val</th>
                                        <th className="p-3 text-right">Lab. Val</th>
                                        <th className="p-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {selectedMr.items.map(item => {
                                        const matTotal = (Number(item.material_unit_price) || 0) * Number(item.quantity);
                                        const labTotal = (Number(item.labor_unit_price) || 0) * Number(item.quantity);
                                        const rowTotal = matTotal + labTotal;
                                        return (
                                            <tr key={item.id} className="text-[11px] bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                                                    <div>{item.item_description}</div>
                                                    {item.boq_item_component && <div className="text-[9px] text-slate-400 mt-1 uppercase">Ref: {item.boq_item?.item_description}</div>}
                                                </td>
                                                <td className="p-3 text-center text-slate-500 uppercase">{item.unit}</td>
                                                <td className="p-3 text-center font-mono text-cyan-600">{Number(item.quantity).toFixed(2)}</td>
                                                <td className="p-3 text-right font-mono text-slate-500">₱{matTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right font-mono text-slate-500">₱{labTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right font-mono font-bold text-emerald-600">₱{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-2.5 border-t border-slate-200 dark:border-slate-700 text-right">
                                <span className="text-[10px] font-bold text-slate-500 uppercase mr-3">Total</span>
                                <span className="text-sm font-mono font-bold text-emerald-600">
                                    ₱{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
                            <p className="text-slate-400 text-xs italic">No items listed.</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {selectedMr.can?.cancel && (
                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => onCancel(selectedMr)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-red-200 dark:border-red-500/20"
                        >
                            Cancel Request
                        </button>
                    </div>
                )}
            </div>
        </Drawer>
    );
}
