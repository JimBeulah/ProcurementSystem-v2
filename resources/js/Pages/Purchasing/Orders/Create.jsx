import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Save, X, CheckCircle, Warehouse, TrendingUp } from 'lucide-react';
import Combobox from '@/Components/UI/Combobox';

// Threshold (%) above which a price variance warning is shown
const VARIANCE_THRESHOLD = 5;

function getPriceVariance(actualPrice, estimatedPrice) {
    if (!estimatedPrice || estimatedPrice <= 0) return null;
    return ((actualPrice - estimatedPrice) / estimatedPrice) * 100;
}

export default function CreatePurchaseOrder({ onSuccess, supplierReturn: propSupplierReturn }) {
    const { projects, suppliers, purchaseRequest, supplierReturn: pageSupplierReturn, inventoryMatches = {} } = usePage().props;
    const supplierReturn = propSupplierReturn || pageSupplierReturn;
    const hasInventoryMatches = Object.keys(inventoryMatches).length > 0;
    const [dismissedMatches, setDismissedMatches] = useState({});

    const [formData, setFormData] = useState({
        project_id: purchaseRequest?.project_id || supplierReturn?.project_id || '',
        supplier_id: supplierReturn?.supplier_id || '',
        remarks: purchaseRequest
            ? `PO for PR-${purchaseRequest.id.toString().padStart(5, '0')}`
            : (supplierReturn ? `Replacement PO for Return SR-${supplierReturn.id.toString().padStart(4, '0')}` : ''),
        purchase_request_id: purchaseRequest?.id || null,
        supplier_return_id: supplierReturn?.id || null
    });

    // Auto-fill items if PR exists — also store estimated_unit_cost for variance display
    const [items, setItems] = useState(() => {
        if (purchaseRequest?.items) {
            return purchaseRequest.items
                .filter(item => (item.quantity - (item.ordered_quantity || 0)) > 0)
                .map(item => ({
                    purchase_request_item_id: item.id,
                    material_name: item.item_description,
                    description: 'From PR',
                    quantity: item.quantity - (item.ordered_quantity || 0),
                    unit: item.unit,
                    unit_price: item.estimated_unit_cost || 0,
                    estimated_unit_cost: item.estimated_unit_cost || 0, // kept for variance display only
                }));
        }
        if (supplierReturn?.items) {
            return supplierReturn.items.map(item => ({
                material_name: item.material_name,
                description: `Replacement for Return SR-${supplierReturn.id}`,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price || 0,
                estimated_unit_cost: item.unit_price || 0,
            }));
        }
        return [];
    });

    const [submitting, setSubmitting] = useState(false);

    // Update a single field on an existing item row
    const handleItemChange = (idx, field, value) => {
        setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (items.length === 0) return;
        setSubmitting(true);
        // Strip estimated_unit_cost before sending — backend doesn't need it
        const payload = items.map(item => {
            const newItem = { ...item };
            delete newItem.estimated_unit_cost;
            return newItem;
        });
        router.post('/purchasing/orders', { ...formData, items: payload }, {
            onFinish: () => setSubmitting(false),
            onSuccess: () => {
                if (onSuccess) onSuccess();
            }
        });
    };

    // Summarize items that have a price variance above the threshold
    const overBudgetItems = items.filter(item => {
        if (item.description === 'Sourced from Warehouse') return false;
        const variance = getPriceVariance(parseFloat(item.unit_price), parseFloat(item.estimated_unit_cost));
        return variance !== null && variance > VARIANCE_THRESHOLD;
    });

    return (
        <div className="space-y-6">

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Smart Inventory Match Panel */}
                {hasInventoryMatches && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-500/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <Warehouse size={18} />
                            <span className="font-bold text-sm">Warehouse Stock Available</span>
                            <span className="text-xs font-normal opacity-70 ml-1">— Some requested items are in stock. Review before creating a PO.</span>
                        </div>
                        {Object.entries(inventoryMatches).map(([itemName, data]) => {
                            if (dismissedMatches[itemName]) return null;
                            const totalStock = data.stock.reduce((sum, s) => sum + parseFloat(s.quantity), 0);
                            return (
                                <div key={itemName} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/20 rounded-lg px-4 py-3 gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">{itemName}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            Requested: <span className="font-bold text-slate-700 dark:text-slate-300">{data.requested_qty} {data.unit}</span>
                                            &nbsp;&bull;&nbsp;
                                            In Warehouse: <span className="font-bold text-emerald-600">{totalStock.toFixed(2)} {data.unit}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const useQty = Math.min(totalStock, data.requested_qty);
                                                setItems(prev => {
                                                    const newItems = [];
                                                    prev.forEach(it => {
                                                        if (it.material_name === itemName) {
                                                            const remaining = Math.max(0, it.quantity - useQty);
                                                            if (remaining > 0) {
                                                                newItems.push({ ...it, quantity: remaining });
                                                            }
                                                            newItems.push({
                                                                ...it,
                                                                quantity: useQty,
                                                                unit_price: 0,
                                                                estimated_unit_cost: 0,
                                                                description: `Sourced from Warehouse`
                                                            });
                                                        } else {
                                                            newItems.push(it);
                                                        }
                                                    });
                                                    return newItems;
                                                });
                                                setDismissedMatches(d => ({ ...d, [itemName]: true }));
                                            }}
                                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95"
                                        >
                                            <CheckCircle size={13} /> Use from Warehouse
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDismissedMatches(d => ({ ...d, [itemName]: true }))}
                                            className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1.5 rounded-lg transition-colors"
                                        >
                                            Ignore
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Project</label>
                        <Combobox
                            value={formData.project_id}
                            onChange={v => setFormData({ ...formData, project_id: v })}
                            options={(projects || []).map(p => ({ value: p.id, label: p.name }))}
                            placeholder="Select Project..."
                            searchPlaceholder="Search projects..."
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-widest">Supplier</label>
                            <Link href="/purchasing/suppliers" className="text-[10px] text-blue-500 hover:text-blue-600 font-bold uppercase tracking-wider">
                                + Add New
                            </Link>
                        </div>
                        <Combobox
                            value={formData.supplier_id}
                            onChange={v => setFormData({ ...formData, supplier_id: v })}
                            options={[
                                { value: '', label: 'None (Internal Fulfill / Optional)' },
                                ...(suppliers || []).map(s => ({ value: s.id, label: s.name })),
                            ]}
                            placeholder="None (Internal Fulfill / Optional)"
                            searchPlaceholder="Search suppliers..."
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Remarks / Delivery Instructions</label>
                        <textarea className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white h-20 focus:border-blue-500 outline-none" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                    </div>
                </div>

                {/* Price Variance Warning Banner */}
                {overBudgetItems.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <TrendingUp size={18} />
                            <span className="font-bold text-sm">Price Variance Detected</span>
                            <span className="text-xs font-normal opacity-70 ml-1">
                                — {overBudgetItems.length} item{overBudgetItems.length > 1 ? 's are' : ' is'} above the estimated budget by more than {VARIANCE_THRESHOLD}%.
                            </span>
                        </div>
                        <div className="space-y-1">
                            {overBudgetItems.map((item, i) => {
                                const variance = getPriceVariance(parseFloat(item.unit_price), parseFloat(item.estimated_unit_cost));
                                const diff = parseFloat(item.unit_price) - parseFloat(item.estimated_unit_cost);
                                return (
                                    <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-2 text-sm">
                                        <span className="font-medium text-slate-900 dark:text-white">{item.material_name}</span>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-slate-400">
                                                Estimated: <span className="font-bold text-slate-600 dark:text-slate-300">₱{parseFloat(item.estimated_unit_cost).toLocaleString()}</span>
                                            </span>
                                            <span className="text-slate-400">→</span>
                                            <span className="text-slate-400">
                                                Actual: <span className="font-bold text-red-600">₱{parseFloat(item.unit_price).toLocaleString()}</span>
                                            </span>
                                            <span className="font-bold text-red-600 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded-md">
                                                +₱{diff.toLocaleString()} (+{variance.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 opacity-70 pt-1">
                            You may still proceed. The procurement head will review pricing during PO approval.
                        </p>
                    </div>
                )}


                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order Items</h2>
                        {purchaseRequest && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                                Unit prices pre-filled from PR estimates — update with canvassed supplier prices.
                            </span>
                        )}
                    </div>

                    <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-3">Material</th>
                                <th className="p-3 text-right w-24">Qty</th>
                                <th className="p-3 text-right w-52">Unit Price (Canvassed)</th>
                                <th className="p-3 text-right w-36">Total</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {items.map((item, idx) => {
                                const isWarehouse = item.description === 'Sourced from Warehouse';
                                const variance = !isWarehouse
                                    ? getPriceVariance(parseFloat(item.unit_price || 0), parseFloat(item.estimated_unit_cost || 0))
                                    : null;
                                const hasVariance = variance !== null && variance > VARIANCE_THRESHOLD;
                                const hasDiscount = variance !== null && variance < -VARIANCE_THRESHOLD;

                                return (
                                    <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${isWarehouse ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''} ${hasVariance ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div className="text-slate-900 dark:text-white font-medium">{item.material_name}</div>
                                                {isWarehouse && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-md">
                                                        <Warehouse size={10} /> Internal
                                                    </span>
                                                )}
                                                {hasVariance && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-md">
                                                        <TrendingUp size={10} /> +{variance.toFixed(0)}% over
                                                    </span>
                                                )}
                                                {hasDiscount && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                                                        ↓ {Math.abs(variance).toFixed(0)}% under
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400">{item.description}</div>
                                        </td>
                                        <td className="p-3 text-right font-mono">{item.quantity}</td>
                                        <td className="p-3 text-right">
                                            {isWarehouse ? (
                                                <span className="text-slate-400 font-mono">—</span>
                                            ) : (
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={e => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        className={`w-36 text-right font-mono bg-slate-50 dark:bg-slate-900/50 border rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none transition-colors ${
                                                            hasVariance
                                                                ? 'border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-900/10'
                                                                : hasDiscount
                                                                ? 'border-emerald-400 focus:border-emerald-500'
                                                                : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    {item.estimated_unit_cost > 0 && (
                                                        <span className="text-[10px] text-slate-400">
                                                            Est. ₱{parseFloat(item.estimated_unit_cost).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className={`p-3 text-right font-mono font-bold ${isWarehouse ? 'text-slate-400' : hasVariance ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {isWarehouse ? '—' : (item.quantity * parseFloat(item.unit_price || 0)).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 transition-colors">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400 text-sm">No items added yet.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                            <tr>
                                <td colSpan={3} className="p-3 text-right uppercase text-xs tracking-widest">Grand Total</td>
                                <td className="p-3 text-right text-emerald-600 text-lg font-mono">
                                    {items.filter(i => i.description !== 'Sourced from Warehouse').reduce((sum, i) => sum + (i.quantity * parseFloat(i.unit_price || 0)), 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting || items.length === 0}
                        className={`${items.every(i => i.description === 'Sourced from Warehouse') ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'} text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors active:scale-95 disabled:opacity-50 shadow-lg`}
                    >
                        <Save size={18} />
                        {items.length > 0 && items.every(i => i.description === 'Sourced from Warehouse') ? 'Process Internal Release Only' : 'Issue Purchase Order'}
                    </button>
                </div>
            </form>
        </div>
    );
}
