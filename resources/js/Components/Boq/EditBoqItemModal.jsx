import React from 'react';
import Modal from '@/Components/UI/Modal';
import { Car } from 'lucide-react';

export default function EditBoqItemModal({ 
    isOpen, 
    onClose, 
    item, 
    setItem, 
    onSubmit, 
    loading 
}) {
    if (!item) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit BOQ Item">
            <form onSubmit={onSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Description</label>
                    <input
                        type="text"
                        required
                        value={item.item_description || ''}
                        onChange={e => setItem({ ...item, item_description: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Unit</label>
                        <input
                            type="text"
                            required
                            value={item.unit || ''}
                            onChange={e => setItem({ ...item, unit: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Quantity</label>
                        <input
                            type="number"
                            step="0.0001"
                            required
                            value={item.quantity || ''}
                            onChange={e => setItem({ ...item, quantity: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                        />
                    </div>
                </div>
                {item.components && item.components.length === 0 && (
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Mat. Unit Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.material_unit_price || ''}
                                    onChange={e => setItem({ ...item, material_unit_price: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Lab. Unit Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.labor_unit_price || ''}
                                    onChange={e => setItem({ ...item, labor_unit_price: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-3 pt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <input
                        type="checkbox"
                        id="editIsCarport"
                        checked={item.is_carport || false}
                        onChange={e => setItem({ ...item, is_carport: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-800"
                    />
                    <label htmlFor="editIsCarport" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none flex items-center gap-2">
                        <Car size={16} className="text-amber-500" /> Mark as Carport / Garage Area
                    </label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" disabled={loading} className="px-5 py-2.5 text-xs font-bold uppercase text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-600/20 transition-all transform active:scale-95">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
}
