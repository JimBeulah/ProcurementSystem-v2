import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card';
import { Briefcase, FileText, Truck, TrendingUp, CheckCircle, Package } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/Components/UI/Modal';

export default function SiteEngineerDashboard({ stats, pendingReleases = [] }) {
    const [confirming, setConfirming] = useState(null);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    const handleAction = (item) => {
        if (confirming) return;
        setSelectedDelivery(item);
    };

    const submitReceipt = () => {
        if (!selectedDelivery || confirming) return;
        setConfirming(selectedDelivery.id);

        const endpoint = selectedDelivery.type === 'site_release'
            ? route('site-release.confirm', selectedDelivery.id)
            : route('receiving.auto', selectedDelivery.id);

        router.post(endpoint, {}, {
            onFinish: () => {
                setConfirming(null);
                setSelectedDelivery(null);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Site Engineer Dashboard" />
            <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
                    <div className="relative z-10">
                        <p className="text-amber-100 text-xs font-semibold uppercase tracking-widest mb-1">Field Operations</p>
                        <h2 className="text-2xl font-bold mb-1">Site Overview 🏗️</h2>
                        <p className="text-amber-100 text-sm">You have <span className="font-bold text-white">{stats?.pendingMRs || 0} material requests</span> pending and <span className="font-bold text-white">{stats?.pendingSiteReleases || 0} releases</span> to confirm.</p>
                    </div>
                </div>

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

                {/* Pending Deliveries */}
                <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border-white/20 dark:border-white/5 shadow-sm p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-teal-500/10 rounded-xl">
                            <Truck size={18} className="text-teal-500" />
                        </div>
                        <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Pending Deliveries</h3>
                        {pendingReleases.length > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {pendingReleases.length}
                            </span>
                        )}
                    </div>

                    {pendingReleases.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <Package size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">No pending deliveries</p>
                            <p className="text-xs opacity-40 mt-1">Materials released to your site will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingReleases.map((release) => (
                                <div key={`${release.type}-${release.id}`} className="flex items-center justify-between p-4 bg-white/60 dark:bg-zinc-800/60 border border-teal-200/30 dark:border-teal-500/10 rounded-2xl gap-4">
                                    <div>
                                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                            {release.type === 'purchase_order' ? <Package size={14} className="text-blue-500" /> : <Truck size={14} className="text-teal-500" />}
                                            {release.title}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{release.project_name} &bull; {release.created_at}</div>
                                    </div>
                                    <button
                                        onClick={() => handleAction(release)}
                                        disabled={confirming === release.id}
                                        className={`shrink-0 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 shadow-md ${release.type === 'purchase_order' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/20'}`}
                                    >
                                        <CheckCircle size={14} />
                                        {confirming === release.id ? 'Loading...' : (release.type === 'purchase_order' ? 'Receive Delivery' : 'Confirm Receipt')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

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

            <Modal
                isOpen={!!selectedDelivery}
                onClose={() => !confirming && setSelectedDelivery(null)}
                title={selectedDelivery?.type === 'purchase_order' ? "Confirm PO Delivery" : "Confirm Warehouse Release"}
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    {selectedDelivery?.type === 'purchase_order' ? (
                        <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm border border-blue-200 dark:border-blue-500/20">
                            <p className="font-semibold mb-1">Confirming receipt for {selectedDelivery?.title}.</p>
                            <p className="opacity-80">This action will automatically log the <strong>exact requested quantities</strong> into your project site's inventory. Ensure the physical delivery matches the order completely.</p>
                        </div>
                    ) : (
                        <div className="bg-teal-50 dark:bg-teal-500/10 text-teal-800 dark:text-teal-300 p-4 rounded-xl text-sm border border-teal-200 dark:border-teal-500/20">
                            <p className="font-semibold mb-1">Confirming {selectedDelivery?.title}.</p>
                            <p className="opacity-80">This acknowledges that these materials dispatched from the warehouse have physically arrived at your site.</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setSelectedDelivery(null)}
                            disabled={confirming === selectedDelivery?.id}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitReceipt}
                            disabled={confirming === selectedDelivery?.id}
                            className={`${selectedDelivery?.type === 'purchase_order' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/20'} text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-md`}
                        >
                            {confirming === selectedDelivery?.id ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <CheckCircle size={16} />
                                    {selectedDelivery?.type === 'purchase_order' ? 'Confirm Exact Quantity' : 'Confirm Receipt'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
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

