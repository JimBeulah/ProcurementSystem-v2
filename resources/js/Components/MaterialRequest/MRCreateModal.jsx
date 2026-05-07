import React, { useState, useMemo } from 'react';
import Modal from '@/Components/UI/Modal';
import Select from '@/Components/UI/Select';
import { Package, Box, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MRCreateModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    boqItems, 
    inventoryItems, 
    auth, 
    requests,
    submitting 
}) {
    const [selectedBoqItemId, setSelectedBoqItemId] = useState('');
    const [selectedComponentId, setSelectedComponentId] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [requestQty, setRequestQty] = useState('');
    const [requestUnit, setRequestUnit] = useState('');
    const [materialUnitPrice, setMaterialUnitPrice] = useState('');
    const [laborUnitPrice, setLaborUnitPrice] = useState('');
    const [remarks, setRemarks] = useState('');
    const [cart, setCart] = useState([]);
    const [authorizeOverride, setAuthorizeOverride] = useState(false);

    const selectedBoqItem = useMemo(() => 
        boqItems?.find(b => b.id === Number(selectedBoqItemId)),
    [boqItems, selectedBoqItemId]);

    const selectedComponent = useMemo(() => 
        selectedBoqItem?.components?.find(c => c.id === Number(selectedComponentId)),
    [selectedBoqItem, selectedComponentId]);

    const usage = useMemo(() => {
        if (!selectedComponent) return { qty: 0, cost: 0 };
        return requests.reduce((acc, mr) => {
            if (['REJECTED', 'CANCELLED'].includes(mr.status)) return acc;
            const item = mr.items?.find(i => i.boq_item_component_id === selectedComponent.id);
            if (item) {
                return {
                    qty: acc.qty + Number(item.quantity),
                    cost: acc.cost + (Number(item.quantity) * (Number(item.material_unit_price) + Number(item.labor_unit_price)))
                };
            }
            return acc;
        }, { qty: 0, cost: 0 });
    }, [requests, selectedComponent]);

    const totalBudgetQty = (selectedBoqItem && selectedComponent)
        ? (Number(selectedBoqItem.quantity) * Number(selectedComponent.quantity_factor))
        : 0;

    const totalBudgetCost = (selectedComponent)
        ? (totalBudgetQty * Number(selectedComponent.altapil_unit_rate || 0))
        : 0;

    const remainingQty = Math.max(0, totalBudgetQty - usage.qty);
    const remainingCost = Math.max(0, totalBudgetCost - usage.cost);

    const warehouseQuantity = useMemo(() => {
        if (!selectedComponent) return 0;
        const items = inventoryItems?.filter(i => 
            String(i.material_name).trim().toLowerCase() === String(selectedComponent.name).trim().toLowerCase()
        ) || [];
        return items.reduce((acc, current) => acc + Number(current.quantity), 0);
    }, [selectedComponent, inventoryItems]);

    const currentRequestCost = (Number(requestQty) || 0) * ((Number(materialUnitPrice) || 0) + (Number(laborUnitPrice) || 0));
    const isQtyExceeded = totalBudgetQty > 0 && Number(requestQty) > remainingQty;
    const isCostExceeded = totalBudgetCost > 0 && currentRequestCost > remainingCost;

    const handleBoqItemChange = (val) => {
        setSelectedBoqItemId(val);
        setSelectedComponentId('');
        setItemDescription('');
        setRequestUnit('');
        setMaterialUnitPrice('');
        setLaborUnitPrice('');
    };

    const handleComponentChange = (val) => {
        setSelectedComponentId(val);
        const component = selectedBoqItem?.components?.find(c => c.id === Number(val));
        if (component) {
            setItemDescription(component.name);
            setRequestUnit(component.unit || selectedBoqItem.unit);
            setMaterialUnitPrice(Number(component.altapil_unit_rate || 0).toString());
            setLaborUnitPrice('0');
        }
    };

    const addToCart = () => {
        if (!itemDescription || !requestQty || Number(requestQty) <= 0) return;
        if (isCostExceeded && !authorizeOverride) {
            toast.error("Cannot add: Request exceeds remaining budget.");
            return;
        }

        setCart([...cart, {
            boq_item_id: selectedBoqItemId || null,
            boq_item_component_id: selectedComponentId || null,
            item_description: itemDescription,
            quantity: Number(requestQty),
            unit: requestUnit,
            material_unit_price: Number(materialUnitPrice) || 0,
            labor_unit_price: Number(laborUnitPrice) || 0,
        }]);

        handleBoqItemChange('');
    };

    const handleFormSubmit = () => {
        if (cart.length === 0) return;
        onSubmit({ items: cart, remarks, authorize_override: authorizeOverride });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Resource Request" maxWidth="max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Plus size={14} className="text-blue-500" /> Add Item
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block tracking-wider">Select BOQ Item</label>
                                <Select
                                    value={selectedBoqItemId}
                                    onChange={handleBoqItemChange}
                                    options={(boqItems || []).map(item => ({
                                        value: item.id.toString(),
                                        label: item.item_description
                                    }))}
                                    placeholder="Select BOQ Item"
                                    icon={Package}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block tracking-wider">Select Resource</label>
                                <Select
                                    value={selectedComponentId}
                                    onChange={handleComponentChange}
                                    options={(selectedBoqItem?.components || []).map(comp => ({
                                        value: comp.id.toString(),
                                        label: `${comp.name} (${comp.resource_type})`
                                    }))}
                                    placeholder="Select Resource"
                                    icon={Box}
                                    disabled={!selectedBoqItemId}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-between items-center tracking-wider">
                                    <span>Item Description</span>
                                    {selectedComponent && (
                                        <span className="text-[9px] text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded shadow-sm">
                                            Warehouse Qty: {warehouseQuantity}
                                        </span>
                                    )}
                                </label>
                                <input readOnly className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-500 text-xs h-9 cursor-not-allowed" value={itemDescription} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Unit</label>
                                    <input readOnly className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-500 text-xs h-9 cursor-not-allowed" value={requestUnit} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Qty Request</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={`w-full bg-white dark:bg-slate-900 border rounded p-2 text-xs h-9 ${isQtyExceeded || isCostExceeded ? 'border-red-500 text-red-600' : 'border-slate-200'}`}
                                        value={requestQty}
                                        onChange={e => setRequestQty(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addToCart}
                                disabled={(isQtyExceeded || isCostExceeded) && !authorizeOverride}
                                className={`w-full px-4 py-2 rounded font-black text-[10px] uppercase transition-all shadow-lg h-9 flex items-center justify-center gap-1
                                    ${(isQtyExceeded || isCostExceeded) && !authorizeOverride ? 'bg-red-500/10 text-red-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                            >
                                {(isQtyExceeded || isCostExceeded) && !authorizeOverride ? 'Limit Exceeded' : 'Add Item'}
                            </button>
                            {(isQtyExceeded || isCostExceeded) && (
                                <div className="space-y-1">
                                    <p className="text-red-500 text-[10px] font-bold flex items-center gap-1">
                                        <AlertTriangle size={12} /> Request exceeds allocated limits.
                                    </p>
                                    {['admin', 'project_manager'].includes(auth.user.role) && (
                                        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 mt-2">
                                            <input type="checkbox" id="override" checked={authorizeOverride} onChange={e => setAuthorizeOverride(e.target.checked)} />
                                            <label htmlFor="override" className="text-[10px] font-bold text-amber-700 cursor-pointer">Authorize Budget Override</label>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Remarks</label>
                        <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded p-2 text-xs h-24 resize-none" placeholder="Notes?" value={remarks} onChange={e => setRemarks(e.target.value)}></textarea>
                    </div>
                </div>

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
                                        <th className="p-3 text-center">Unit</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-right">Est. Cost</th>
                                        <th className="p-3 text-center w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {cart.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="p-3 pl-4">
                                                <div className="font-medium">{item.item_description}</div>
                                            </td>
                                            <td className="p-3 text-center text-slate-500">{item.unit}</td>
                                            <td className="p-3 text-center text-cyan-600 font-bold">{item.quantity}</td>
                                            <td className="p-3 text-right text-slate-500 font-mono">₱{(((item.material_unit_price || 0) + (item.labor_unit_price || 0)) * item.quantity).toLocaleString()}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 font-bold text-base">&times;</button>
                                            </td>
                                        </tr>
                                    ))}
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
                        <button onClick={onClose} className="px-5 py-2.5 text-slate-500 text-xs font-bold uppercase rounded-lg">Cancel</button>
                        <button onClick={handleFormSubmit} disabled={cart.length === 0 || submitting} className="bg-blue-600 px-6 py-2.5 rounded-lg text-white text-xs font-bold uppercase shadow-lg shadow-blue-600/20">Submit Request</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
