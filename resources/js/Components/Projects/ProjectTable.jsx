import React from 'react';
import { Link } from '@inertiajs/react';
import { Briefcase, MapPin, Edit2, Trash2 } from 'lucide-react';

export default function ProjectTable({ projects, onEdit, onDelete }) {
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="p-3 text-center w-12">#</th>
                            <th className="p-3 min-w-[200px]">Project Name / Client</th>
                            <th className="p-3">Location / Contract</th>
                            <th className="p-3 text-center">Type</th>
                            <th className="p-3 text-right">Budget</th>
                            <th className="p-3 text-center">Status</th>
                            {(onEdit || onDelete) && <th className="p-3 text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                        {projects.map((project, idx) => (
                            <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group transition-colors">
                                <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="p-3">
                                    <div className="flex flex-col">
                                        <Link href={`/projects/${project.id}`} className="font-bold text-slate-900 dark:text-white hover:text-cyan-600 transition-colors uppercase truncate max-w-[300px]">{project.name}</Link>
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Briefcase size={10} className="inline opacity-50" /> {project.client?.name || 'Internal'}</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><MapPin size={10} className="opacity-50" /> {project.location || 'N/A'}</span>
                                        <span className="text-[9px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded w-fit">{project.contract_id || 'No Contract ID'}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${project.project_type === 'BUILDING' ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' : project.project_type === 'INFRASTRUCTURE' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                                        {project.project_type}
                                    </span>
                                </td>
                                <td className="p-3 text-right font-mono text-slate-900 dark:text-white">₱ {Number(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="p-3 text-center">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{project.status}</span>
                                </td>
                                {(onEdit || onDelete) && (
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {onEdit && <button onClick={(e) => onEdit(project, e)} className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded transition-colors" title="Edit"><Edit2 size={14} /></button>}
                                            {onDelete && <button onClick={(e) => onDelete(project, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete"><Trash2 size={14} /></button>}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {projects.length === 0 && (
                            <tr><td colSpan={7} className="p-12 text-center text-slate-400 opacity-50 uppercase text-xs tracking-widest font-bold">No projects found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
