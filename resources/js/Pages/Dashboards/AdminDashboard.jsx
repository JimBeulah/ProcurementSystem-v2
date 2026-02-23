import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import {
    Clock, Activity, ShoppingCart, AlertCircle,
    TrendingUp, Package, FileText, AlertTriangle, Users, PhilippinePeso
} from 'lucide-react';

export default function AdminDashboard({ stats }) {
    return (
        <AuthenticatedLayout>
            <Head title="Admin Dashboard" />
            <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Pending Approvals"
                        value={stats?.pendingPOs?.toString() || '0'}
                        icon={<Clock className="text-orange-500" size={20} />}
                        trend="+2 New"
                        color="from-orange-500/10 to-transparent"
                    />
                    <StatCard
                        title="Active Projects"
                        value={stats?.activeProjects?.toString() || '0'}
                        icon={<Activity className="text-blue-500" size={20} />}
                        trend="On Time"
                        color="from-blue-500/10 to-transparent"
                    />
                    <StatCard
                        title="Total Orders"
                        value={stats?.totalOrders?.toString() || '0'}
                        icon={<ShoppingCart className="text-indigo-500" size={20} />}
                        trend="+12%"
                        color="from-indigo-500/10 to-transparent"
                    />
                    <StatCard
                        title="System Alerts"
                        value={stats?.alerts?.toString() || '0'}
                        icon={<AlertCircle className="text-red-500" size={20} />}
                        trend="Check Inventory"
                        color="from-red-500/10 to-transparent"
                    />
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers?.toString() || '0'}
                        icon={<Users className="text-teal-500" size={20} />}
                        color="from-teal-500/10 to-transparent"
                    />
                    <StatCard
                        title="Pending PRs"
                        value={stats?.pendingPRs?.toString() || '0'}
                        icon={<FileText className="text-amber-500" size={20} />}
                        color="from-amber-500/10 to-transparent"
                    />
                    <StatCard
                        title="Total Finance Records"
                        value={stats?.totalInvoices?.toString() || '0'}
                        icon={<PhilippinePeso className="text-emerald-500" size={20} />}
                        color="from-emerald-500/10 to-transparent"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Activities */}
                        <Card className="p-0 overflow-hidden bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm rounded-3xl">
                            <div className="p-5 flex justify-between items-center border-b border-white/10 dark:border-white/5">
                                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Recent Activities</h3>
                                <button className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">View All</button>
                            </div>
                            <div className="p-2">
                                {(stats?.recentActivities || [
                                    { id: 1, title: 'New Purchase Order Created', code: 'PO-2026-001', time: 'Just now', type: 'po' },
                                    { id: 2, title: 'Material Request Approved', code: 'MR-2026-005', time: '2h ago', type: 'mr' },
                                    { id: 3, title: 'Delivery Received', code: 'RR-2026-003', time: '4h ago', type: 'delivery' },
                                    { id: 4, title: 'Invoice Processed', code: 'INV-2026-012', time: 'Yesterday', type: 'invoice' },
                                ]).map((activity, index) => (
                                    <div key={activity.id} className={`flex items-center justify-between p-3 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-all group cursor-pointer ${index !== 3 ? 'mb-1' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm ${activity.type === 'po' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                                                activity.type === 'mr' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' :
                                                    activity.type === 'delivery' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                        'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                                                }`}>
                                                {activity.type === 'po' && <FileText size={18} />}
                                                {activity.type === 'mr' && <Activity size={18} />}
                                                {activity.type === 'delivery' && <Package size={18} />}
                                                {activity.type === 'invoice' && <TrendingUp size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{activity.title}</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{activity.code} • {activity.time}</p>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Budget Utilization */}
                    <div>
                        <Card className="h-full bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm p-6 rounded-3xl space-y-6">
                            <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Budget Utilization</h3>
                            <div className="space-y-6">
                                {(stats?.budgetItems || [
                                    { name: 'Skyline Tower', progress: 75, budget: '50M', color: 'bg-blue-500' },
                                    { name: 'Seaside Villa', progress: 32, budget: '15M', color: 'bg-pink-500' },
                                    { name: 'City Hardware', progress: 90, budget: '2M', color: 'bg-orange-500' },
                                ]).map((item, i) => (
                                    <BudgetRow key={i} {...item} />
                                ))}
                            </div>
                            <div className="mt-8 p-0 rounded-2xl overflow-hidden relative group cursor-pointer">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-90" />
                                <div className="relative z-10 p-5 text-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm">Pro Tip</h4>
                                        <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                            <AlertTriangle size={14} className="text-white" />
                                        </div>
                                    </div>
                                    <p className="text-blue-50 text-xs leading-relaxed mb-4 font-medium opacity-90">Review DUPA limits before approving large orders to maintain budget health.</p>
                                    <button className="w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition-all border border-white/10">
                                        Check Reports
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
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

function BudgetRow({ name, progress, budget, color = "bg-primary" }) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Budget: ₱{budget}</p>
                </div>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{progress}%</span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-sm`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}
