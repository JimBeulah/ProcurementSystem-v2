import React, { useState, useMemo } from 'react';
import Modal from '@/Components/UI/Modal';
import Select from '@/Components/UI/Select';
import { Package, Plus, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const RESOURCE_TYPES = [
    { value: 'MATERIAL', label: 'Material' },
    { value: 'LABOR', label: 'Labor' },
    { value: 'EQUIPMENT', label: 'Equipment' },
];

export default function MRCreateModal({
    isOpen,
    onClose,
    onSubmit,
    boqItems,
    submitting,
}) {
    const [selectedBoqItemId, setSelectedBoqItemId] = useState('');
    const [rows, setRows] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [cart, setCart] = useState([]);

    const selectedBoqItem = useMemo(
        () => boqItems?.find(b => b.id === Number(selectedBoqItemId)),
        [boqItems, selectedBoqItemId]
    );

    const clientBudget = useMemo(() => {
        if (!selectedBoqItem) return 0;
        return (Number(selectedBoqItem.material_unit_price) + Number(selectedBoqItem.labor_unit_price));
    }, [selectedBoqItem]);

    const handleBoqItemChange = (val) => {
        setSelectedBoqItemId(val);
        const item = boqItems?.find(b => b.id === Number(val));
        setRows(
            (item?.components || []).map(comp => ({
                id: `existing-${comp.id}`,
                type: 'existing',
                component: comp,
                qty: '',
                checked: false,
            }))
        );
    };

    const addNewResourceRow = () => {
        setRows(prev => [
            ...prev,
            {
                id: `new-${Date.now()}`,
                type: 'new',
                name: '',
                unit: '',
                resource_type: 'MATERIAL',
                qty: '',
                checked: true,
            },
        ]);
    };

    const updateRow = (id, field, value) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const removeRow = (id) => {
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleAddToCart = () => {
        if (!selectedBoqItemId) {
            toast.error('Select a BOQ item first.');
            return;
        }

        const checkedRows = rows.filter(r => r.checked);

        if (checkedRows.length === 0) {
            toast.error('Check at least one resource to add.');
            return;
        }

        const missingQty = checkedRows.filter(r => !r.qty || Number(r.qty) <= 0);
        if (missingQty.length > 0) {
            toast.error('Enter a quantity for every selected resource.');
            return;
        }

        const incompleteNew = checkedRows.filter(
            r => r.type === 'new' && (!r.name.trim() || !r.unit.trim())
        );
        if (incompleteNew.length > 0) {
            toast.error('Fill in name and unit for all new resources.');
            return;
        }

        const newItems = checkedRows.map(r => {
            if (r.type === 'existing') {
                return {
                    boq_item_id: Number(selectedBoqItemId),
                    boq_item_component_id: r.component.id,
                    is_new_resource: false,
                    item_description: r.component.name,
                    unit: r.component.unit || selectedBoqItem.unit,
                    quantity: Number(r.qty),
                    material_unit_price: 0,
                    labor_unit_price: 0,
                };
            }
            return {
                boq_item_id: Number(selectedBoqItemId),
                boq_item_component_id: null,
                is_new_resource: true,
                resource_type: r.resource_type,
                item_description: r.name.trim(),
                unit: r.unit.trim(),
                quantity: Number(r.qty),
                material_unit_price: 0,
                labor_unit_price: 0,
            };
        });

        setCart(prev => [...prev, ...newItems]);
        setSelectedBoqItemId('');
        setRows([]);
        toast.success(`${newItems.length} item(s) added to request.`);
    };

    const handleFormSubmit = () => {
        if (cart.length === 0) return;
        onSubmit({ items: cart, remarks });
    };

    const handleClose = () => {
        setSelectedBoqItemId('');
        setRows([]);
        setCart([]);
        setRemarks('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="New Resource Request" maxWidth="max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left panel — BOQ item + resource checklist */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Plus size={14} className="text-blue-500" /> Select Resources
                        </h3>

                        {/* BOQ Item selector */}
                        <div className="mb-4">
                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block tracking-wider">
                                BOQ Item
                            </label>
                            <Select
                                value={selectedBoqItemId}
                                onChange={handleBoqItemChange}
                                options={(boqItems || []).map(item => ({
                                    value: item.id.toString(),
                                    label: item.item_description,
                                }))}
                                placeholder="Select BOQ Item"
                                icon={Package}
                            />
                            {selectedBoqItem && (
                                <div className="mt-1.5 text-[10px] text-slate-500 flex justify-between">
                                    <span>{selectedBoqItem.unit} × {Number(selectedBoqItem.quantity).toLocaleString()}</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        Budget: ₱{Number(clientBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Resource checklist */}
                        {selectedBoqItemId && (
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">
                                    Resources
                                </label>

                                {rows.length === 0 && (
                                    <p className="text-[10px] text-slate-400 italic py-2">
                                        No resources yet. Click "Add Resource" below.
                                    </p>
                                )}

                                {rows.map(row => (
                                    <div
                                        key={row.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                            row.checked
                                                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={row.checked}
                                            onChange={e => updateRow(row.id, 'checked', e.target.checked)}
                                            className="shrink-0 accent-blue-600"
                                        />

                                        {row.type === 'existing' ? (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">
                                                        {row.component.name}
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 uppercase">
                                                        {row.component.resource_type} · {row.component.unit}
                                                    </div>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    placeholder="Qty"
                                                    value={row.qty}
                                                    onChange={e => updateRow(row.id, 'qty', e.target.value)}
                                                    disabled={!row.checked}
                                                    className="w-16 text-xs text-center border border-slate-300 dark:border-slate-600 rounded px-1 py-1 bg-white dark:bg-slate-900 disabled:opacity-40"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1 grid grid-cols-2 gap-1.5">
                                                    <input
                                                        type="text"
                                                        placeholder="Resource name"
                                                        value={row.name}
                                                        onChange={e => updateRow(row.id, 'name', e.target.value)}
                                                        className="col-span-2 text-[11px] border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Unit"
                                                        value={row.unit}
                                                        onChange={e => updateRow(row.id, 'unit', e.target.value)}
                                                        className="text-[11px] border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                                                    />
                                                    <select
                                                        value={row.resource_type}
                                                        onChange={e => updateRow(row.id, 'resource_type', e.target.value)}
                                                        className="text-[11px] border border-slate-300 dark:border-slate-600 rounded px-1 py-1 bg-white dark:bg-slate-900"
                                                    >
                                                        {RESOURCE_TYPES.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    placeholder="Qty"
                                                    value={row.qty}
                                                    onChange={e => updateRow(row.id, 'qty', e.target.value)}
                                                    className="w-16 text-xs text-center border border-slate-300 dark:border-slate-600 rounded px-1 py-1 bg-white dark:bg-slate-900"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(row.id)}
                                                    className="shrink-0 text-slate-300 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addNewResourceRow}
                                    className="w-full mt-1 py-1.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-[10px] font-bold text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors uppercase tracking-wider flex items-center justify-center gap-1"
                                >
                                    <Plus size={11} /> Add Resource
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 transition-colors"
                                >
                                    <ChevronRight size={13} /> Add to Request
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Remarks */}
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Remarks</label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded p-2 text-xs h-20 resize-none"
                            placeholder="Notes?"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>
                </div>

                {/* Right panel — Cart */}
                <div className="lg:col-span-7 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <Package size={14} className="text-blue-500" /> Requested Items
                    </h3>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-1 flex flex-col bg-white dark:bg-slate-800/80 max-h-[500px]">
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-[10px] text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-black tracking-widest text-[9px] sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 pl-4">Item</th>
                                        <th className="p-3">BOQ Item</th>
                                        <th className="p-3 text-center">Unit</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-center w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {cart.map((item, idx) => {
                                        const boqItem = boqItems?.find(b => b.id === item.boq_item_id);
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-3 pl-4">
                                                    <div className="font-medium">{item.item_description}</div>
                                                    {item.is_new_resource && (
                                                        <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                                                            NEW
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-slate-400 text-[9px] max-w-[120px] truncate">
                                                    {boqItem?.item_description || '—'}
                                                </td>
                                                <td className="p-3 text-center text-slate-500">{item.unit}</td>
                                                <td className="p-3 text-center text-cyan-600 font-bold">{item.quantity}</td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                                        className="text-slate-400 hover:text-red-500 font-bold text-base"
                                                    >
                                                        &times;
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {cart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400">
                                    <Package size={32} className="opacity-20 mb-3" />
                                    <div className="text-[10px] uppercase font-black opacity-50">Draft is Empty</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-slate-200">
                        <button onClick={handleClose} className="px-5 py-2.5 text-slate-500 text-xs font-bold uppercase rounded-lg">
                            Cancel
                        </button>
                        <button
                            onClick={handleFormSubmit}
                            disabled={cart.length === 0 || submitting}
                            className="bg-blue-600 px-6 py-2.5 rounded-lg text-white text-xs font-bold uppercase shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
