import React from 'react';
import { TrendingUp, ShoppingCart, Activity, CreditCard, ChevronDown, CheckCircle2, AlertCircle, PieChart, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/Components/UI/Card';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
};

const Row = ({ label, amount, isSubtotal = false, isTotal = false, indent = false, className = "" }) => (
    <div className={`flex justify-between py-2 ${isSubtotal ? 'border-t border-slate-200 dark:border-slate-700 font-semibold' : ''} ${isTotal ? 'border-t-2 border-slate-400 dark:border-slate-500 font-bold text-lg pt-4 mt-2' : ''} ${className}`}>
        <span className={`${indent ? 'pl-6' : ''} text-slate-600 dark:text-slate-400`}>{label}</span>
        <span className="font-mono">{formatCurrency(amount)}</span>
    </div>
);

export default function IncomeStatement({ data }) {
    if (!data || !data.income_statement) return null;

    const { revenue, cogs, gross_profit, operating_expenses, net_income } = data.income_statement;
    const isProfit = net_income.amount >= 0;

    return (
        <div className="space-y-8">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Total Revenue</div>
                    <div className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono tracking-tight">
                        {formatCurrency(revenue.total_operating_revenue)}
                    </div>
                </Card>
                <Card className="p-4 bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
                    <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-1">Total COGS</div>
                    <div className="text-2xl font-black text-orange-700 dark:text-orange-300 font-mono tracking-tight">
                        {formatCurrency(cogs.total_cogs)}
                    </div>
                </Card>
                <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Gross Profit</div>
                    <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono tracking-tight">
                        {formatCurrency(gross_profit.amount)}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-500 mt-1">{gross_profit.margin.toFixed(1)}% Margin</div>
                </Card>
                <Card className={`${isProfit ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'} p-4`}>
                    <div className={`text-xs font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'} uppercase mb-1`}>Net Income</div>
                    <div className={`text-2xl font-black ${isProfit ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'} font-mono tracking-tight`}>
                        {formatCurrency(net_income.amount)}
                    </div>
                    <div className={`text-[10px] font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'} mt-1`}>{net_income.margin.toFixed(1)}% Net Margin</div>
                </Card>
            </div>

            {/* Formal Income Statement Table */}
            <Card className="p-8 max-w-4xl mx-auto shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 border-none bg-white dark:bg-slate-800">
                <div className="text-center mb-10 border-b border-slate-100 dark:border-slate-700 pb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">Statement of Income</h2>
                    <p className="text-slate-500 font-medium mt-1">{data.project.name}</p>
                    <p className="text-xs text-slate-400 mt-2 italic">As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="space-y-4">
                    {/* Revenue Section */}
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 dark:border-slate-800 pb-1">Operating Revenue</h3>
                        <Row label="Contract Amount (Budget)" amount={revenue.contract_amount} indent />
                        <Row label="Other Project Income" amount={revenue.other_income} indent />
                        <Row label="Total Operating Revenue" amount={revenue.total_operating_revenue} isSubtotal className="text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* COGS Section */}
                    <div className="pt-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 dark:border-slate-800 pb-1 flex justify-between items-center">
                            <span>Cost of Goods Sold (Direct Costs)</span>
                            {cogs.variance !== undefined && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${cogs.variance > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    Variance: {cogs.variance > 0 ? '+' : ''}{formatCurrency(cogs.variance)}
                                </span>
                            )}
                        </h3>
                        {cogs.boq_baseline && <Row label="Estimated Baseline (BOQ)" amount={cogs.boq_baseline} indent className="opacity-60 italic scale-95 origin-left" />}
                        <Row label="Committed Purchase Orders" amount={cogs.committed_pos} indent />
                        <Row label="Other Direct Costs (Labor/Extra)" amount={cogs.other_direct_costs} indent />
                        <Row label="Total Cost of Goods Sold" amount={cogs.total_cogs} isSubtotal className="text-orange-600 dark:text-orange-400 underline decoration-slate-200 underline-offset-8" />
                    </div>

                    {/* Gross Profit */}
                    <div className="pt-2">
                        <Row label="Gross Profit" amount={gross_profit.amount} isSubtotal className="bg-slate-50 dark:bg-slate-900/50 px-3 rounded-lg" />
                    </div>

                    {/* Operating Expenses */}
                    <div className="pt-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 dark:border-slate-800 pb-1">Operating Expenses (Indirect Costs)</h3>
                        <Row label="General and Administrative" amount={operating_expenses.total} indent />
                        <Row label="Total Operating Expenses" amount={operating_expenses.total} isSubtotal />
                    </div>

                    {/* Net Income */}
                    <div className="pt-6">
                        <Row
                            label="Net Income (Loss)"
                            amount={net_income.amount}
                            isTotal
                            className={isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
                        />
                        <div className="flex justify-between items-center px-1 mt-2">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Profit Margin Percentage</span>
                            <span className={`text-sm font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>{net_income.margin.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Health</h4>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isProfit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {isProfit ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            </div>
                            <div>
                                <div className="text-sm font-bold dark:text-white">{isProfit ? 'Profitable' : 'Below Breakeven'}</div>
                                <div className="text-[10px] text-slate-500">Based on committed costs vs budget</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end justify-end">
                        <div className="text-[8px] text-slate-400 font-mono">Generated by Procurement System v2.0</div>
                        <div className="text-[8px] text-slate-400 font-mono italic">Altapil Construction & Trading</div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
