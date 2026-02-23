import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import { FileText, PhilippinePeso, TrendingUp, PieChart, CreditCard } from 'lucide-react';

export default function FinanceDashboard({ stats }) {
    return (
        <AuthenticatedLayout>
            <Head title="Finance Dashboard" />
            <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
                    <div className="relative z-10">
                        <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-1">Finance & Accounting</p>
                        <h2 className="text-2xl font-bold mb-1">Finance Overview 💰</h2>
                        <p className="text-emerald-100 text-sm">You have <span className="font-bold text-white">{stats?.pendingInvoices || 0} invoices</span> and <span className="font-bold text-white">{stats?.pendingDisbursements || 0} disbursements</span> to process.</p>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Pending Invoices"
                        value={stats?.pendingInvoices?.toString() || '0'}
                        icon={<FileText className="text-orange-500" size={20} />}
                        trend="Needs Processing"
                        color="from-orange-500/10 to-transparent"
                    />
                    <StatCard
                        title="Disbursements"
                        value={stats?.pendingDisbursements?.toString() || '0'}
                        icon={<CreditCard className="text-indigo-500" size={20} />}
                        color="from-indigo-500/10 to-transparent"
                    />
                    <StatCard
                        title="Total Invoiced"
                        value={`₱${stats?.totalInvoicedAmount || '0'}`}
                        icon={<PhilippinePeso className="text-emerald-500" size={20} />}
                        trend="+5%"
                        color="from-emerald-500/10 to-transparent"
                    />
                    <StatCard
                        title="Reports Available"
                        value={stats?.reportsCount?.toString() || '0'}
                        icon={<PieChart className="text-blue-500" size={20} />}
                        color="from-blue-500/10 to-transparent"
                    />
                </div>

                {/* Quick Actions */}
                <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm p-6 rounded-3xl">
                    <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { label: 'Invoices', href: '/finance/invoices', icon: <FileText size={18} />, color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' },
                            { label: 'Disbursements', href: '/finance/disbursements', icon: <CreditCard size={18} />, color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
                            { label: 'Financial Reports', href: '/finance/reports', icon: <TrendingUp size={18} />, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                        ].map((action) => (
                            <a key={action.label} href={action.href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${action.color} hover:opacity-80 transition-opacity text-center`}>
                                {action.icon}
                                <span className="text-xs font-semibold">{action.label}</span>
                            </a>
                        ))}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, icon, trend, color }) {
    return (
        <Card className={`relative overflow-hidden group bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl p-5`}>
            <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br ${color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none`} />
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-white/50 dark:bg-zinc-800/50 rounded-xl border border-white/40 dark:border-white/5 backdrop-blur-md shadow-sm group-hover:scale-105 transition-transform duration-300">
                        {icon}
                    </div>
                    {trend && (
                        <div className="flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/10">
                            <TrendingUp size={12} /> {trend}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-3xl font-bold mb-1 tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">{value}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide uppercase">{title}</p>
                </div>
            </div>
        </Card>
    );
}
