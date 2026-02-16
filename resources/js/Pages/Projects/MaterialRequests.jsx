import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import Select from '@/Components/UI/Select';
import { Truck, Plus, Package, Box } from 'lucide-react';

export default function ProjectMaterialRequests() {
    const { project, materialRequests: initialMRs, boqItems } = usePage().props;
    const requests = initialMRs || [];

    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Cart state
    const [selectedBoqItemId, setSelectedBoqItemId] = useState('');
    const [selectedComponentId, setSelectedComponentId] = useState('');
    const [itemDescription, setItemDescription] = useState('');

    const [requestQty, setRequestQty] = useState('');
    const [requestUnit, setRequestUnit] = useState('');
    const [materialUnitPrice, setMaterialUnitPrice] = useState('');
    const [laborUnitPrice, setLaborUnitPrice] = useState('');
    const [remarks, setRemarks] = useState('');
    const [cart, setCart] = useState([]);

    // Derived state for budget
    const selectedBoqItem = boqItems?.find(b => b.id === Number(selectedBoqItemId));
    const selectedComponent = selectedBoqItem?.components?.find(c => c.id === Number(selectedComponentId));

    const maxBudgetQty = selectedBoqItem && selectedComponent
        ? (Number(selectedBoqItem.quantity) * Number(selectedComponent.quantity_factor))
        : 0;

    const addToCart = () => {
        if (!itemDescription || !requestQty || Number(requestQty) <= 0) return;
        setCart([...cart, {
            boq_item_id: selectedBoqItemId || null,
            boq_item_component_id: selectedComponentId || null,
            item_description: itemDescription,
            quantity: Number(requestQty),
            unit: requestUnit,
            material_unit_price: Number(materialUnitPrice) || 0,
            labor_unit_price: Number(laborUnitPrice) || 0,
        }]);

        // Reset form
        setSelectedBoqItemId('');
        setSelectedComponentId('');
        setItemDescription('');
        setRequestQty('');
        setRequestUnit('');
        setMaterialUnitPrice('');
        setLaborUnitPrice('');
    };

    const handleSubmit = () => {
        if (cart.length === 0) return;
        setSubmitting(true);
        router.post(`/projects/${project.id}/material-requests`, { items: cart, remarks }, {
            onSuccess: () => { setShowModal(false); setCart([]); setRemarks(''); },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleBoqItemChange = (val) => {
        const id = val;
        setSelectedBoqItemId(id);
        setSelectedComponentId('');
        setItemDescription('');
        setRequestUnit('');
        setMaterialUnitPrice('');
        setLaborUnitPrice('');
    };

    const handleComponentChange = (val) => {
        const id = val;
        setSelectedComponentId(id);

        const boqItem = boqItems.find(b => b.id === Number(selectedBoqItemId));
        const component = boqItem?.components?.find(c => c.id === Number(id));

        if (component) {
            setItemDescription(component.name);
            setRequestUnit(boqItem.unit);
            setMaterialUnitPrice(Number(component.unit_rate).toString());
            setLaborUnitPrice('0');
        }
    };

    // Helper to calculate total value
    const calculateTotal = (items) => items.reduce((acc, item) => {
        const mat = (Number(item.material_unit_price) || 0) * Number(item.quantity);
        const lab = (Number(item.labor_unit_price) || 0) * Number(item.quantity);
        return acc + mat + lab;
    }, 0);

    return (
        <AuthenticatedLayout>
            <Head title={`Material Requests - ${project.name}`} />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {/* Breadcrumb + Header */}
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Link href="/projects" className="hover:text-cyan-600 transition-colors">Projects</Link>
                    <span>/</span>
                    <Link href={`/projects/${project.id}`} className="hover:text-cyan-600 transition-colors">{project.name}</Link>
                    <span>/</span>
                    <span className="text-slate-900 dark:text-white font-medium">Material Requests</span>
                </div>

                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Truck className="text-blue-600" /> Material Requests
                        </h1>
                        <p className="text-slate-500">Request materials from warehouse or procurement.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-xs font-bold">
                        <Plus size={18} /> Create Request
                    </button>
                </header>

                {/* MR Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 min-w-[250px]">Item Description</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Unit</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Qty</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Mat. Unit</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Mat. Total</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Lab. Unit</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Lab. Total</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {requests.map(mr => (
                                <React.Fragment key={mr.id}>
                                    <tr className="bg-blue-600/5 border-b border-slate-200/50 dark:border-slate-700/50">
                                        <td colSpan={8} className="p-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-blue-600 font-black text-sm uppercase tracking-widest">MR #{mr.id}</span>
                                                    <span className="text-slate-500 text-[10px] font-medium">| {new Date(mr.request_date).toLocaleDateString()}</span>
                                                    <span className="text-slate-500 text-[10px] font-medium">| By: {mr.requester?.name}</span>
                                                    {mr.remarks && <span className="text-slate-400 text-[10px] italic truncate max-w-sm">"{mr.remarks}"</span>}
                                                </div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${mr.status === 'PENDING' ? 'border-yellow-500/50 text-yellow-600 bg-yellow-500/5' : mr.status === 'APPROVED' ? 'border-emerald-500/50 text-emerald-600 bg-emerald-500/5' : 'border-slate-300 text-slate-500 bg-slate-100 dark:border-slate-600 dark:bg-slate-700'}`}>
                                                    {mr.status}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    {mr.items?.map(item => {
                                        const matTotal = (Number(item.material_unit_price) || 0) * Number(item.quantity);
                                        const labTotal = (Number(item.labor_unit_price) || 0) * Number(item.quantity);
                                        const rowTotal = matTotal + labTotal;
                                        return (
                                            <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                                <td className="p-4 pl-8 text-slate-900 dark:text-white relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 border-l border-b border-slate-300 dark:border-slate-600 rounded-bl-sm"></div>
                                                    <div className="flex flex-col">
                                                        <span>{item.item_description}</span>
                                                        {item.boq_item_component && <span className="text-[9px] text-slate-400 uppercase tracking-tighter">Ref: {item.boq_item?.item_description}</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-slate-500 uppercase">{item.unit}</td>
                                                <td className="p-4 text-center font-mono text-cyan-600">{item.quantity}</td>
                                                <td className="p-4 text-right font-mono text-[11px] italic text-slate-500">{Number(item.material_unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-300">{matTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-4 text-right font-mono text-[11px] italic text-slate-500">{Number(item.labor_unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-4 text-right font-mono text-slate-500">{labTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-4 text-right font-mono text-emerald-600 font-bold">{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {requests.length === 0 && (
                        <div className="p-20 text-center">
                            <Truck size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-400 uppercase tracking-widest font-bold">No Material Requests Found</p>
                        </div>
                    )}
                </div>

                {/* Create MR Modal */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Material Request">
                    <div className="space-y-4">
                        {/* Item Entry */}
                        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block tracking-wider">Select Resource (Component)</label>
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block tracking-wider">Item Description</label>
                                    <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-xs focus:border-blue-500 outline-none h-9" value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="Item description" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Unit</label>
                                    <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-xs h-9" value={requestUnit} onChange={e => setRequestUnit(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">
                                        Qty
                                        {maxBudgetQty > 0 && <span className="ml-1 text-emerald-500 text-[9px]">(Max: {maxBudgetQty.toFixed(2)})</span>}
                                    </label>
                                    <input type="number" step="0.01" className={`w-full bg-white dark:bg-slate-900 border rounded p-2 text-slate-900 dark:text-white text-xs h-9 ${maxBudgetQty > 0 && Number(requestQty) > maxBudgetQty ? 'border-red-500 text-red-600' : 'border-slate-200 dark:border-slate-700'}`} value={requestQty} onChange={e => setRequestQty(e.target.value)} />
                                </div>
                                <div className="hidden">
                                    {/* Hidden price inputs, autofilled but editable if needed next time */}
                                    <input type="number" value={materialUnitPrice} onChange={e => setMaterialUnitPrice(e.target.value)} />
                                    <input type="number" value={laborUnitPrice} onChange={e => setLaborUnitPrice(e.target.value)} />
                                </div>
                                <div>
                                    <button type="button" onClick={addToCart} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-black text-[10px] uppercase transition-all active:scale-95 shadow-lg shadow-blue-600/20 h-9">Add</button>
                                </div>
                            </div>
                            {maxBudgetQty > 0 && Number(requestQty) > maxBudgetQty && (
                                <p className="text-red-500 text-[10px] mt-1 font-bold">⚠️ Warning: Reduces exceeds calculated budget ({maxBudgetQty.toFixed(2)}). Admin will be notified.</p>
                            )}
                        </div>

                        {/* Cart */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
                            <table className="w-full text-[10px] text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-black tracking-widest text-[9px]">
                                    <tr>
                                        <th className="p-3 pl-4">Item</th>
                                        <th className="p-3 text-center">Unit</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-right">Est. Cost</th>
                                        <th className="p-3 text-center w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {cart.map((item, idx) => {
                                        const total = ((item.material_unit_price || 0) + (item.labor_unit_price || 0)) * item.quantity;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="p-3 pl-4">
                                                    <div className="font-medium text-slate-900 dark:text-white">{item.item_description}</div>
                                                    {item.boq_item_id && <div className="text-[9px] text-slate-400">BOQ Linked</div>}
                                                </td>
                                                <td className="p-3 text-center text-slate-500">{item.unit}</td>
                                                <td className="p-3 text-center text-cyan-600 font-mono">{item.quantity}</td>
                                                <td className="p-3 text-right text-slate-500 font-mono">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-center"><button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 transition-colors font-bold text-base">&times;</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {cart.length === 0 && <div className="text-center text-slate-400 text-[10px] py-10 uppercase font-black tracking-[0.2em] opacity-30">Draft is Empty</div>}
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Remarks</label>
                            <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white h-20 text-xs" value={remarks} onChange={e => setRemarks(e.target.value)}></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase">Cancel</button>
                            <button onClick={handleSubmit} disabled={cart.length === 0 || submitting} className="bg-blue-600 px-4 py-2 rounded text-white font-medium hover:bg-blue-500 disabled:opacity-50 text-xs font-bold uppercase">Submit Request</button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
