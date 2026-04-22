import React from 'react';
import Modal from '@/Components/UI/Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function DeleteBoqItemModal({ 
    isOpen, 
    onClose, 
    item, 
    onConfirm 
}) {
    if (!item) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete">
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-red-500 shadow-sm shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete Item?</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">&quot;{item.item_description}&quot;</span>?
                            <br />This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Delete Item
                    </button>
                </div>
            </div>
        </Modal>
    );
}
