import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Save, Trash2, Calculator, Hammer, Home, Car, Settings, ChevronRight, ChevronLeft, Check, Layers } from 'lucide-react';
import Modal from '@/Components/UI/Modal';

const INITIAL_STATE = {
    itemDescription: '',
    unit: '',
    materialUnitPrice: 0,
    laborUnitPrice: 0,
    quantity: 0,
    isCarport: false,
    components: [],
};

const STEPS = [
    { label: 'Item Info', icon: Layers },
    { label: 'Resources', icon: Settings },
    { label: 'Review', icon: Check },
];

export default function AddBoqItemWizard({ isOpen, onClose, onSubmit, materials = [], units = [] }) {
    const [step, setStep] = useState(0);
    const [item, setItem] = useState({ ...INITIAL_STATE });
    const [errors, setErrors] = useState({});
    const [batchMode, setBatchMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const descRef = useRef(null);
    const resourceListRef = useRef(null);

    // Auto-focus description on open
    useEffect(() => {
        if (isOpen && step === 0) {
            setTimeout(() => descRef.current?.focus(), 150);
        }
    }, [isOpen, step]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (step === 2) handleSubmit(); // Fixed: changed from handleSubmit to arrow function to avoid closure staleness if any? No, handleSubmit is const.
                else handleNext();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, step, item]); // Added item dependency to ensure latest state is used

    const resetForm = useCallback(() => {
        setItem({ ...INITIAL_STATE });
        setStep(0);
        setErrors({});
    }, []);

    // Validation
    const validateStep = (s) => {
        const errs = {};
        if (s === 0) {
            if (!item.itemDescription.trim()) errs.itemDescription = 'Description is required';
            if (!item.unit.trim()) errs.unit = 'Unit is required';
            if (!item.quantity || item.quantity <= 0) errs.quantity = 'Quantity must be > 0';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 2));
        }
    };

    const handleBack = () => setStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        if (!validateStep(0)) { setStep(0); return; }
        setSubmitting(true);

        // Pass the item to the parent - ensure consistent casing
        // Backend likely expects snake_case or specific fields
        const payload = {
            ...item,
            quantity: Number(item.quantity),
            material_unit_price: item.materialUnitPrice,
            labor_unit_price: item.laborUnitPrice,
        };

        const success = await onSubmit(payload);
        setSubmitting(false);
        // If onSubmit returns a promise that resolves to true/false, use that.
        // If it void, we assume success? 
        // In Boq.jsx, handleWizardSubmit is async.

        if (success !== false) {
            if (batchMode) {
                resetForm();
            } else {
                resetForm();
                onClose();
            }
        }
    };

    // Component helpers
    const addComponent = () => {
        setItem(prev => ({
            ...prev,
            components: [...prev.components, { resourceType: 'MATERIAL', name: '', quantityFactor: 0, unitRate: 0, noOfPersons: 0, hours: 0 }]
        }));
        // Auto-scroll to bottom after React re-renders the new row
        setTimeout(() => {
            resourceListRef.current?.scrollTo({ top: resourceListRef.current.scrollHeight, behavior: 'smooth' });
        }, 50);
    };

    const removeComponent = (index) => {
        setItem(prev => ({
            ...prev,
            components: prev.components.filter((_, i) => i !== index)
        }));
    };

    const updateComponent = (index, field, value) => {
        const newComponents = [...item.components];
        const comp = { ...newComponents[index], [field]: value };

        if (comp.resourceType !== 'MATERIAL') {
            const persons = field === 'noOfPersons' ? Number(value) : (comp.noOfPersons || 0);
            const hours = field === 'hours' ? Number(value) : (comp.hours || 0);
            const totalQty = Number(item.quantity) || 1;

            // Logic from source: update quantityFactor based on persons/hours
            if (field === 'noOfPersons' || field === 'hours' || field === 'resourceType') {
                comp.quantityFactor = (persons * hours) / totalQty;
            }
        }

        newComponents[index] = comp;

        const matCosts = newComponents
            .filter(c => c.resourceType === 'MATERIAL')
            .reduce((sum, c) => sum + (Number(c.quantityFactor) * Number(c.unitRate)), 0);
        const labCosts = newComponents
            .filter(c => c.resourceType === 'LABOR' || c.resourceType === 'EQUIPMENT')
            .reduce((sum, c) => sum + (Number(c.quantityFactor) * Number(c.unitRate)), 0);

        setItem(prev => ({
            ...prev,
            components: newComponents,
            materialUnitPrice: matCosts,
            laborUnitPrice: labCosts,
        }));
    };

    const combinedTotal = ((item.materialUnitPrice || 0) + (item.laborUnitPrice || 0)) * (item.quantity || 0);

    // Close handler that also resets
    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add BOQ Item" maxWidth="max-w-2xl">
            {/* Stepper Header */}
            <div className="flex items-center justify-between mb-6 -mt-1 px-1">
                {STEPS.map((s, i) => {
                    const isActive = step === i;
                    const isComplete = step > i;
                    return (
                        <React.Fragment key={i}>
                            <button
                                type="button"
                                onClick={() => { if (isComplete) setStep(i); }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-orange-500/15 text-orange-500 border border-orange-500/30' :
                                    isComplete ? 'bg-emerald-500/10 text-emerald-500 cursor-pointer hover:bg-emerald-500/20' :
                                        'text-slate-400 opacity-50 cursor-default'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${isActive ? 'bg-orange-500 text-white' :
                                    isComplete ? 'bg-emerald-500 text-white' :
                                        'bg-slate-200 text-slate-500'
                                    }`}>
                                    {isComplete ? <Check size={10} /> : i + 1}
                                </div>
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-px mx-2 ${step > i ? 'bg-emerald-500/40' : 'bg-slate-200 dark:bg-slate-700'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Step 1: Item Info */}
            {step === 0 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block">Item Description</label>
                        <input
                            ref={descRef}
                            list="wiz-material-suggestions"
                            className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-orange-500 outline-none transition-all ${errors.itemDescription ? 'border-red-500/60' : 'border-slate-200 dark:border-slate-700'}`}
                            value={item.itemDescription}
                            onChange={e => {
                                const val = e.target.value;
                                const mat = materials.find(m => m.name === val);
                                if (mat) {
                                    setItem(prev => ({ ...prev, itemDescription: mat.name, unit: mat.unit }));
                                } else {
                                    setItem(prev => ({ ...prev, itemDescription: val }));
                                }
                                if (errors.itemDescription) setErrors(prev => { const n = { ...prev }; delete n.itemDescription; return n; });
                            }}
                            placeholder="Start typing material name..."
                        />
                        <datalist id="wiz-material-suggestions">
                            {materials.map(m => <option key={m.id} value={m.name} />)}
                        </datalist>
                        {errors.itemDescription && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.itemDescription}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block">Quantity</label>
                            <input
                                type="number" step="0.01"
                                className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-orange-500 outline-none ${errors.quantity ? 'border-red-500/60' : 'border-slate-200 dark:border-slate-700'}`}
                                value={item.quantity || ''}
                                onChange={e => {
                                    setItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) }));
                                    if (errors.quantity) setErrors(prev => { const n = { ...prev }; delete n.quantity; return n; });
                                }}
                            />
                            {errors.quantity && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.quantity}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block">Unit</label>
                            <input
                                list="wiz-unit-suggestions"
                                className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-orange-500 outline-none ${errors.unit ? 'border-red-500/60' : 'border-slate-200 dark:border-slate-700'}`}
                                value={item.unit}
                                onChange={e => {
                                    setItem(prev => ({ ...prev, unit: e.target.value }));
                                    if (errors.unit) setErrors(prev => { const n = { ...prev }; delete n.unit; return n; });
                                }}
                                placeholder="Unit"
                            />
                            <datalist id="wiz-unit-suggestions">
                                {units.map(u => <option key={u.id} value={u.abbreviation || u.name}>{u.name}</option>)}
                            </datalist>
                            {errors.unit && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.unit}</p>}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setItem(prev => ({ ...prev, isCarport: !prev.isCarport }))}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border transition-all text-xs font-black uppercase tracking-widest ${item.isCarport
                            ? 'bg-orange-500/20 border-orange-500 text-orange-600 dark:text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                            : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-500'
                            }`}
                    >
                        {item.isCarport ? <Car size={16} /> : <Home size={16} />}
                        {item.isCarport ? 'Classified: Carport' : 'Classified: Building'}
                    </button>
                </div>
            )}

            {/* Step 2: Resources (DUPA) */}
            {step === 1 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-orange-500 uppercase font-black tracking-widest flex items-center gap-2">
                            <Settings size={14} /> Resource Components (DUPA)
                        </label>
                        <span className="text-[9px] text-slate-500 font-mono">{item.components.length} resource{item.components.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div ref={resourceListRef} className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {item.components.map((comp, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 relative group/row">
                                <div className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-3">
                                        <label className="text-[8px] text-slate-500 uppercase font-bold mb-0.5 block">Type</label>
                                        <select
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-[10px] text-slate-900 dark:text-white outline-none focus:border-orange-500"
                                            value={comp.resourceType}
                                            onChange={e => updateComponent(idx, 'resourceType', e.target.value)}
                                        >
                                            <option value="MATERIAL">MATERIAL</option>
                                            <option value="LABOR">LABOR</option>
                                            <option value="EQUIPMENT">EQUIPMENT</option>
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <label className="text-[8px] text-slate-500 uppercase font-bold mb-0.5 block">Name</label>
                                        <input
                                            type="text"
                                            placeholder="Resource Name"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-[10px] text-slate-900 dark:text-white outline-none"
                                            value={comp.name}
                                            onChange={e => updateComponent(idx, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[8px] text-slate-500 uppercase font-bold mb-0.5 block">Factor</label>
                                        <input
                                            type="number" step="0.0001"
                                            placeholder="Qty Factor"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-[10px] text-slate-900 dark:text-white outline-none text-center focus:border-cyan-500"
                                            value={comp.quantityFactor || ''}
                                            onChange={e => updateComponent(idx, 'quantityFactor', e.target.value)}
                                        />
                                    </div>
                                    {comp.resourceType !== 'MATERIAL' && (
                                        <>
                                            <div className="col-span-1">
                                                <label className="text-[8px] text-slate-500 uppercase font-bold mb-0.5 block">P</label>
                                                <input
                                                    type="number"
                                                    title="No. of Persons"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-[10px] text-slate-900 dark:text-white outline-none text-center"
                                                    value={comp.noOfPersons || ''}
                                                    onChange={e => updateComponent(idx, 'noOfPersons', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-[8px] text-slate-500 uppercase font-bold mb-0.5 block">H</label>
                                                <input
                                                    type="number"
                                                    title="No. of Hours"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-[10px] text-slate-900 dark:text-white outline-none text-center"
                                                    value={comp.hours || ''}
                                                    onChange={e => updateComponent(idx, 'hours', e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div className={comp.resourceType === 'MATERIAL' ? 'col-span-2' : 'col-span-2'}>
                                        <label className="text-[8px] text-slate-500 uppercase font-bold mb-0.5 block">Rate</label>
                                        <input
                                            type="number" step="0.01"
                                            placeholder="Rate"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-[10px] text-slate-900 dark:text-white outline-none text-right"
                                            value={comp.unitRate || ''}
                                            onChange={e => updateComponent(idx, 'unitRate', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1 flex items-end justify-end">
                                        <button type="button" onClick={() => removeComponent(idx)} className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className="text-[9px] font-mono text-slate-400">
                                        Row: ₱ {(Number(comp.quantityFactor) * Number(comp.unitRate)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {item.components.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                <Settings size={24} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-[10px] text-slate-500 uppercase font-black">No resources added yet</p>
                                <p className="text-[9px] text-slate-400 mt-1">Click "Add Resource" below to define material, labor & equipment costs</p>
                            </div>
                        )}
                    </div>

                    {/* Add Resource button — always visible below the list */}
                    <button type="button" onClick={addComponent} className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-500 hover:text-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 border border-dashed border-cyan-500/30 rounded-lg transition-all">
                        <Plus size={14} /> Add Resource
                    </button>

                    {/* Cost Summary */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="text-[10px] text-cyan-600 uppercase font-black mb-1 block">Material Cost /unit</label>
                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 text-slate-900 dark:text-white text-sm font-mono flex items-center justify-between">
                                <span>₱ {item.materialUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                <Calculator size={12} className="opacity-30" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-purple-600 uppercase font-black mb-1 block">Labor/Eq. Cost /unit</label>
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 text-slate-900 dark:text-white text-sm font-mono flex items-center justify-between">
                                <span>₱ {item.laborUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                <Hammer size={12} className="opacity-30" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Review */}
            {step === 2 && (
                <div className="space-y-4">
                    {/* Item Summary */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[9px] text-slate-500 uppercase font-black">Item Description</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{item.itemDescription}</p>
                            </div>
                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase border ${item.isCarport ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'}`}>
                                {item.isCarport ? '🅿 Carport' : '🏠 Building'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <p className="text-[9px] text-slate-500 uppercase font-black">Quantity</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{item.quantity}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-500 uppercase font-black">Unit</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.unit}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-500 uppercase font-black">Components</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.components.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 px-3 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Material Cost</span>
                            <span className="text-sm font-mono font-bold text-cyan-600">
                                ₱ {(item.materialUnitPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Labor/Equipment Cost</span>
                            <span className="text-sm font-mono font-bold text-purple-600">
                                ₱ {(item.laborUnitPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-500 uppercase font-black block">Estimated Combined Total</span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500 font-mono">
                                ₱ {combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Batch Mode Toggle */}
                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className={`w-9 h-5 rounded-full flex items-center transition-colors ${batchMode ? 'bg-orange-500 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'}`}>
                            <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Keep adding items</p>
                            <p className="text-[9px] text-slate-500">Form resets after submit — modal stays open</p>
                        </div>
                    </label>
                </div>
            )}

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                    {step > 0 ? (
                        <button type="button" onClick={handleBack} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all active:scale-95">
                            <ChevronLeft size={14} /> Back
                        </button>
                    ) : (
                        <span className="text-[9px] text-slate-400 font-mono">Ctrl+Enter to submit</span>
                    )}
                </div>

                <div className="flex gap-2">
                    {step < 2 ? (
                        <button type="button" onClick={handleNext} className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-lg shadow-orange-600/20 transition-all active:scale-95">
                            Next <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-lg shadow-orange-600/20 transition-all active:scale-95 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={16} /> {submitting ? 'Adding...' : batchMode ? 'Add & Continue' : 'Add to BOQ'}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
