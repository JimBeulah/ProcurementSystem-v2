import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { PieChart, DollarSign, TrendingUp, Activity, BarChart3 } from 'lucide-react';

export default function FinancialReports() {
    const { data } = usePage().props;
    const projects = data || [];

    const totalBudget = projects.reduce((a, c) => a + c.budget, 0);
    const totalCommitted = projects.reduce((a, c) => a + c.committed, 0);
    const totalPaid = projects.reduce((a, c) => a + c.paid, 0);

    return (
        <AuthenticatedLayout>
            <Head title="Financial Reports" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <header className="pb-6 border-b border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <PieChart className="text-indigo-500" /> Financial Reports
                    </h1>
                    <p className="text-slate-500">Project Budget vs. Actual Costs Analysis.</p>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={100} /></div>
                        <div className="text-sm text-slate-500 uppercase font-bold mb-2">Total Budget</div>
                        <div className="text-3xl font-mono text-slate-900 dark:text-white font-bold">
                            {totalBudget.toLocaleString(undefined, { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-4 h-1 bg-slate-100 dark:bg-slate-700 rounded-full"><div className="h-full bg-blue-500 w-full rounded-full"></div></div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={100} /></div>
                        <div className="text-sm text-slate-500 uppercase font-bold mb-2">Committed Costs (PO)</div>
                        <div className="text-3xl font-mono text-orange-500 font-bold">
                            {totalCommitted.toLocaleString(undefined, { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-4 h-1 bg-slate-100 dark:bg-slate-700 rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0}%` }}></div></div>
                        <div className="text-xs text-slate-500 mt-2">{totalBudget > 0 ? ((totalCommitted / totalBudget) * 100).toFixed(1) : 0}% of Budget</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity size={100} /></div>
                        <div className="text-sm text-slate-500 uppercase font-bold mb-2">Actual Paid</div>
                        <div className="text-3xl font-mono text-emerald-500 font-bold">
                            {totalPaid.toLocaleString(undefined, { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-4 h-1 bg-slate-100 dark:bg-slate-700 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalCommitted > 0 ? (totalPaid / totalCommitted) * 100 : 0}%` }}></div></div>
                        <div className="text-xs text-slate-500 mt-2">{totalCommitted > 0 ? ((totalPaid / totalCommitted) * 100).toFixed(1) : 0}% of Committed</div>
                    </div>
                </div>

                {/* Project Cost Breakdown */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <BarChart3 className="text-slate-400" size={18} />
                        <h2 className="font-bold text-slate-900 dark:text-white">Project Cost Breakdown</h2>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Project</th>
                                <th className="p-4 text-right">Budget</th>
                                <th className="p-4 text-right">Committed</th>
                                <th className="p-4 text-right">Invoiced</th>
                                <th className="p-4 text-right">Paid</th>
                                <th className="p-4 text-right">Remaining</th>
                                <th className="p-4 w-32">Usage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {projects.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4">
                                        <div className="text-slate-900 dark:text-white font-bold">{p.name}</div>
                                        <div className="text-xs text-slate-500">{p.clientName}</div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-900 dark:text-white">{p.budget.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-orange-500">{p.committed.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-slate-500">{p.invoiced.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-emerald-500">{p.paid.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">{p.remaining.toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                                            <div className={`h-1.5 rounded-full ${p.progress > 90 ? 'bg-red-500' : p.progress > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(p.progress, 100)}%` }}></div>
                                        </div>
                                        <div className="text-xs text-right text-slate-500">{p.progress.toFixed(0)}%</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
