import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import { WelcomeBanner } from '@/Components/UI/WelcomeBanner';
import {
    FileText, ShoppingCart, Clock, Package, TrendingUp, CheckCircle, BarChart3, Activity
} from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function ProjectManagerDashboard({ stats }) {
    return (
        <AuthenticatedLayout>
            <Head title="Project Manager Dashboard" />
            <div className="space-y-4 max-w-7xl mx-auto">
                <WelcomeBanner 
                    stats={{
                        message: `You have ${stats?.pendingMRs || 0} pending material requests awaiting your review.`
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
                        title="Pending MRs"
                        value={stats?.pendingMRs?.toString() || '0'}
                        icon={<Clock size={20} />}
                        accentColor="orange"
                        trend="Needs Review"
                    />
                    <ModernStatCard
                        title="Pending POs"
                        value={stats?.pendingPOs?.toString() || '0'}
                        icon={<ShoppingCart size={20} />}
                        accentColor="indigo"
                    />
                    <ModernStatCard
                        title="Approved (MTD)"
                        value={stats?.approvedThisMonth?.toString() || '0'}
                        icon={<CheckCircle size={20} />}
                        accentColor="emerald"
                        trend="+8%"
                    />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Charts & Budget Section */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Spend Analysis Chart Card */}
                        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-5 rounded-3xl">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-emerald-500" />
                                        Spend Analysis & Profit
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Project budget utilization versus actual expenses and profit/savings.</p>
                                </div>
                            </div>

                            <div className="h-[260px] w-full mt-2">
                                {stats?.spendAnalysis?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={stats.spendAnalysis} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
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
                                            <Bar dataKey="budget" name="Original Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="spend" name="Actual Spend" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Line type="monotone" dataKey="profit" name="Profit / Savings" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                        <Activity size={32} className="mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No financial data available.</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Budget Utilization */}
                        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-5 rounded-3xl">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Budget Utilization</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Financial overview for active projects.</p>
                                </div>
                                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold rounded-full">This Quarter</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {(stats?.budgetItems || [
                                    { name: 'Skyline Tower', progress: 75, budget: '50M', color: 'bg-blue-500' },
                                    { name: 'Seaside Villa', progress: 32, budget: '15M', color: 'bg-teal-500' },
                                    { name: 'City Hardware', progress: 90, budget: '2M', color: 'bg-orange-500' },
                                ]).map((item, i) => (
                                    <ModernBudgetRow key={i} {...item} />
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Quick Actions Sidebar */}
                    <div className="space-y-4">
                        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm p-5 rounded-3xl h-full">
                            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <ModernQuickAction href="/projects" icon={<Package size={20} />} label="Projects" brand="blue" />
                                <ModernQuickAction href="/purchasing/approvals" icon={<FileText size={20} />} label="MR Approvals" brand="orange" />
                                <ModernQuickAction href="/purchasing/orders" icon={<ShoppingCart size={20} />} label="Purchase Orders" brand="indigo" />
                                <ModernQuickAction href="/finance/reports" icon={<TrendingUp size={20} />} label="Reports" brand="emerald" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ModernStatCard({ title, value, icon, trend, accentColor }) {
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
        emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
        orange: 'from-orange-500/20 to-orange-600/5 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
        indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
    };

    const theme = colors[accentColor] || colors.blue;

    return (
        <Card className={`relative overflow-hidden group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl p-4`}>
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${theme.split(' ')[0]} ${theme.split(' ')[1]} rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none`} />

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

function ModernBudgetRow({ name, progress, budget, color = "bg-blue-500" }) {
    return (
        <div className="group">
            <div className="flex justify-between mb-2 items-end">
                <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-tight">{name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Budget: ₱{budget}</p>
                </div>
                <span className="text-xs font-black text-zinc-900 dark:text-white tracking-tight">{progress}%</span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-800">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000 ease-out relative`}
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                </div>
            </div>
        </div>
    );
}

function ModernQuickAction({ href, icon, label, brand }) {
    const brands = {
        blue: 'hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 text-blue-600 dark:text-blue-400',
        orange: 'hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-200 dark:hover:border-orange-500/30 text-orange-600 dark:text-orange-400',
        indigo: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
        emerald: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    };

    return (
        <a
            href={href}
            className={`group flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/30 transition-all duration-300 hover:shadow-md ${brands[brand]}`}
        >
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 transition-colors duration-200 text-center leading-tight">
                {label}
            </span>
        </a>
    );
}
