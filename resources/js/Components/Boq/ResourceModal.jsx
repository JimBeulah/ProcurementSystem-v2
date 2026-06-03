import React from 'react';
import Modal from '@/Components/UI/Modal';

export default function ResourceModal({ 
    isOpen, 
    onClose, 
    mode, 
    data, 
    setData, 
    units, 
    onSubmit, 
    loading,
    parentItem 
}) {
    if (!data) return null;

    const formatWithCommas = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const stringValue = value.toString();
        const parts = stringValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    };

    const stripCommas = (value) => {
        return value.toString().replace(/,/g, '');
    };

    const handleNumericChange = (field, value) => {
        const stripped = stripCommas(value);
        if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) {
            setData({ ...data, [field]: stripped });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${mode === 'add' ? 'Add' : 'Edit'} Resource`}>
            <form onSubmit={onSubmit} className="space-y-5">
                {/* Resource Type Selector */}
                <div className="grid grid-cols-3 gap-3">
                    {['MATERIAL', 'LABOR', 'EQUIPMENT'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setData({ ...data, resource_type: type })}
                            className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${data.resource_type === type
                                ? type === 'MATERIAL' ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20' :
                                    type === 'LABOR' ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20' :
                                        'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Name / Description</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Portland Cement"
                        value={data.name || ''}
                        onChange={e => setData({ ...data, name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Unit</label>
                    <input
                        list="res-modal-unit-suggestions"
                        placeholder="e.g. bags, hrs, pcs"
                        value={data.unit || ''}
                        onChange={e => setData({ ...data, unit: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all"
                    />
                    <datalist id="res-modal-unit-suggestions">
                        {units.map(u => <option key={u.id} value={u.abbreviation || u.name}>{u.name}</option>)}
                    </datalist>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Budget Rate</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                        <input
                            type="text"
                            required
                            value={formatWithCommas(data.unit_rate !== undefined ? data.unit_rate : '')}
                            onChange={e => handleNumericChange('unit_rate', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {data.resource_type === 'MATERIAL' ? (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                Quantity Factor
                            </label>
                            <input
                                type="text"
                                required
                                value={formatWithCommas(data.quantity_factor)}
                                onChange={e => handleNumericChange('quantity_factor', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">No. of Persons</label>
                                 <input
                                    type="text"
                                    required
                                    value={formatWithCommas(data.no_of_persons !== undefined ? data.no_of_persons : '')}
                                    onChange={e => handleNumericChange('no_of_persons', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Hours</label>
                                 <input
                                    type="text"
                                    required
                                    value={formatWithCommas(data.hours !== undefined ? data.hours : '')}
                                    onChange={e => handleNumericChange('hours', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                />
                            </div>
                        </>
                    )}
                </div>

                {data.resource_type !== 'MATERIAL' && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Calculated Quantity Factor</span>
                        <div className="font-mono text-sm text-slate-700 dark:text-slate-300 font-bold">
                            {(((Number(data.no_of_persons) || 0) * (Number(data.hours) || 0)) / (Number(parentItem?.quantity) || 1)).toFixed(4)}
                            <span className="text-[10px] text-slate-400 font-medium ml-2">((Persons × Hours) / Base Qty)</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" disabled={loading} className="px-5 py-2.5 text-xs font-bold uppercase text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-600/20 transition-all transform active:scale-95">Save Resource</button>
                </div>
            </form>
        </Modal>
    );
}
