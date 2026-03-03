import React from 'react';
import { Link } from '@inertiajs/react';
import { Briefcase, Edit2, Trash2 } from 'lucide-react';

export default function ProjectGrid({ projects, onEdit, onDelete, auth }) {
    const isSiteEngineer = auth?.user?.role === 'site_engineer';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
                <div key={project.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 group relative hover:border-cyan-500/30 transition-all shadow-sm">
                    <Link href={`/projects/${project.id}`} className="absolute inset-0 z-10" />
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${project.project_type === 'BUILDING' ? 'bg-cyan-500/10 text-cyan-600' : 'bg-orange-500/10 text-orange-600'}`}><Briefcase size={20} /></div>
                        {(onEdit || onDelete) && (
                            <div className="flex items-center gap-1 relative z-20">
                                {onEdit && <button onClick={(e) => onEdit(project, e)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-cyan-600 rounded"><Edit2 size={12} /></button>}
                                {onDelete && <button onClick={(e) => onDelete(project, e)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>}
                            </div>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-cyan-600 transition-colors uppercase tracking-tight truncate">{project.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-4">{project.client?.name || 'Internal'}</p>
                    <div className="space-y-2 text-xs">
                        {!isSiteEngineer && (
                            <>
                                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50"><span className="text-slate-500">Budget</span><span className="font-mono font-bold text-emerald-600">₱ {Number(project.budget).toLocaleString()}</span></div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50"><span className="text-purple-500/80">Total Profit</span><span className="font-mono font-bold text-purple-600 dark:text-purple-400">₱ {Number(project.total_profit || 0).toLocaleString()}</span></div>
                            </>
                        )}
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50"><span className="text-slate-500">Status</span><span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'text-slate-500 bg-slate-100 dark:bg-slate-700'}`}>{project.status}</span></div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50"><span className="text-slate-500">Contract</span><span className="font-mono text-slate-900 dark:text-white">{project.contract_id || '-'} <span className="text-[10px] text-slate-400">({project.contract_type || 'N/A'})</span></span></div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50"><span className="text-slate-500">Terms</span><span className="font-mono text-slate-900 dark:text-white">{project.payment_terms || '-'}</span></div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-slate-500">Duration</span>
                            <span className="font-mono text-slate-900 dark:text-white truncate max-w-[150px] text-right">
                                {project.duration_days ? `${project.duration_days} Days` : '-'}
                                {project.target_end_date && <span className="block text-[9px] text-slate-400">Ends {new Date(project.target_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
