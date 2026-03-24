import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import { WelcomeBanner } from '@/Components/UI/WelcomeBanner';
import { Package, Truck, ArrowDownCircle, TrendingUp, AlertCircle } from 'lucide-react';

export default function WarehouseDashboard({ stats }) {
    return (
        <AuthenticatedLayout>
            <Head title="Warehouse Dashboard" />
            <div className="space-y-6">
                <WelcomeBanner 
                    stats={{
                        message: `You have ${stats?.pendingReceiving || 0} deliveries awaiting receive confirmation.`
                    }} 
                />

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Inventory Items"
                        value={stats?.inventoryItems?.toString() || '0'}
                        icon={<Package className="text-teal-500" size={20} />}
                        color="from-teal-500/10 to-transparent"
                    />
                    <StatCard
                        title="Pending Receiving"
                        value={stats?.pendingReceiving?.toString() || '0'}
                        icon={<ArrowDownCircle className="text-orange-500" size={20} />}
                        trend="Incoming"
                        color="from-orange-500/10 to-transparent"
                    />
                    <StatCard
                        title="Site Releases"
                        value={stats?.siteReleases?.toString() || '0'}
                        icon={<Truck className="text-indigo-500" size={20} />}
                        color="from-indigo-500/10 to-transparent"
                    />
                    <StatCard
                        title="Low Stock Alerts"
                        value={stats?.lowStockAlerts?.toString() || '0'}
                        icon={<AlertCircle className="text-red-500" size={20} />}
                        trend="Check Now"
                        color="from-red-500/10 to-transparent"
                    />
                </div>

                {/* Quick Actions */}
                <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm p-6 rounded-3xl">
                    <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { label: 'View Inventory', href: '/inventory', icon: <Package size={18} />, color: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400' },
                            { label: 'Receive Goods', href: '/inventory/receiving', icon: <ArrowDownCircle size={18} />, color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' },
                            { label: 'Site Release', href: '/site-release', icon: <Truck size={18} />, color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
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
