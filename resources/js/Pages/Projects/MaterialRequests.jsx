import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import Drawer from '@/Components/UI/Drawer';
import DataTable from '@/Components/UI/DataTable';
import Select from '@/Components/UI/Select';
import { Truck, Plus, Package, Box, AlertTriangle, Info, CheckCircle2, User, Calendar } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function ProjectMaterialRequests() {
    const { project, materialRequests: initialMRs, boqItems, inventoryItems, flash } = usePage().props;
    const requests = initialMRs || [];

    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New additions for Drawer and DataTable
    const [selectedMr, setSelectedMr] = useState(null);
    const [showDrawer, setShowDrawer] = useState(false);

    const columns = useMemo(() => [
        {
            accessorKey: 'id',
            header: 'MR Number',
            cell: info => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">MR-{(info.getValue() || '').toString().padStart(5, '0')}</span>,
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

    // Show Flash Messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
    }, [flash]);

    // Derived state for budget
    const selectedBoqItem = boqItems?.find(b => b.id === Number(selectedBoqItemId));
    const selectedComponent = selectedBoqItem?.components?.find(c => c.id === Number(selectedComponentId));

    // Calculate Usage History (PENDING + APPROVED)
    const usage = React.useMemo(() => {
        if (!selectedComponent) return { qty: 0, cost: 0 };
        return requests.reduce((acc, mr) => {
            if (mr.status === 'REJECTED') return acc; // Ignore rejected
            const item = mr.items?.find(i => i.boq_item_component_id === selectedComponent.id);
            if (item) {
                acc.qty += Number(item.quantity);
                acc.cost += Number(item.quantity) * (Number(item.material_unit_price) + Number(item.labor_unit_price));
            }
            return acc;
        }, { qty: 0, cost: 0 });
    }, [requests, selectedComponent]);

    // Budget Calculations
    const totalBudgetQty = (selectedBoqItem && selectedComponent)
        ? (Number(selectedBoqItem.quantity) * Number(selectedComponent.quantity_factor))
        : 0;

    // Altapil Budget = Total Qty * Altapil Unit Rate
    const totalBudgetCost = (selectedComponent)
        ? (totalBudgetQty * Number(selectedComponent.altapil_unit_rate || 0))
        : 0;

    const remainingQty = Math.max(0, totalBudgetQty - usage.qty);
    const remainingCost = Math.max(0, totalBudgetCost - usage.cost);

    const warehouseQuantity = React.useMemo(() => {
        if (!selectedComponent) return 0;

        // Debugging
        console.log("Selected Component Name:", selectedComponent.name);
        console.log("Inventory Items:", inventoryItems);

        const items = inventoryItems?.filter(i => {
            // Trim strings to avoid hidden whitespace mismatches
            const isMatch = String(i.material_name).trim().toLowerCase() === String(selectedComponent.name).trim().toLowerCase();
            return isMatch;
        }) || [];

        return items.reduce((acc, current) => acc + Number(current.quantity), 0);
    }, [selectedComponent, inventoryItems]);

    // Current Request Calculations
    const currentRequestCost = (Number(requestQty) || 0) * ((Number(materialUnitPrice) || 0) + (Number(laborUnitPrice) || 0));

    // Validation flags
    const isQtyExceeded = totalBudgetQty > 0 && Number(requestQty) > remainingQty;
    const isCostExceeded = totalBudgetCost > 0 && currentRequestCost > remainingCost;
    const hasAltapilBudget = totalBudgetCost > 0;

    const addToCart = () => {
        if (!itemDescription || !requestQty || Number(requestQty) <= 0) return;
        if (isCostExceeded) {
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
            setRequestUnit(component.unit || boqItem.unit);
            // Default to Client Rate for display/editing? Or Altapil? 
            // Usually MR reflects actual purchase price. Let's pre-fill with Altapil Rate as a "Target"
            setMaterialUnitPrice(Number(component.altapil_unit_rate || 0).toString());
            setLaborUnitPrice('0');
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Material Requests - ${project.name}`} />
            <Toaster position="top-right" richColors />

            <div className="space-y-6 max-w-7xl mx-auto">


                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Truck className="text-blue-600" /> Material Requests
                        </h1>
                        <p className="text-slate-500">Request materials from warehouse or procurement.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-xs font-bold shadow-lg shadow-blue-600/20 active:scale-95">
                        <Plus size={18} /> Create Request
                    </button>
                </header>

                {/* MR Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative z-0">
                    <DataTable
                        columns={columns}
                        data={requests}
                        showSearch={true}
                        showPagination={true}
                        onRowClick={(row) => { setSelectedMr(row); setShowDrawer(true); }}
                    />
                </div>

                {/* Create MR Modal */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Material Request" maxWidth="max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Form (5 cols) */}
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

                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-between items-center tracking-wider">
                                            <span>Item Description</span>
                                            {selectedComponent && (
                                                <span className="text-[9px] text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded shadow-sm">
                                                    Warehouse Qty: {warehouseQuantity}
                                                </span>
                                            )}
                                        </label>
                                        <input readOnly={true} className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-500 dark:text-slate-400 text-xs outline-none h-9 cursor-not-allowed" value={itemDescription} placeholder="Item description" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Unit</label>
                                            <input readOnly={true} className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-500 dark:text-slate-400 text-xs outline-none h-9 cursor-not-allowed" value={requestUnit} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">
                                                Qty Request
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`w-full bg-white dark:bg-slate-900 border rounded p-2 text-slate-900 dark:text-white text-xs h-9 ${isQtyExceeded || isCostExceeded ? 'border-red-500 text-red-600 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500'}`}
                                                value={requestQty}
                                                onChange={e => setRequestQty(e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={addToCart}
                                            disabled={isQtyExceeded || isCostExceeded}
                                            className={`w-full px-4 py-2 rounded font-black text-[10px] uppercase transition-all shadow-lg h-9 flex items-center justify-center gap-1 mt-2
                                                ${isQtyExceeded || isCostExceeded
                                                    ? 'bg-red-500/10 text-red-500 cursor-not-allowed border border-red-500/20'
                                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-95'}`}
                                        >
                                            {isQtyExceeded || isCostExceeded ? 'Limit Exceeded' : 'Add Item'}
                                        </button>
                                    </div>

                                    {/* Detailed Validation Warnings - GENERIC FOR BLIND BUDGETING */}
                                    <div className="space-y-1 mt-2">
                                        {(isQtyExceeded || isCostExceeded) && (
                                            <p className="text-red-500 text-[10px] font-bold flex items-center gap-1">
                                                <AlertTriangle size={12} /> Request exceeds allocated limits.
                                            </p>
                                        )}
                                    </div>

                                    {/* Price Inputs - HIDDEN, Auto-Calculated via Altapil Rate */}
                                    <div className="hidden mt-2 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Mat. Price</label>
                                            <input type="number" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs text-slate-400" value={materialUnitPrice} readOnly placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Lab. Price</label>
                                            <input type="number" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs text-slate-400" value={laborUnitPrice} readOnly placeholder="0.00" />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Remarks</label>
                                <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white h-24 text-xs resize-none" placeholder="Any special instructions or notes?" value={remarks} onChange={e => setRemarks(e.target.value)}></textarea>
                            </div>
                        </div>

                        {/* Right Column: Cart (7 cols) */}
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
                                            {cart.map((item, idx) => {
                                                const total = ((item.material_unit_price || 0) + (item.labor_unit_price || 0)) * item.quantity;
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="p-3 pl-4">
                                                            <div className="font-medium text-slate-900 dark:text-white">{item.item_description}</div>
                                                            {item.boq_item_id && (
                                                                <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                                    <span>BOQ Item</span>
                                                                    <span>&bull;</span>
                                                                    <span className="text-blue-500 font-bold">
                                                                        WH Qty: {(inventoryItems?.filter(i => String(i.material_name).trim().toLowerCase() === String(item.item_description).trim().toLowerCase()) || []).reduce((acc, current) => acc + Number(current.quantity), 0)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center text-slate-500">{item.unit}</td>
                                                        <td className="p-3 text-center text-cyan-600 font-mono font-bold">{item.quantity}</td>
                                                        <td className="p-3 text-right text-slate-500 font-mono">₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                        <td className="p-3 text-center">
                                                            <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 transition-colors font-bold text-base w-6 h-6 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center">&times;</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {cart.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400">
                                            <Package size={32} className="opacity-20 mb-3" />
                                            <div className="text-[10px] uppercase font-black tracking-[0.2em] opacity-50">Draft is Empty</div>
                                            <p className="text-xs text-slate-500 mt-2">Add items from the form on the left</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit controls */}
                            <div className="flex justify-end gap-3 mt-4 mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                                <button onClick={handleSubmit} disabled={cart.length === 0 || submitting} className="bg-blue-600 px-6 py-2.5 rounded-lg text-white font-medium hover:bg-blue-500 disabled:opacity-50 text-xs font-bold uppercase transition-colors shadow-lg shadow-blue-600/20">Submit Request</button>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Drawer for MR Details */}
                <Drawer
                    isOpen={showDrawer}
                    onClose={() => setShowDrawer(false)}
                    title={selectedMr ? `MR-${selectedMr.id.toString().padStart(5, '0')} Details` : 'MR Details'}
                >
                    {selectedMr && (
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
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${selectedMr.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : selectedMr.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>{selectedMr.status}</span>
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
                                                ₱{selectedMr.items.reduce((sum, item) => sum + ((Number(item.material_unit_price) || 0) + (Number(item.labor_unit_price) || 0)) * Number(item.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
                                        <p className="text-slate-400 text-xs italic">No items listed.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Drawer>
            </div>
        </AuthenticatedLayout>
    );
}
