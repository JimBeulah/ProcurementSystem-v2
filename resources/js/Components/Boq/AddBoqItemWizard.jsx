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

    const resetForm = useCallback(() => {
        setItem({ ...INITIAL_STATE });
        setStep(0);
        setErrors({});
    }, []);

    // Validation
    const validateStep = useCallback((s) => {
        const errs = {};
        if (s === 0) {
            if (!item.itemDescription.trim()) errs.itemDescription = 'Description is required';
            if (!item.unit.trim()) errs.unit = 'Unit is required';
            if (!item.quantity || item.quantity <= 0) errs.quantity = 'Quantity must be > 0';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }, [item]);

    const handleNext = useCallback(() => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 2));
        }
    }, [step, validateStep]);

    const handleBack = () => setStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = useCallback(async () => {
        if (!validateStep(0)) { setStep(0); return; }
        setSubmitting(true);

        const payload = {
            item_description: item.itemDescription,
            unit: item.unit,
            quantity: Number(item.quantity),
            material_unit_price: item.materialUnitPrice,
            labor_unit_price: item.laborUnitPrice,
            is_carport: item.isCarport,
            components: item.components.map(c => ({
                ...c,
                unit: c.unit || '',
                quantityFactor: Number(c.quantityFactor) || 0,
                clientUnitRate: Number(c.clientUnitRate) || 0,
                altapilUnitRate: Number(c.altapilUnitRate) || 0,
                noOfPersons: Number(c.noOfPersons) || 0,
                hours: Number(c.hours) || 0,
            }))
        };

        try {
            await onSubmit(payload);
            setSubmitting(false);

            if (batchMode) {
                resetForm();
                // Keep modal open
            } else {
                resetForm();
                onClose();
            }
        } catch {
            setSubmitting(false);
            // Keep modal open and let user fix errors
        }
    }, [item, batchMode, onSubmit, onClose, resetForm, validateStep]);

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
                if (step === 2) handleSubmit();
                else handleNext();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, step, item, handleSubmit, handleNext]); // Added handleSubmit and handleNext to dependencies

    // Component helpers
    const addComponent = () => {
        setItem(prev => ({
            ...prev,
            components: [...prev.components, { resourceType: 'MATERIAL', name: '', unit: '', quantityFactor: 0, clientUnitRate: 0, altapilUnitRate: 0, noOfPersons: 0, hours: 0 }]
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
            .reduce((sum, c) => sum + (Number(c.quantityFactor) * Number(c.clientUnitRate)), 0);
        const labCosts = newComponents
            .filter(c => c.resourceType === 'LABOR' || c.resourceType === 'EQUIPMENT')
            .reduce((sum, c) => sum + (Number(c.quantityFactor) * Number(c.clientUnitRate)), 0);

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
        <Modal isOpen={isOpen} onClose={handleClose} title="Add BOQ Item" maxWidth="max-w-4xl">
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
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black mb-1 block ml-1">Item Description</label>
                        <input
                            ref={descRef}
                            list="wiz-material-suggestions"
                            className={`w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm border rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all ${errors.itemDescription ? 'border-red-500/60 focus:ring-red-500/30' : 'border-slate-200/80 dark:border-slate-700/80'}`}
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
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black mb-1 block ml-1">Quantity</label>
                            <input
                                type="number" step="0.01"
                                className={`w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm border rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all ${errors.quantity ? 'border-red-500/60 focus:ring-red-500/30' : 'border-slate-200/80 dark:border-slate-700/80'}`}
                                value={item.quantity || ''}
                                onChange={e => {
                                    setItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) }));
                                    if (errors.quantity) setErrors(prev => { const n = { ...prev }; delete n.quantity; return n; });
                                }}
                            />
                            {errors.quantity && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.quantity}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black mb-1 block ml-1">Unit</label>
                            <input
                                list="wiz-unit-suggestions"
                                className={`w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm border rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all ${errors.unit ? 'border-red-500/60 focus:ring-red-500/30' : 'border-slate-200/80 dark:border-slate-700/80'}`}
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
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border backdrop-blur-md transition-all text-xs font-black uppercase tracking-widest ${item.isCarport
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-2 ring-blue-500/20'
                            : 'bg-white/40 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
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
                            <div key={idx} className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm rounded-lg p-3 border border-slate-200/80 dark:border-slate-700/80 relative group/row hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors">
                                <div className="grid gap-2 items-center" style={{ gridTemplateColumns: comp.resourceType === 'MATERIAL' ? "100px 1fr 60px 80px 96px 96px 28px" : "100px 1fr 60px 48px 48px 80px 96px 96px 28px" }}>
                                    <div>
                                        <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 block ml-1">Type</label>
                                        <select
                                            className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 rounded shadow-sm p-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-semibold cursor-pointer"
                                            value={comp.resourceType}
                                            onChange={e => updateComponent(idx, 'resourceType', e.target.value)}
                                        >
                                            <option value="MATERIAL">MATERIAL</option>
                                            <option value="LABOR">LABOR</option>
                                            <option value="EQUIPMENT">EQUIPMENT</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 block ml-1">Name</label>
                                        <input
                                            type="text"
                                            placeholder="Resource Name"
                                            className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 rounded shadow-sm p-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            value={comp.name}
                                            onChange={e => updateComponent(idx, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 block ml-1">Unit</label>
                                        <input
                                            list={`wiz-comp-unit-${idx}`}
                                            placeholder="Unit"
                                            className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 rounded shadow-sm p-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            value={comp.unit || ''}
                                            onChange={e => updateComponent(idx, 'unit', e.target.value)}
                                        />
                                        <datalist id={`wiz-comp-unit-${idx}`}>
                                            {units.map(u => <option key={u.id} value={u.abbreviation || u.name}>{u.name}</option>)}
                                        </datalist>
                                    </div>
                                    {comp.resourceType !== 'MATERIAL' && (
                                        <>
                                            <div>
                                                <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 block text-center">P</label>
                                                <input
                                                    type="number"
                                                    title="No. of Persons"
                                                    placeholder="P"
                                                    className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 rounded shadow-sm p-1.5 text-xs text-slate-900 dark:text-white outline-none text-center focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                    value={comp.noOfPersons || ''}
                                                    onChange={e => updateComponent(idx, 'noOfPersons', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 block text-center">H</label>
                                                <input
                                                    type="number"
                                                    title="No. of Hours"
                                                    placeholder="H"
                                                    className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 rounded shadow-sm p-1.5 text-xs text-slate-900 dark:text-white outline-none text-center focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                    value={comp.hours || ''}
                                                    onChange={e => updateComponent(idx, 'hours', e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 block text-center">Factor</label>
                                        <input
                                            type="number" step="0.0001"
                                            placeholder="Qty Factor"
                                            className="w-full bg-slate-100/50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded shadow-sm p-1.5 text-xs text-slate-900 dark:text-white outline-none text-center focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                            value={comp.quantityFactor || ''}
                                            onChange={e => updateComponent(idx, 'quantityFactor', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 block text-right pr-1">Client Rate</label>
                                        <input
                                            type="number" step="0.01"
                                            placeholder="0.00"
                                            className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 rounded shadow-sm p-1.5 text-xs text-slate-900 dark:text-white outline-none text-right focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                            value={comp.clientUnitRate || ''}
                                            onChange={e => updateComponent(idx, 'clientUnitRate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-blue-600 dark:text-blue-400 uppercase font-black mb-1 block text-right pr-1 drop-shadow-sm">Altapil Rate</label>
                                        <input
                                            type="number" step="0.01"
                                            placeholder="0.00"
                                            className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700/50 rounded shadow-sm p-1.5 text-xs text-slate-900 dark:text-white outline-none text-right focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono font-bold"
                                            value={comp.altapilUnitRate || ''}
                                            onChange={e => updateComponent(idx, 'altapilUnitRate', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-end justify-center pt-[22px]">
                                        <button type="button" onClick={() => removeComponent(idx)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors group/del">
                                            <Trash2 size={14} className="group-hover/del:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className="text-[9px] font-mono text-slate-400">
                                        Row: ₱ {(Number(comp.quantityFactor) * Number(comp.clientUnitRate)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {item.components.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                <Settings size={24} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-[10px] text-slate-500 uppercase font-black">No resources added yet</p>
                                <p className="text-[9px] text-slate-400 mt-1">Click &quot;Add Resource&quot; below to define material, labor &amp; equipment costs</p>
                            </div>
                        )}
                    </div>

                    <button type="button" onClick={addComponent} className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 text-[10px] font-black uppercase text-blue-600 dark:text-blue-500 hover:text-blue-500 bg-blue-500/5 hover:bg-blue-500/10 border border-dashed border-blue-500/30 rounded-lg transition-all backdrop-blur-sm">
                        <Plus size={14} /> Add Resource
                    </button>

                    {/* Cost Summary */}
                    <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="text-[10px] text-cyan-600 uppercase font-black mb-1 block">Material Cost /unit</label>
                            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2 text-slate-900 dark:text-white text-sm font-mono flex items-center justify-between backdrop-blur-sm shadow-sm">
                                <span>₱ {item.materialUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                <Calculator size={12} className="opacity-30" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-blue-600 uppercase font-black mb-1 block">Labor/Eq. Cost /unit</label>
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2 text-slate-900 dark:text-white text-sm font-mono flex items-center justify-between backdrop-blur-sm shadow-sm">
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
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[9px] text-slate-500 uppercase font-black">Item Description</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{item.itemDescription}</p>
                            </div>
                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase border ${item.isCarport ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
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
                        <div className="flex justify-between items-center py-2 px-3 bg-cyan-500/5 backdrop-blur-sm shadow-sm rounded-lg border border-cyan-500/20">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Material Cost</span>
                            <span className="text-sm font-mono font-bold text-cyan-600">
                                ₱ {(item.materialUnitPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-blue-500/5 backdrop-blur-sm shadow-sm rounded-lg border border-blue-500/20">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Labor/Equipment Cost</span>
                            <span className="text-sm font-mono font-bold text-blue-600">
                                ₱ {(item.laborUnitPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-emerald-500/5 backdrop-blur-sm shadow-sm border border-emerald-500/30 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-500 uppercase font-black block mb-1">Estimated Combined Total</span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500 font-mono">
                                ₱ {combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Batch Mode Toggle */}
                    <label className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm rounded-lg border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors" onClick={(e) => { e.preventDefault(); setBatchMode(!batchMode); }}>
                        <div className={`w-9 h-5 rounded-full flex items-center transition-colors shadow-inner ${batchMode ? 'bg-blue-500 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'}`}>
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
