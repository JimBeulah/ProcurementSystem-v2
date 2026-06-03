import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import { Layers, Plus, Edit2, Trash2, Save } from 'lucide-react';
import Modal from '@/Components/UI/Modal';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';

const COLOR_OPTIONS = [
    { value: 'slate',   label: 'Slate',   swatch: 'bg-slate-500',   badge: 'bg-slate-500/10 text-slate-600 border-slate-500/30' },
    { value: 'gray',    label: 'Gray',    swatch: 'bg-gray-500',    badge: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
    { value: 'zinc',    label: 'Zinc',    swatch: 'bg-zinc-500',    badge: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30' },
    { value: 'stone',   label: 'Stone',   swatch: 'bg-stone-500',   badge: 'bg-stone-500/10 text-stone-600 border-stone-500/30' },
    { value: 'red',     label: 'Red',     swatch: 'bg-red-500',     badge: 'bg-red-500/10 text-red-600 border-red-500/30' },
    { value: 'orange',  label: 'Orange',  swatch: 'bg-orange-500',  badge: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
    { value: 'amber',   label: 'Amber',   swatch: 'bg-amber-500',   badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    { value: 'yellow',  label: 'Yellow',  swatch: 'bg-yellow-500',  badge: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
    { value: 'lime',    label: 'Lime',    swatch: 'bg-lime-500',    badge: 'bg-lime-500/10 text-lime-600 border-lime-500/30' },
    { value: 'green',   label: 'Green',   swatch: 'bg-green-500',   badge: 'bg-green-500/10 text-green-600 border-green-500/30' },
    { value: 'emerald', label: 'Emerald', swatch: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    { value: 'teal',    label: 'Teal',    swatch: 'bg-teal-500',    badge: 'bg-teal-500/10 text-teal-600 border-teal-500/30' },
    { value: 'cyan',    label: 'Cyan',    swatch: 'bg-cyan-500',    badge: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' },
    { value: 'sky',     label: 'Sky',     swatch: 'bg-sky-500',     badge: 'bg-sky-500/10 text-sky-600 border-sky-500/30' },
    { value: 'blue',    label: 'Blue',    swatch: 'bg-blue-500',    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
    { value: 'indigo',  label: 'Indigo',  swatch: 'bg-indigo-500',  badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' },
    { value: 'violet',  label: 'Violet',  swatch: 'bg-violet-500',  badge: 'bg-violet-500/10 text-violet-600 border-violet-500/30' },
    { value: 'purple',  label: 'Purple',  swatch: 'bg-purple-500',  badge: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
    { value: 'fuchsia', label: 'Fuchsia', swatch: 'bg-fuchsia-500', badge: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/30' },
    { value: 'pink',    label: 'Pink',    swatch: 'bg-pink-500',    badge: 'bg-pink-500/10 text-pink-600 border-pink-500/30' },
    { value: 'rose',    label: 'Rose',    swatch: 'bg-rose-500',    badge: 'bg-rose-500/10 text-rose-600 border-rose-500/30' },
];

const colorBadgeClass = (color) => {
    return COLOR_OPTIONS.find(c => c.value === color)?.badge ?? COLOR_OPTIONS[0].badge;
};

function ProjectTypeModal({ projectType, onClose }) {
    const isEdit = !!projectType;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        label: projectType?.label ?? '',
        color: projectType?.color ?? 'slate',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('settings.project-types.update', projectType.id), {
                onSuccess: () => { reset(); onClose(); },
                preserveScroll: true,
                preserveState: true,
            });
        } else {
            post(route('settings.project-types.store'), {
                onSuccess: () => { reset(); onClose(); },
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={isEdit ? `Edit: ${projectType.label}` : 'Add Project Type'} maxWidth="max-w-md">
            <form onSubmit={submit} className="space-y-5 py-2 px-1">
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Display Name</label>
                    <input
                        type="text"
                        value={data.label}
                        onChange={e => setData('label', e.target.value)}
                        placeholder="e.g. Road Works"
                        className={`w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border ${errors.label ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition`}
                    />
                    {errors.label && <p className="mt-1 text-[11px] text-red-500 font-semibold">{errors.label}</p>}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Badge Color</label>
                        {data.color && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorBadgeClass(data.color)}`}>
                                {data.label || 'Preview'}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {COLOR_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                title={opt.label}
                                onClick={() => setData('color', opt.value)}
                                className={`w-8 h-8 rounded-full ${opt.swatch} transition-all ${
                                    data.color === opt.value
                                        ? 'ring-2 ring-offset-2 ring-violet-500 scale-110'
                                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                                }`}
                            />
                        ))}
                    </div>
                    {errors.color && <p className="mt-1 text-[11px] text-red-500 font-semibold">{errors.color}</p>}
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={processing} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-violet-600/20 transition-all active:scale-95 disabled:opacity-50">
                        <Save size={14} />
                        {isEdit ? 'Save Changes' : 'Create Type'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function ProjectTypesIndex() {
    const { projectTypes } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [deletingType, setDeletingType] = useState(null);

    const handleDelete = () => {
        router.delete(route('settings.project-types.destroy', deletingType.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingType(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Project Types" />
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="pb-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Layers className="text-violet-500" /> Project Types
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Manage the project type categories used when creating projects.</p>
                    </div>
                    <button
                        onClick={() => { setEditingType(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-violet-600/20 transition-all active:scale-95"
                    >
                        <Plus size={14} /> Add Type
                    </button>
                </header>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    {projectTypes.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <Layers size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-semibold">No project types yet.</p>
                            <p className="text-sm mt-1">Click "Add Type" to create the first one.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Label</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Key</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Color</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {projectTypes.map(type => (
                                    <tr key={type.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorBadgeClass(type.color)}`}>
                                                {type.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{type.name}</td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                                <span className={`w-3 h-3 rounded-full ${COLOR_OPTIONS.find(c => c.value === type.color)?.swatch ?? 'bg-slate-400'}`} />
                                                {COLOR_OPTIONS.find(c => c.value === type.color)?.label ?? type.color}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditingType(type); setShowModal(true); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-500/10 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingType(type)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <ProjectTypeModal
                    projectType={editingType}
                    onClose={() => { setShowModal(false); setEditingType(null); }}
                />
            )}

            <ConfirmationModal
                isOpen={!!deletingType}
                onClose={() => setDeletingType(null)}
                onConfirm={handleDelete}
                title="Delete Project Type"
                message={`Are you sure you want to delete the "${deletingType?.label}" type? This cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}
