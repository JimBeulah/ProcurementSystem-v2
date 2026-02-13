import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import {
    Clock, Activity, ShoppingCart, AlertCircle, ArrowUpRight,
} from 'lucide-react';

export default function Dashboard() {
    const { stats } = usePage().props;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <header className="flex justify-between items-center pb-4 border-b border-border/40">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mb-0.5 font-heading">Dashboard Overview</h1>
                        <p className="text-sm text-muted">Welcome back, get an update on your projects.</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/5 border border-accent/10 text-xs font-medium text-accent/80 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                            System Operational
                        </div>
                    </div>
                </header>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Pending Approvals"
                        value={stats?.pendingPOs?.toString() || '0'}
                        icon={<Clock className="text-orange-500" size={18} />}
                        trend="+2 New"
                        color="from-orange-500/10 to-transparent"
                    />
                    <StatCard
                        title="Active Projects"
                        value={stats?.activeProjects?.toString() || '0'}
                        icon={<Activity className="text-blue-500" size={18} />}
                        trend="On Time"
                        color="from-blue-500/10 to-transparent"
                    />
                    <StatCard
                        title="Total Orders"
                        value={stats?.totalOrders?.toString() || '0'}
                        icon={<ShoppingCart className="text-indigo-500" size={18} />}
                        trend="+12%"
                        color="from-indigo-500/10 to-transparent"
                    />
                    <StatCard
                        title="System Alerts"
                        value={stats?.alerts?.toString() || '0'}
                        icon={<AlertCircle className="text-red-500" size={18} />}
                        trend="Check Inventory"
                        color="from-red-500/10 to-transparent"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Activities */}
                        <Card className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold font-heading">Recent Activities</h3>
                                <button className="text-xs font-semibold text-primary hover:underline cursor-pointer">View All</button>
                            </div>
                            <div className="space-y-1">
                                {(stats?.recentActivities || [
                                    { id: 1, title: 'New Purchase Order Created', code: 'PO-2026-001', time: 'Just now' },
                                    { id: 2, title: 'Material Request Approved', code: 'MR-2026-005', time: '2h ago' },
                                    { id: 3, title: 'Delivery Received', code: 'RR-2026-003', time: '4h ago' },
                                    { id: 4, title: 'Invoice Processed', code: 'INV-2026-012', time: 'Yesterday' },
                                ]).map(activity => (
                                    <div key={activity.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/[0.03] transition-colors group cursor-pointer border border-transparent hover:border-border/40">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-muted/10 flex items-center justify-center text-muted group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                                <Activity size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium group-hover:text-primary">{activity.title}</p>
                                                <p className="text-[11px] text-muted tracking-tight">{activity.code} • {activity.time}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-[10px] font-bold tracking-wider uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                            Running
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Budget Utilization */}
                    <div>
                        <Card className="h-full bg-card/50">
                            <h3 className="text-lg font-bold mb-4 font-heading">Budget Utilization</h3>
                            <div className="space-y-5">
                                {(stats?.budgetItems || [
                                    { name: 'Skyline Tower', progress: 75, budget: '50M' },
                                    { name: 'Seaside Villa', progress: 32, budget: '15M' },
                                    { name: 'City Hardware', progress: 90, budget: '2M', color: 'bg-red-500' },
                                ]).map((item, i) => (
                                    <BudgetRow key={i} {...item} />
                                ))}
                            </div>

                            <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden text-white shadow-lg shadow-blue-500/20">
                                <div className="relative z-10">
                                    <h4 className="font-bold text-sm mb-1">Pro Tip</h4>
                                    <p className="text-blue-50/80 text-[11px] leading-relaxed mb-3">Review DUPA limits before approving large orders to maintain budget health.</p>
                                    <button className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50 transition-colors cursor-pointer">
                                        Check Reports
                                    </button>
                                </div>
                                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
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
        <Card hoverEffect className="relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${color} rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-muted/5 rounded-lg border border-border/40 backdrop-blur-sm">
                        {icon}
                    </div>
                    {trend && (
                        <div className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-tight">
                            <ArrowUpRight size={10} /> {trend}
                        </div>
                    )}
                </div>

                <h3 className="text-2xl font-bold mb-0.5 tracking-tight font-heading">{value}</h3>
                <p className="text-[11px] text-muted font-semibold uppercase tracking-wider">{title}</p>
            </div>
        </Card>
    );
}

function BudgetRow({ name, progress, budget, color = "bg-primary" }) {
    return (
        <div>
            <div className="flex justify-between mb-1.5">
                <div>
                    <p className="text-xs font-bold">{name}</p>
                    <p className="text-[10px] text-muted font-medium">Budget: ₱{budget}</p>
                </div>
                <span className="text-xs font-bold text-muted">{progress}%</span>
            </div>
            <div className="h-1.5 bg-muted/10 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-sm shadow-primary/20`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}
