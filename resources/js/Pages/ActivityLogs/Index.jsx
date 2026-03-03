import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ScrollText, User, Clock, Tag, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';

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
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                                    <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Date / Time</th>
                                    <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">User</th>
                                    <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Action</th>
                                    <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Record</th>
                                    <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Changes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                                            No activity logged yet.
                                        </td>
                                    </tr>
                                )}
                                {data.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        {/* Date */}
                                        <td className="px-5 py-4 align-top whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                                                <Clock size={12} />
                                                {new Date(log.created_at).toLocaleString('en-PH', {
                                                    dateStyle: 'medium', timeStyle: 'short',
                                                })}
                                            </div>
                                        </td>

                                        {/* User */}
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium text-xs">
                                                <User size={12} className="text-slate-400 shrink-0" />
                                                {log.causer?.name ?? <span className="italic text-slate-400">System</span>}
                                            </div>
                                            {log.causer?.email && (
                                                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 pl-4">{log.causer.email}</div>
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td className="px-5 py-4 align-top">
                                            <EventBadge event={log.event} />
                                        </td>

                                        {/* Record */}
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex items-center gap-1.5">
                                                <Tag size={12} className="text-slate-400 shrink-0" />
                                                <span className="text-slate-700 dark:text-slate-200 font-medium text-xs">{getModelName(log.subject_type)}</span>
                                                {log.subject_id && (
                                                    <span className="text-slate-400 text-xs">#{log.subject_id}</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Changes */}
                                        <td className="px-5 py-4 align-top max-w-xs">
                                            <PropertyChanges properties={log.properties} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
