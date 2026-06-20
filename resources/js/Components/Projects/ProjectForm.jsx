import React from 'react';
import Select from '@/Components/UI/Select';
import Combobox from '@/Components/UI/Combobox';
import { Building2, Layers, UserCog, AlertCircle, Info } from 'lucide-react';

export default function ProjectForm({
    data,
    setData,
    errors,
    processing,
    handleSubmit,
    clients,
    siteEngineers,
    projectTypes,
    onCancel,
    isEditing
}) {
    const [appropriationManuallyEdited, setAppropriationManuallyEdited] = React.useState(false);

    const handleBudgetChange = (value) => {
        const stripped = stripCommas(value);
        if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) {
            setData('budget', stripped);
            if (!isEditing && !appropriationManuallyEdited) {
                setData('appropriation', stripped);
            }
        }
    };

    const handleAppropriationChange = (value) => {
        const stripped = stripCommas(value);
        if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) {
            setAppropriationManuallyEdited(true);
            setData('appropriation', stripped);
        }
    };

    const budgetNum = parseFloat(data.budget) || 0;
    const appropriationNum = parseFloat(data.appropriation) || 0;
    const exceedsWarning = appropriationNum > 0 && appropriationNum > budgetNum;
    const formatWithCommas = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const stringValue = value.toString();
        const parts = stringValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    };

    const stripCommas = (value) => {
        return value.replace(/,/g, '');
    };

    const handleNumericChange = (field, value) => {
        const stripped = stripCommas(value);
        if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) {
            setData(field, stripped);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Project Name</label>
                    <input 
                        className={`w-full bg-slate-50 dark:bg-slate-900/50 border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all`}
                        value={data.name} 
                        onChange={e => setData('name', e.target.value)} 
                        required 
                        placeholder="Enter project title" 
                    />
                    {errors.name && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.name}</div>}
                </div>
                <div>
                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Client</label>
                    <Combobox value={data.client_id} onChange={val => setData('client_id', val)} options={(clients || []).map(c => ({ value: c.id.toString(), label: c.name }))} placeholder="Select Client" searchPlaceholder="Search clients..." />
                    {errors.client_id && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.client_id}</div>}
                </div>
                <div>
                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Site Engineer (Optional)</label>
                    <Combobox value={data.site_engineer_id} onChange={val => setData('site_engineer_id', val)} options={(siteEngineers || []).map(u => ({ value: u.id.toString(), label: u.name }))} placeholder="Unassigned" searchPlaceholder="Search engineers..." />
                    {errors.site_engineer_id && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.site_engineer_id}</div>}
                </div>
                <div className={`md:col-span-2 ${isEditing ? 'grid grid-cols-1 sm:grid-cols-2' : ''} gap-4`}>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Project Type</label>
                        <Combobox value={data.project_type} onChange={val => setData('project_type', val)} options={(projectTypes || []).map(t => ({ value: t.name, label: t.label }))} placeholder="Select Type" searchPlaceholder="Search types..." />
                        {errors.project_type && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.project_type}</div>}
                    </div>
                    {isEditing && (
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Status</label>
                            <Select 
                                value={data.status} 
                                onChange={val => setData('status', val)} 
                                options={[
                                    { value: "ACTIVE", label: "ACTIVE" },
                                    { value: "ON_HOLD", label: "ON HOLD" }, 
                                    { value: "WARRANTY_PERIOD", label: "WARRANTY PERIOD" }, 
                                    { value: "COMPLETED", label: "COMPLETED" }
                                ]} 
                            />
                            {errors.status && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.status}</div>}
                        </div>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Budget (PhP)</label>
                        <div className="group relative cursor-help">
                            <Info size={14} className="text-slate-400" />
                            <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded whitespace-nowrap z-10">
                                Total estimated project cost
                            </div>
                        </div>
                    </div>
                    <input
                        type="text"
                        className={`w-full bg-slate-50 dark:bg-slate-900/50 border ${errors.budget ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all font-mono`}
                        value={formatWithCommas(data.budget)}
                        onChange={e => handleBudgetChange(e.target.value)}
                        required
                    />
                    {errors.budget && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.budget}</div>}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Appropriation (PhP)</label>
                        <div className="group relative cursor-help">
                            <Info size={14} className="text-slate-400" />
                            <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded whitespace-nowrap z-10">
                                Amount approved to release
                            </div>
                        </div>
                    </div>
                    <input
                        type="text"
                        className={`w-full bg-slate-50 dark:bg-slate-900/50 border ${exceedsWarning ? 'border-orange-500' : errors.appropriation ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all font-mono`}
                        value={formatWithCommas(data.appropriation)}
                        onChange={e => handleAppropriationChange(e.target.value)}
                    />
                    {exceedsWarning && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-900/30">
                            <AlertCircle size={14} className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                            <span className="text-orange-600 dark:text-orange-400 text-[10px] font-semibold">Appropriation exceeds budget</span>
                        </div>
                    )}
                    {errors.appropriation && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.appropriation}</div>}
                </div>
                <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Location</label>
                    <input className={`w-full bg-slate-50 dark:bg-slate-900/50 border ${errors.location ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all`} value={data.location} onChange={e => setData('location', e.target.value)} placeholder="Project Site Location" />
                    {errors.location && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.location}</div>}
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Contract ID</label>
                        <input className={`w-full bg-white dark:bg-slate-900/40 border ${errors.contract_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none`} value={data.contract_id} onChange={e => setData('contract_id', e.target.value)} placeholder="e.g. 24L00123" />
                        {errors.contract_id && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.contract_id}</div>}
                    </div>
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-3 mt-3">
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Start Date</label>
                            <input type="date" className={`w-full bg-white dark:bg-slate-900/40 border ${errors.target_start_date ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none uppercase font-mono`} value={data.target_start_date} onChange={e => {
                                const newStartDate = e.target.value;
                                setData(prev => {
                                    const updates = { target_start_date: newStartDate };
                                    if (newStartDate && prev.duration_days) {
                                        const endDate = new Date(newStartDate);
                                        endDate.setDate(endDate.getDate() + Number(prev.duration_days));
                                        updates.target_end_date = endDate.toISOString().split('T')[0];
                                    }
                                    return { ...prev, ...updates };
                                });
                            }} />
                            {errors.target_start_date && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.target_start_date}</div>}
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Duration (Days)</label>
                            <input type="number" min="0" className={`w-full bg-white dark:bg-slate-900/40 border ${errors.duration_days ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none uppercase font-mono`} value={data.duration_days} onChange={e => {
                                const newDuration = e.target.value;
                                setData(prev => {
                                    const updates = { duration_days: newDuration };
                                    if (prev.target_start_date && newDuration) {
                                        const endDate = new Date(prev.target_start_date);
                                        endDate.setDate(endDate.getDate() + Number(newDuration));
                                        updates.target_end_date = endDate.toISOString().split('T')[0];
                                    }
                                    return { ...prev, ...updates };
                                });
                            }} placeholder="e.g. 180" />
                            {errors.duration_days && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.duration_days}</div>}
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">End Date</label>
                            <input type="date" className={`w-full bg-white dark:bg-slate-900/40 border ${errors.target_end_date ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none uppercase font-mono`} value={data.target_end_date} onChange={e => setData('target_end_date', e.target.value)} />
                            {errors.target_end_date && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.target_end_date}</div>}
                        </div>
                    </div>
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Source of Fund</label>
                            <input className={`w-full bg-white dark:bg-slate-900/40 border ${errors.source_of_fund ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none`} value={data.source_of_fund} onChange={e => setData('source_of_fund', e.target.value)} placeholder="e.g. GAA 2024" />
                            {errors.source_of_fund && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.source_of_fund}</div>}
                        </div>
                    </div>
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Contract Type</label>
                            <Select
                                value={data.contract_type}
                                onChange={val => setData('contract_type', val)}
                                options={[
                                    { value: "Lump Sum", label: "Lump Sum" },
                                    { value: "Cost Plus", label: "Cost Plus" },
                                    { value: "Unit Price", label: "Unit Price" },
                                ]}
                            />
                            {errors.contract_type && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.contract_type}</div>}
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Payment Terms</label>
                            <input className={`w-full bg-white dark:bg-slate-900/40 border ${errors.payment_terms ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none`} value={data.payment_terms} onChange={e => setData('payment_terms', e.target.value)} placeholder="e.g. 30 Days" />
                            {errors.payment_terms && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.payment_terms}</div>}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-2">
                    <div>
                        <label className="text-[10px] text-cyan-600 uppercase font-black mb-1 block tracking-widest">Total Floor Area (sqm)</label>
                        <input type="number" step="0.01" className={`w-full bg-cyan-500/5 border ${errors.total_floor_area ? 'border-red-500' : 'border-cyan-500/20'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500`} value={data.total_floor_area} onChange={e => setData('total_floor_area', e.target.value)} placeholder="e.g. 120.00" />
                        {errors.total_floor_area && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.total_floor_area}</div>}
                    </div>
                    <div>
                        <label className="text-[10px] text-orange-600 uppercase font-black mb-1 block tracking-widest">Carport Area (sqm)</label>
                        <input type="number" step="0.01" className={`w-full bg-orange-500/5 border ${errors.carport_area ? 'border-red-500' : 'border-orange-500/20'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500`} value={data.carport_area} onChange={e => setData('carport_area', e.target.value)} placeholder="e.g. 20.00" />
                        {errors.carport_area && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.carport_area}</div>}
                    </div>
                </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="min-h-[44px] px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest rounded-lg active:scale-95">Cancel</button>
                <button type="submit" disabled={processing} className="min-h-[44px] bg-cyan-600 px-6 py-2.5 rounded-lg text-white font-black text-xs uppercase tracking-widest hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 transition-all active:scale-95 disabled:opacity-50">
                    {isEditing ? 'Apply Changes' : 'Establish Project'}
                </button>
            </div>
        </form>
    );
}
