import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import { WelcomeBanner } from '@/Components/UI/WelcomeBanner';
import {
    Package, UserCog, ShoppingCart, AlertCircle, ClipboardList, CheckCircle, TrendingUp, Database, Settings
} from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function AdminDashboard({ stats }) {

    return (
        <AuthenticatedLayout>
            <Head title="Admin Dashboard" />
            <div className="space-y-4 max-w-7xl mx-auto">
                <WelcomeBanner 
                    stats={{
                        message: `Good metrics today! You have ${stats?.pendingPOs || 0} pending orders and ${stats?.alerts || 0} system alerts requiring attention.`
                    }} 
                />

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ModernStatCard
                        title="Active Projects"
                        value={stats?.activeProjects?.toString() || '0'}
                        icon={<Package size={20} />}
                        accentColor="blue"
                    />
                    <ModernStatCard
                        title="Total Users"
                        value={stats?.totalUsers?.toString() || '0'}
                        icon={<UserCog size={20} />}
                        accentColor="purple"
                    />
                    <ModernStatCard
                        title="Pending PRs"
                        value={stats?.pendingPRs?.toString() || '0'}
                        icon={<ClipboardList size={20} />}
                        accentColor="orange"
                        trend={stats?.pendingPRs > 0 ? "Action Required" : null}
                    />
                    <ModernStatCard
                        title="Total Orders"
                        value={stats?.totalOrders?.toString() || '0'}
                        icon={<ShoppingCart size={20} />}
                        accentColor="indigo"
                    />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Charts Section */}
                    <Card className="lg:col-span-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-5 rounded-3xl">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-500" />
                                Spend Analysis & Profit
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Cumulative BOQ budget vs. cumulative PO spend. Savings line shows remaining unspent budget over time.</p>
                        </div>

                        <div className="h-[220px] md:h-[280px] w-full mt-2">
                            {stats?.spendAnalysis?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={stats.spendAnalysis} margin={{ top: 20, right: 20, bottom: 0, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#71717a', fontSize: 12 }}
                                            tickFormatter={(value) => `₱${value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : value / 1000 + 'k'}`}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(8px)',
                                                color: '#18181b',
                                                fontWeight: 500
                                            }}
                                            formatter={(value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#3f3f46' }} />
                                        <Bar dataKey="budget" name="BOQ Budget (Cumulative)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                        <Bar dataKey="spend" name="PO Spend (Cumulative)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                                        <Line type="monotone" dataKey="profit" name="Remaining Savings" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                    <Database size={32} className="mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No financial data available for visualization.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Alerts & Actions sidebar */}
                    <div className="space-y-4">
                        {/* System Alerts */}
                        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-5 rounded-3xl">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    System Alerts
                                </h3>
                                {stats?.alerts > 0 && (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 text-xs font-bold text-red-600 dark:text-red-400">
                                        {stats.alerts}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {stats?.alerts > 0 ? (
                                    <div className="group relative overflow-hidden rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-3 transition-all hover:bg-red-50 dark:hover:bg-red-500/10">
                                        <div className="absolute left-0 top-0 h-full w-1 bg-red-500" />
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 rounded-full bg-red-100 dark:bg-red-500/20 p-1.5 shrink-0">
                                                <AlertCircle className="text-red-600 dark:text-red-400" size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-red-900 dark:text-red-200">Declined Orders</p>
                                                <p className="mt-1 text-xs leading-relaxed text-red-700/80 dark:text-red-300/80 mb-3">
                                                    There are {stats.alerts} declined purchase orders that require review from the system administrator.
                                                </p>
                                                <Link href="/purchasing/orders" className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors inline-flex items-center gap-1">
                                                    Review Orders <span>→</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-full mb-3">
                                            <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">All systems operational</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[200px]">No pending alerts or declined orders require your attention.</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Quick Links Modern */}
                        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-5 rounded-3xl">
                            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <ModernQuickLink href="/settings/users" icon={<UserCog size={18} />} label="Users" brand="purple" />
                                <ModernQuickLink href="/projects" icon={<Package size={18} />} label="Projects" brand="blue" />
                                <ModernQuickLink href="/finance/reports" icon={<TrendingUp size={18} />} label="Reports" brand="emerald" />
                                <ModernQuickLink href="/settings" icon={<Settings size={18} />} label="Settings" brand="slate" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ModernStatCard({ title, value, icon, trend, accentColor }) {
    // Utility for color mappings
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
        purple: 'from-purple-500/20 to-purple-600/5 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
        orange: 'from-orange-500/20 to-orange-600/5 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
        indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
    };

    const theme = colors[accentColor] || colors.blue;

    return (
        <Card className={`relative overflow-hidden group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl p-4`}>
            {/* Background Glow Effect — hidden on mobile to reduce GPU load */}
            <div className={`hidden md:block absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${theme.split(' ')[0]} ${theme.split(' ')[1]} rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2.5 rounded-xl ${theme.split(' ').slice(2).join(' ')} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        {icon}
                    </div>
                    {trend && (
                        <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                            {trend}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-2xl font-black mb-0.5 tracking-tight text-zinc-900 dark:text-white font-sans">{value}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">{title}</p>
                </div>
            </div>
        </Card>
    );
}

function ModernQuickLink({ href, icon, label, brand }) {
    const brands = {
        purple: 'hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:border-purple-200 dark:hover:border-purple-500/30 group-hover:text-purple-600 dark:group-hover:text-purple-400',
        blue: 'hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 group-hover:text-blue-600 dark:group-hover:text-blue-400',
        emerald: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
        slate: 'hover:bg-slate-50 dark:hover:bg-slate-500/10 hover:border-slate-300 dark:hover:border-slate-500/30 group-hover:text-slate-700 dark:group-hover:text-slate-300',
    };

    return (
        <Link
            href={href}
            aria-label={label}
            className={`group flex items-center gap-3 p-3.5 min-h-[48px] rounded-xl border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/30 transition-all duration-200 active:scale-95 ${brands[brand]}`}
        >
            <div className="text-zinc-400 dark:text-zinc-500 transition-colors duration-200">
                {icon}
            </div>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-colors duration-200">{label}</span>
        </Link>
    );
}
