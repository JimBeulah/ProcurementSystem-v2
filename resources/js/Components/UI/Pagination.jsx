import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ links, meta }) {
    if (!links || !meta || meta.last_page === 1) return null;

    const { from, to, total } = meta;

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-transparent border-t border-slate-200 dark:border-slate-700 sm:px-6">
            <div className="flex justify-between flex-1 sm:hidden">
                <Link
                    href={links.prev || '#'}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 ${!links.prev ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                    Previous
                </Link>
                <Link
                    href={links.next || '#'}
                    className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 ${!links.next ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                    Next
                </Link>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-700 dark:text-slate-400">
                        Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of{' '}
                        <span className="font-medium">{total}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {meta.links.map((link, index) => {
                            // Custom labels for icons
                            let label = link.label;
                            let icon = null;
                            
                            if (label.includes('Previous')) {
                                icon = <ChevronLeft size={16} />;
                                label = null;
                            } else if (label.includes('Next')) {
                                icon = <ChevronRight size={16} />;
                                label = null;
                            }

                            return (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={!icon ? { __html: label } : undefined}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${
                                        index === 0 ? 'rounded-l-md' : ''
                                    } ${index === meta.links.length - 1 ? 'rounded-r-md' : ''}`}
                                >
                                    {icon}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
}
