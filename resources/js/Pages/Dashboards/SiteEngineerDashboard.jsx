import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import { WelcomeBanner } from '@/Components/UI/WelcomeBanner';
import { Briefcase, FileText, Truck, TrendingUp, Package, ChevronRight } from 'lucide-react';

export default function SiteEngineerDashboard({ stats }) {

    return (
        <AuthenticatedLayout>
            <Head title="Site Engineer Dashboard" />
            <div className="space-y-6">
                <WelcomeBanner 
                    stats={{
                        message: `You have ${stats?.pendingMRs || 0} material requests pending and ${stats?.pendingSiteReleases || 0} releases to confirm.`
                    }} 
                />

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="My Projects"
                        value={stats?.activeProjects?.toString() || '0'}
                        icon={<Briefcase className="text-blue-500" size={20} />}
                        color="from-blue-500/10 to-transparent"
                    />
                    <StatCard
                        title="My Material Requests"
                        value={stats?.myMRs?.toString() || '0'}
                        icon={<FileText className="text-orange-500" size={20} />}
                        trend={stats?.pendingMRs > 0 ? `${stats.pendingMRs} Pending` : undefined}
                        color="from-orange-500/10 to-transparent"
                    />
                    <StatCard
                        title="Pending Confirmations"
                        value={stats?.pendingSiteReleases?.toString() || '0'}
                        icon={<Truck className="text-teal-500" size={20} />}
                        trend={stats?.pendingSiteReleases > 0 ? 'Action Needed' : undefined}
                        color="from-teal-500/10 to-transparent"
                    />
                </div>

                {/* Pending Deliveries Link */}
                <Link href="/operations/deliveries" className="block">
                    <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm p-5 rounded-3xl hover:shadow-md transition-all group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                <Truck size={18} className="text-indigo-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Pending Deliveries</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {stats?.pendingSiteReleases > 0
                                        ? <><span className="font-bold text-indigo-600">{stats.pendingSiteReleases}</span> awaiting confirmation</>
                                        : 'No pending deliveries'}
                                </p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                    </Card>
                </Link>

                {/* Quick Actions */}
                <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm p-6 rounded-3xl">
                    <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { label: 'My Projects', href: '/projects', icon: <Briefcase size={18} />, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
                            { label: 'Material Requests', href: '/projects', icon: <FileText size={18} />, color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' },
                            { label: 'Site Releases', href: '/site-release', icon: <Truck size={18} />, color: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400' },
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

