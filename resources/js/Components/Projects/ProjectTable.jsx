import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Briefcase, Edit2, Trash2, Plus } from 'lucide-react';
import DataTable from '@/Components/UI/DataTable';

const TYPE_BADGE = {
    slate:   'bg-slate-500/10 text-slate-600 border-slate-500/20',
    gray:    'bg-gray-500/10 text-gray-600 border-gray-500/20',
    zinc:    'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
    stone:   'bg-stone-500/10 text-stone-600 border-stone-500/20',
    red:     'bg-red-500/10 text-red-600 border-red-500/20',
    orange:  'bg-orange-500/10 text-orange-600 border-orange-500/20',
    amber:   'bg-amber-500/10 text-amber-600 border-amber-500/20',
    yellow:  'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    lime:    'bg-lime-500/10 text-lime-600 border-lime-500/20',
    green:   'bg-green-500/10 text-green-600 border-green-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    teal:    'bg-teal-500/10 text-teal-600 border-teal-500/20',
    cyan:    'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    sky:     'bg-sky-500/10 text-sky-600 border-sky-500/20',
    blue:    'bg-blue-500/10 text-blue-600 border-blue-500/20',
    indigo:  'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    violet:  'bg-violet-500/10 text-violet-600 border-violet-500/20',
    purple:  'bg-purple-500/10 text-purple-600 border-purple-500/20',
    fuchsia: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20',
    pink:    'bg-pink-500/10 text-pink-600 border-pink-500/20',
    rose:    'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const TYPE_ICON_BG = {
    slate:   'bg-slate-500/10 text-slate-600',
    gray:    'bg-gray-500/10 text-gray-600',
    zinc:    'bg-zinc-500/10 text-zinc-600',
    stone:   'bg-stone-500/10 text-stone-600',
    red:     'bg-red-500/10 text-red-600',
    orange:  'bg-orange-500/10 text-orange-600',
    amber:   'bg-amber-500/10 text-amber-600',
    yellow:  'bg-yellow-500/10 text-yellow-600',
    lime:    'bg-lime-500/10 text-lime-600',
    green:   'bg-green-500/10 text-green-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    teal:    'bg-teal-500/10 text-teal-600',
    cyan:    'bg-cyan-500/10 text-cyan-600',
    sky:     'bg-sky-500/10 text-sky-600',
    blue:    'bg-blue-500/10 text-blue-600',
    indigo:  'bg-indigo-500/10 text-indigo-600',
    violet:  'bg-violet-500/10 text-violet-600',
    purple:  'bg-purple-500/10 text-purple-600',
    fuchsia: 'bg-fuchsia-500/10 text-fuchsia-600',
    pink:    'bg-pink-500/10 text-pink-600',
    rose:    'bg-rose-500/10 text-rose-600',
};

export { TYPE_BADGE, TYPE_ICON_BG };

export default function ProjectTable({ projects, projectTypes, onEdit, onDelete, onCreate, auth }) {
    const isSiteEngineer = auth?.user?.role === 'site_engineer';
    const typeMap = useMemo(() => Object.fromEntries((projectTypes || []).map(t => [t.name, t])), [projectTypes]);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
            const matchType = typeFilter === 'ALL' || p.project_type === typeFilter;
            return matchStatus && matchType;
        });
    }, [projects, statusFilter, typeFilter]);

    const leftToolbar = (
        <div className="flex flex-wrap items-center gap-2">
            <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 focus:border-cyan-500 outline-none transition-all cursor-pointer font-medium min-h-[40px]"
            >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="WARRANTY_PERIOD">Warranty Period</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON-HOLD">On-Hold</option>
            </select>

            <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 focus:border-cyan-500 outline-none transition-all cursor-pointer font-medium min-h-[40px]"
            >
                <option value="ALL">All Types</option>
                {(projectTypes || []).map(t => (
                    <option key={t.name} value={t.name}>{t.label}</option>
                ))}
            </select>
        </div>
    );

    const customToolbar = (
        <div className="flex flex-wrap items-center gap-3">
            {onCreate && (
                <button
                    onClick={onCreate}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 h-9"
                >
                    <Plus size={16} /> <span className="hidden sm:inline">New Project</span>
                </button>
            )}
        </div>
    );

    const columns = useMemo(() => {
        const baseColumns = [
            {
                id: 'index',
                header: () => <div className="text-center w-12 block">#</div>,
                cell: ({ row }) => <span className="text-slate-400 font-mono text-center w-full block">{row.index + 1}</span>,
                enableSorting: false,
            },
            {
                accessorKey: 'name',
                header: 'Project Name / Client',
                cell: ({ row }) => {
                    const project = row.original;
                    return (
                        <div className="flex flex-col">
                            <Link href={`/projects/${project.id}`} className="font-bold text-slate-900 dark:text-white hover:text-cyan-600 transition-colors uppercase truncate max-w-[200px]" title={project.name}>
                                {project.name}
                            </Link>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Briefcase size={10} className="inline opacity-50" /> {project.client?.name || 'Internal'}
                            </span>
                        </div>
                    );
                }
            },

            {
                accessorKey: 'project_type',
                header: () => <div className="text-center w-full block">Type</div>,
                cell: ({ row }) => {
                    const project = row.original;
                    const type = typeMap[project.project_type];
                    const badgeClass = TYPE_BADGE[type?.color] ?? TYPE_BADGE.slate;
                    return (
                        <div className="text-center w-full block">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${badgeClass}`}>
                                {type?.label ?? project.project_type}
                            </span>
                        </div>
                    );
                }
            },
        ];

        if (!isSiteEngineer) {
            baseColumns.push(
                {
                    accessorKey: 'budget',
                    header: () => <div className="text-right w-full block">Budget</div>,
                    cell: ({ row }) => {
                        const project = row.original;
                        return <div className="text-right font-mono text-slate-900 dark:text-white w-full block">₱ {Number(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>;
                    }
                },
                {
                    accessorKey: 'profit_or_loss',
                    header: 'Profit / Loss',
                    cell: ({ row }) => {
                        const val = Number(row.original.profit_or_loss || 0);
                        return (
                            <span className={val >= 0 ? 'text-emerald-600 font-mono' : 'text-red-500 font-mono'}>
                                {val >= 0 ? '' : '-'}₱ {Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        );
                    },
                }
            );
        }

        baseColumns.push({
            accessorKey: 'status',
            header: () => <div className="text-center w-full block">Status</div>,
            cell: ({ row }) => {
                const project = row.original;
                return (
                    <div className="text-center w-full block">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : project.status === 'WARRANTY_PERIOD' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                            {project.status === 'WARRANTY_PERIOD' ? 'WARRANTY PERIOD' : project.status}
                        </span>
                    </div>
                );
            }
        });

        if (onEdit || onDelete) {
            baseColumns.push({
                id: 'actions',
                header: () => <div className="text-center w-full block">Actions</div>,
                cell: ({ row }) => {
                    const project = row.original;
                    return (
                        <div className="flex items-center justify-center gap-1 w-full">
                            {onEdit && (
                                <button onClick={(e) => onEdit(project, e)} className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded transition-colors active:scale-95" title="Edit" aria-label="Edit project">
                                    <Edit2 size={14} />
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={(e) => onDelete(project, e)} className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors active:scale-95" title="Delete" aria-label="Delete project">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    );
                },
                enableSorting: false,
            });
        }

        return baseColumns;
    }, [isSiteEngineer, onEdit, onDelete]);

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm p-4">
            <DataTable
                columns={columns}
                data={filteredProjects}
                showSearch={true}
                showPagination={true}
                customToolbar={customToolbar}
                leftToolbar={leftToolbar}
            />
        </div>
    );
}
