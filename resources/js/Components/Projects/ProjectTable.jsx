import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Briefcase, MapPin, Edit2, Trash2, Plus } from 'lucide-react';
import DataTable from '@/Components/UI/DataTable';

export default function ProjectTable({ projects, onEdit, onDelete, onCreate, auth }) {
    const isSiteEngineer = auth?.user?.role === 'site_engineer';

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
        <div className="flex items-center gap-2">
            <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 focus:border-cyan-500 outline-none transition-all cursor-pointer font-medium h-9"
            >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON-HOLD">On-Hold</option>
            </select>

            <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 focus:border-cyan-500 outline-none transition-all cursor-pointer font-medium h-9"
            >
                <option value="ALL">All Types</option>
                <option value="BUILDING">Building</option>
                <option value="INFRASTRUCTURE">Infrastructure</option>
                <option value="MAINTENANCE">Maintenance</option>
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
                            <Link href={`/projects/${project.id}`} className="font-bold text-slate-900 dark:text-white hover:text-cyan-600 transition-colors uppercase truncate max-w-[300px]">
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
                accessorKey: 'location',
                header: 'Location / Contract',
                cell: ({ row }) => {
                    const project = row.original;
                    return (
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <MapPin size={10} className="opacity-50" /> {project.location || 'N/A'}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded w-fit capitalize">
                                    {project.duration_days ? `${project.duration_days} Days` : 'No Duration'}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono font-medium">
                                    {project.target_end_date ? new Date(project.target_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No End Date'}
                                </span>
                            </div>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'project_type',
                header: () => <div className="text-center w-full block">Type</div>,
                cell: ({ row }) => {
                    const project = row.original;
                    return (
                        <div className="text-center w-full block">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${project.project_type === 'BUILDING' ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' : project.project_type === 'INFRASTRUCTURE' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                                {project.project_type}
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
                    accessorKey: 'total_profit',
                    header: () => <div className="text-right text-purple-500 w-full block">Total Profit</div>,
                    cell: ({ row }) => {
                        const project = row.original;
                        return (
                            <div className="text-right font-mono text-purple-600 dark:text-purple-400 w-full block">
                                <span className="bg-purple-50/10 dark:bg-purple-900/10 inline-block px-2 py-1 rounded">
                                    ₱ {Number(project.total_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        );
                    }
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
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                            {project.status}
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
                                <button onClick={(e) => onEdit(project, e)} className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded transition-colors" title="Edit">
                                    <Edit2 size={14} />
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={(e) => onDelete(project, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete">
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
