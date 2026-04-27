import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ScrollText, User, Clock, Tag, ChevronLeft, ChevronRight, ArrowLeftRight, Filter, X } from 'lucide-react';
import { DataTable } from '@/Components/UI/DataTable';


const EVENT_BADGE = {
    created: { label: 'Created', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
    updated: { label: 'Updated', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
    deleted: { label: 'Deleted', classes: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
};

function EventBadge({ event }) {
    const cfg = EVENT_BADGE[event] ?? { label: event, classes: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.classes}`}>
            {cfg.label}
        </span>
    );
}

function PropertyChanges({ properties }) {
    if (!properties) return null;
    const { old: oldVals, attributes: newVals } = properties;
    if (!oldVals && !newVals) return null;
    if (!oldVals) {
        // Created — just list attributes
        const keys = Object.keys(newVals || {}).filter(k => !['created_at', 'updated_at', 'id'].includes(k));
        if (keys.length === 0) return null;
        return (
            <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                {keys.map(k => (
                    <li key={k} className="flex gap-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300 min-w-[100px] truncate">{k}:</span>
                        <span className="truncate max-w-[200px]">{String(newVals[k] ?? '—')}</span>
                    </li>
                ))}
            </ul>
        );
    }
    // Updated — show diffs
    const keys = Object.keys(oldVals).filter(k => !['created_at', 'updated_at'].includes(k));
    if (keys.length === 0) return null;
    return (
        <ul className="mt-2 space-y-1 text-xs">
            {keys.map(k => (
                <li key={k} className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-700 dark:text-slate-300 min-w-[100px] truncate">{k}:</span>
                    <span className="line-through text-rose-500 truncate max-w-[120px]">{String(oldVals[k] ?? '—')}</span>
                    <ArrowLeftRight size={12} className="text-slate-400 shrink-0" />
                    <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">{String(newVals?.[k] ?? '—')}</span>
                </li>
            ))}
        </ul>
    );
}

function getModelName(subjectType) {
    if (!subjectType) return '—';
    return subjectType.split('\\').pop();
}

export default function ActivityLogsIndex({ logs }) {
    const { data, current_page, last_page, prev_page_url, next_page_url, total } = logs;

    // Retrieve current query params from URL
    const queryParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        event: queryParams.get('event') || '',
        date_from: queryParams.get('date_from') || '',
        date_to: queryParams.get('date_to') || '',
    });

    const applyFilters = (newFilters) => {
        setFilters(newFilters);
        router.get(
            '/activity-logs',
            // Omit empty strings to clean up the URL
            Object.fromEntries(Object.entries(newFilters).filter(([, v]) => v !== '')),
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleFilterChange = (key, value) => {
        applyFilters({ ...filters, [key]: value });
    };

    const resetFilters = () => {
        applyFilters({ event: '', date_from: '', date_to: '' });
    };

    const hasActiveFilters = filters.event || filters.date_from || filters.date_to;

    const columns = React.useMemo(() => [
        {
            accessorKey: 'created_at',
            header: 'Date / Time',
            enableSorting: true,
            cell: ({ row }) => {
                const log = row.original;
                return (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap border-b-0 py-1">
                        <Clock size={12} />
                        {new Date(log.created_at).toLocaleString('en-PH', {
                            dateStyle: 'medium', timeStyle: 'short',
                        })}
                    </div>
                );
            },
        },
        {
            id: 'causer',
            header: 'User',
            enableSorting: false,
            cell: ({ row }) => {
                const log = row.original;
                return (
                    <div className="py-1">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium text-xs">
                            <User size={12} className="text-slate-400 shrink-0" />
                            {log.causer?.name ?? <span className="italic text-slate-400">System</span>}
                        </div>
                        {log.causer?.email && (
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 pl-4">{log.causer.email}</div>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'event',
            header: 'Action',
            enableSorting: true,
            cell: ({ row }) => {
                const log = row.original;
                return <EventBadge event={log.event} />;
            }
        },
        {
            id: 'subject',
            header: 'Record',
            enableSorting: false,
            cell: ({ row }) => {
                const log = row.original;
                return (
                    <div className="flex items-center gap-1.5 py-1">
                        <Tag size={12} className="text-slate-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-200 font-medium text-xs truncate max-w-[150px]" title={getModelName(log.subject_type)}>
                            {getModelName(log.subject_type)}
                        </span>
                        {log.subject_id && (
                            <span className="text-slate-400 text-xs">#{log.subject_id}</span>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'properties',
            header: 'Changes',
            enableSorting: false,
            cell: ({ row }) => {
                const log = row.original;
                return (
                    <div className="py-1">
                        <PropertyChanges properties={log.properties} />
                    </div>
                );
            }
        }
    ], []);

    const filterToolbar = (
        <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <select
                    value={filters.event}
                    onChange={(e) => handleFilterChange('event', e.target.value)}
                    className="h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 dark:text-slate-300 shadow-sm"
                >
                    <option value="">All Actions</option>
                    <option value="created">Created</option>
                    <option value="updated">Updated</option>
                    <option value="deleted">Deleted</option>
                    <option value="restored">Restored</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">From</span>
                <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 dark:text-slate-300 shadow-sm"
                />
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">To</span>
                <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 dark:text-slate-300 shadow-sm"
                />
            </div>

            {hasActiveFilters && (
                <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X size={14} /> Clear Filters
                </button>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Activity Logs" />
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="pb-6 border-b border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <ScrollText className="text-blue-500" />
                        Activity Logs
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Audit trail of all user actions in the system. {total} total records.
                    </p>
                </header>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                    <DataTable
                        columns={columns}
                        data={data}
                        showSearch={true}
                        showPagination={false}
                        customToolbar={filterToolbar}
                    />
                </div>

                {/* Pagination */}
                {last_page > 1 && (
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Page {current_page} of {last_page}
                        </p>
                        <div className="flex gap-2">
                            <Link
                                href={prev_page_url ?? '#'}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                                    ${!prev_page_url
                                        ? 'border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600 pointer-events-none'
                                        : 'border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                preserveScroll
                            >
                                <ChevronLeft size={16} /> Previous
                            </Link>
                            <Link
                                href={next_page_url ?? '#'}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                                    ${!next_page_url
                                        ? 'border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600 pointer-events-none'
                                        : 'border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                preserveScroll
                            >
                                Next <ChevronRight size={16} />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
