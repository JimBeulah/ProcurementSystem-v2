import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { PieChart, PhilippinePeso, TrendingUp, Activity, BarChart3, ChevronDown, CheckCircle2, AlertCircle, ShoppingCart, CreditCard, Printer } from 'lucide-react';
import IncomeStatement from '@/Components/Finance/IncomeStatement';
import PdfPreviewModal from '@/Components/UI/PdfPreviewModal';

export default function FinancialReports() {
    const { data, projects, filters } = usePage().props;
    const [previewUrl, setPreviewUrl] = useState(null);

    const isProjectView = filters?.project_id !== null && filters?.project_id !== undefined;

    const handleProjectChange = (e) => {
        router.get(route('finance.reports'), { project_id: e.target.value }, { preserveState: true });
    };

    const handlePrint = () => {
        const url = route('finance.reports.print', { project_id: filters?.project_id || '' });
        setPreviewUrl(url);
    };

    // Aggregate View Logic
    const aggregateProjects = !isProjectView ? data : [];
    const totalBudget = aggregateProjects.reduce((a, c) => a + c.budget, 0);
    const totalCommitted = aggregateProjects.reduce((a, c) => a + c.committed, 0);
    const totalPaid = aggregateProjects.reduce((a, c) => a + (c.paid || 0), 0);

    // Project View Logic (P&L)
    const plData = isProjectView ? data : null;

    return (
        <AuthenticatedLayout>
            <Head title="Financial Reports" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="pb-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <PieChart className="text-indigo-500" /> Financial Reports
                        </h1>
                        <p className="text-slate-500">
                            {isProjectView ? `P&L Analysis for ${plData.project.name}` : "Aggregate Project Budget vs. Actual Costs Analysis."}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all no-print"
                        >
                            <Printer size={14} /> Print
                        </button>
                        <div className="flex items-center gap-2 no-print">
                            <label htmlFor="project-select" className="text-sm font-medium text-slate-500">Project:</label>
                            <select
                                id="project-select"
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none min-w-[200px]"
                                value={filters?.project_id || ''}
                                onChange={handleProjectChange}
                            >
                                <option value="">All Projects (Summary)</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                {!isProjectView ? (
                    <>
                        {/* KPI Cards (Aggregate) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><PhilippinePeso size={100} /></div>
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

                        {/* Project Cost Breakdown Table */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                <BarChart3 className="text-slate-400" size={18} />
                                <h2 className="font-bold text-slate-900 dark:text-white">Project Cost Breakdown</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
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
                                        {aggregateProjects.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => router.get(route('finance.reports'), { project_id: p.id })}>
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
                    </>
                ) : (
                    <div className="space-y-6">
                        <IncomeStatement data={plData} />

                        {/* Purchase Order Details */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mt-6">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ShoppingCart size={18} className="text-orange-500" /> Procurement Breakdown
                            </div>
                            <div className="max-h-[600px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-400 text-xs uppercase text-left">
                                        <tr>
                                            <th className="p-3">Ref/Supplier</th>
                                            <th className="p-3 text-right">Committed</th>
                                            <th className="p-3 text-right">Paid</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {plData.purchase_orders.map(po => (
                                            <tr key={po.id}>
                                                <td className="p-3">
                                                    <div className="font-bold text-slate-900 dark:text-white">PO-#{po.ref}</div>
                                                    <div className="text-xs text-slate-500">{po.supplier}</div>
                                                </td>
                                                <td className="p-3 text-right font-mono text-orange-500">{po.amount.toLocaleString()}</td>
                                                <td className="p-3 text-right font-mono text-emerald-600">{po.paid.toLocaleString()}</td>
                                                <td className="p-3">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${po.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {po.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <PdfPreviewModal
                isOpen={!!previewUrl}
                onClose={() => setPreviewUrl(null)}
                url={previewUrl}
                title={isProjectView ? `Financial Report - ${plData.project.name}` : "Aggregate Financial Report"}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print, header nav, aside {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                    }
                    .max-w-7xl {
                        max-width: 100% !important;
                        padding: 0 !important;
                    }
                }
            `}} />
        </AuthenticatedLayout>
    );
}
