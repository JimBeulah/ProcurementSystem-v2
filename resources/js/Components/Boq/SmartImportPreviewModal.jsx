import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { X, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { applyMappingsToRows } from '@/Utils/boqFileUtils';

const FIELD_OPTIONS = [
    { value: '',                 label: '-- Skip --' },
    { value: 'itemDescription',  label: 'Description' },
    { value: 'unit',             label: 'Unit' },
    { value: 'quantity',         label: 'Quantity' },
    { value: 'materialUnitCost', label: 'Material Unit Cost' },
    { value: 'laborUnitCost',    label: 'Labor Unit Cost' },
    { value: 'totalCost',        label: 'Total Cost (ref. only)' },
];

function ConfidenceBadge({ confidence }) {
    if (confidence === 'high') {
        return (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle size={12} /> High
            </span>
        );
    }
    if (confidence === 'low') {
        return (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <AlertTriangle size={12} /> Low
            </span>
        );
    }
    return <span className="text-xs text-slate-400">—</span>;
}

function ModalContent({ onClose, projectId, analyzeData }) {
    const [mappings, setMappings] = useState(analyzeData.mappings ?? []);
    const [submitting, setSubmitting] = useState(false);

    const { token, sampleRows = [], totalRows = 0 } = analyzeData;

    const previewItems = useMemo(
        () => applyMappingsToRows(sampleRows, mappings),
        [sampleRows, mappings]
    );

    const canConfirm = mappings.some(m => m.mappedTo === 'itemDescription') &&
                       mappings.some(m => m.mappedTo === 'quantity');

    const handleMappingChange = (columnIndex, newField) => {
        setMappings(prev =>
            prev.map(m =>
                m.columnIndex === columnIndex ? { ...m, mappedTo: newField || null } : m
            )
        );
    };

    const handleConfirm = () => {
        setSubmitting(true);
        router.post(
            `/projects/${projectId}/boq/smart-import/confirm`,
            { token, mappings },
            {
                onSuccess: () => onClose(),
                onError:   () => setSubmitting(false),
            }
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Smart BOQ Import — Map Columns</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{totalRows} rows detected. Review the column mapping before importing.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {/* Column Mapping Table */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Column Mapping</h3>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                    <tr className="text-xs text-slate-500 uppercase tracking-wider">
                                        <th className="px-4 py-2.5 text-left font-semibold">Client Column</th>
                                        <th className="px-4 py-2.5 text-left font-semibold">Maps To</th>
                                        <th className="px-4 py-2.5 text-left font-semibold">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {mappings.map(m => (
                                        <tr key={m.columnIndex} className={m.confidence === 'low' ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                                            <td className="px-4 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                                                {m.originalHeader}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <select
                                                    value={m.mappedTo ?? ''}
                                                    onChange={e => handleMappingChange(m.columnIndex, e.target.value)}
                                                    className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-purple-500 focus:ring-0 outline-none w-full"
                                                >
                                                    {FIELD_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <ConfidenceBadge confidence={m.confidence} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sample Data Preview */}
                    {previewItems.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Sample Preview (first {previewItems.length} rows)
                            </h3>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr className="text-slate-500 uppercase tracking-wider">
                                            <th className="px-3 py-2 text-left font-semibold">Description</th>
                                            <th className="px-3 py-2 text-left font-semibold">Unit</th>
                                            <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                            <th className="px-3 py-2 text-right font-semibold">Mat. Cost</th>
                                            <th className="px-3 py-2 text-right font-semibold">Lab. Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {previewItems.map((item, i) => (
                                            <tr key={i} className="text-slate-700 dark:text-slate-300">
                                                <td className="px-3 py-2 max-w-[250px] truncate">{item.itemDescription}</td>
                                                <td className="px-3 py-2">{item.unit}</td>
                                                <td className="px-3 py-2 text-right">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right">{item.materialUnitPrice.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-right">{item.laborUnitPrice.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!canConfirm && (
                        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                            <AlertTriangle size={12} className="inline mr-1" />
                            Please map at least <strong>Description</strong> and <strong>Quantity</strong> columns to enable import.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm || submitting}
                        className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
                    >
                        <Upload size={14} />
                        {submitting ? 'Importing...' : `Confirm & Import ${totalRows} rows`}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function SmartImportPreviewModal({ isOpen, onClose, projectId, analyzeData }) {
    if (!isOpen || !analyzeData) return null;
    return <ModalContent onClose={onClose} projectId={projectId} analyzeData={analyzeData} />;
}
