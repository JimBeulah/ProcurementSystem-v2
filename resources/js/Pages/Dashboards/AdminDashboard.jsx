import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import {
    Package, Users, ShoppingCart, AlertCircle, FileText, CheckCircle, TrendingUp, ShieldCheck
} from 'lucide-react';

export default function AdminDashboard({ stats }) {
    return (
        <AuthenticatedLayout>
            <Head title="Admin Dashboard" />
            <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white relative overflow-hidden shadow-lg border border-indigo-500/20">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="text-indigo-200" size={18} />
                            <p className="text-indigo-100 text-xs font-semibold uppercase tracking-widest">System Administrator</p>
                        </div>
                        <h2 className="text-2xl font-bold mb-1 tracking-tight">System Overview</h2>
                        <p className="text-indigo-100 text-sm max-w-xl">
                            You have <span className="font-bold text-white">{stats?.pendingPOs || 0} pending orders</span> and <span className="font-bold text-white">{stats?.alerts || 0} system alerts</span> requiring attention.
                        </p>
                    </div>
                </div>

                {/* Primary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Active Projects"
                        value={stats?.activeProjects?.toString() || '0'}
                        icon={<Package className="text-blue-500" size={20} />}
                        color="from-blue-500/10 to-transparent"
                    />
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers?.toString() || '0'}
                        icon={<Users className="text-purple-500" size={20} />}
                        color="from-purple-500/10 to-transparent"
                    />
                    <StatCard
                        title="Pending PRs"
                        value={stats?.pendingPRs?.toString() || '0'}
                        icon={<FileText className="text-orange-500" size={20} />}
                        trend={stats?.pendingPRs > 0 ? "Action Required" : null}
                        color="from-orange-500/10 to-transparent"
                    />
                    <StatCard
                        title="Total Orders (POs)"
                        value={stats?.totalOrders?.toString() || '0'}
                        icon={<ShoppingCart className="text-indigo-500" size={20} />}
                        color="from-indigo-500/10 to-transparent"
                    />
                </div>

                {/* Secondary Action Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* System Alerts */}
                    <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm p-6 rounded-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <AlertCircle className="text-red-500" size={18} />
                                System Alerts
                            </h3>
                            <span className="text-xs bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2 py-1 rounded-full">
                                {stats?.alerts || 0} Issues
                            </span>
                        </div>

                        <div className="space-y-4">
                            {stats?.alerts > 0 ? (
                                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-xl">
                                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Declined Purchase Orders</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">There are {stats.alerts} declined orders that require review or modification.</p>
                                        <Link href="/purchasing/orders" className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline mt-2 inline-block">Review Orders →</Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-zinc-400 dark:text-zinc-500">
                                    <CheckCircle size={32} className="mb-2 opacity-50 text-emerald-500" />
                                    <p className="text-sm font-medium">All systems normal</p>
                                    <p className="text-xs">No pending alerts or declined orders.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quick Links */}
                    <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm p-6 rounded-3xl">
                        <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">Quick Administration</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickLink
                                href="/settings/users"
                                icon={<Users size={18} />}
                                label="Manage Users"
                                desc="Add or edit system roles"
                                color="bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400"
                            />
                            <QuickLink
                                href="/projects"
                                icon={<Package size={18} />}
                                label="Project Master"
                                desc="View all active projects"
                                color="bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400"
                            />
                            <QuickLink
                                href="/settings/master-data"
                                icon={<FileText size={18} />}
                                label="Master Data"
                                desc="System lookup values"
                                color="bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-500/10 dark:border-slate-500/20 dark:text-slate-400"
                            />
                            <QuickLink
                                href="/finance/reports"
                                icon={<TrendingUp size={18} />}
                                label="Financial Reports"
                                desc="View overall expenditure"
                                color="bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                            />
                        </div>
                    </Card>
                </div>
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
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-md border border-orange-500/10">
                            <AlertCircle size={10} /> {trend}
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

function QuickLink({ href, icon, label, desc, color }) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-start gap-2 p-4 rounded-2xl border ${color} hover:opacity-80 transition-opacity text-left`}
        >
            <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg backdrop-blur-sm">
                {icon}
            </div>
            <div>
                <span className="text-sm font-semibold block mb-0.5">{label}</span>
                <span className="text-[10px] opacity-80 block">{desc}</span>
            </div>
        </Link>
    );
}
