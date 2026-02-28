import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { Package, Search, MapPin, Calendar, Filter, Box, Building2, ClipboardList } from 'lucide-react';

export default function InventoryIndex() {
    const { inventory } = usePage().props;
    const items = inventory || [];
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'warehouse', 'projects'

    // Filter by search
    const searchFiltered = items.filter(i =>
        i.material_name?.toLowerCase().includes(search.toLowerCase())
    );

    // Filter by tab
    const tabFiltered = useMemo(() => {
        if (activeTab === 'warehouse') return searchFiltered.filter(i => !i.project_id && !i.project);
        if (activeTab === 'projects') return searchFiltered.filter(i => i.project_id || i.project);
        return searchFiltered;
    }, [searchFiltered, activeTab]);

    // For projects tab, group by project name and then consolidate identical materials
    const groupedByProject = useMemo(() => {
        if (activeTab !== 'projects') return {};

        // First group all items by their project name
        const grouped = tabFiltered.reduce((acc, item) => {
            const projectName = item.project?.name || 'Unknown Project';
            if (!acc[projectName]) acc[projectName] = [];
            acc[projectName].push(item);
            return acc;
        }, {});

        // Then for each project, merge items with the exact same material_name
        Object.keys(grouped).forEach(projectName => {
            const projectItems = grouped[projectName];
            const consolidated = {};

            projectItems.forEach(item => {
                const name = item.material_name;
                if (!consolidated[name]) {
                    // Start with a clone of the item so we don't mutate the original data
                    consolidated[name] = { ...item, quantity: Number(item.quantity) };
                } else {
                    // Add to the existing quantity
                    consolidated[name].quantity += Number(item.quantity);
                    // Optionally update the date if the new one is more recent
                    if (new Date(item.updated_at) > new Date(consolidated[name].updated_at)) {
                        consolidated[name].updated_at = item.updated_at;
                    }
                }
            });

            // Convert back to array
            grouped[projectName] = Object.values(consolidated);
        });

        return grouped;
    }, [tabFiltered, activeTab]);

    const tabs = [
        { id: 'all', label: 'All Inventory', icon: ClipboardList },
        { id: 'warehouse', label: 'Central Warehouse', icon: Box },
        { id: 'projects', label: 'Project Sites', icon: Building2 },
    ];

    const renderTable = (data, showProjectColumn = true) => (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest pl-6">Material Name</th>
                        {showProjectColumn && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Project / Location</th>}
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Quantity</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Unit</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right pr-6">Last Updated</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={showProjectColumn ? 5 : 4} className="p-8 text-center text-slate-500">
                                <Package className="mx-auto mb-3 opacity-30" size={36} />
                                No items found matching your criteria.
                            </td>
                        </tr>
                    ) : data.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                            <td className="p-4 pl-6 font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                                {item.material_name}
                            </td>
                            {showProjectColumn && (
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPin size={14} className={item.project ? "text-emerald-500" : "text-blue-500"} />
                                        {item.project?.name || 'Central Warehouse'}
                                    </div>
                                </td>
                            )}
                            <td className="p-4 text-right font-mono text-blue-600 dark:text-cyan-400 font-bold bg-blue-50/50 dark:bg-blue-900/10">
                                {Number(item.quantity).toLocaleString()}
                            </td>
                            <td className="p-4 text-slate-500 text-sm bg-slate-50/50 dark:bg-slate-800/30 font-medium">{item.unit}</td>
                            <td className="p-4 text-right pr-6">
                                <div className="flex items-center justify-end gap-2 text-slate-500 text-sm">
                                    <Calendar size={14} className="opacity-70" />
                                    {new Date(item.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Inventory Tracker" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">



                {/* Filters and Tabs Row */}
                <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl overflow-x-auto w-full md:w-auto mt-2 md:mt-0 shadow-inner">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${isActive
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <Icon size={16} className={isActive ? 'opacity-100' : 'opacity-70'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search materials by name..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-0 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 transition-shadow shadow-sm"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border-0 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm focus:ring-2 focus:ring-inset focus:ring-blue-500">
                            <Filter size={18} /> <span className="hidden sm:inline font-medium">Filter</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'all' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">All Materials</h2>
                                <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{tabFiltered.length} items</span>
                            </div>
                            {renderTable(tabFiltered, true)}
                        </div>
                    )}

                    {activeTab === 'warehouse' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Box size={20} className="text-blue-500" /> Central Warehouse Inventory
                                </h2>
                                <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{tabFiltered.length} items</span>
                            </div>
                            {/* Omit project column for warehouse view */}
                            {renderTable(tabFiltered, false)}
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="space-y-8">
                            {Object.keys(groupedByProject).length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
                                    <Building2 className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={48} />
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Project Inventory</h3>
                                    <p className="text-slate-500">There are currently no items matching your criteria assigned to any project sites.</p>
                                </div>
                            ) : (
                                Object.entries(groupedByProject).map(([projectName, projectItems]) => (
                                    <div key={projectName} className="space-y-3 bg-slate-50/50 dark:bg-slate-800/20 p-4 -mx-4 md:mx-0 md:rounded-2xl border-y md:border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center justify-between px-2">
                                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                    <Building2 size={16} />
                                                </div>
                                                {projectName}
                                            </h2>
                                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-inset ring-emerald-200/50 dark:ring-emerald-700/50 px-2.5 py-1 rounded-full">{projectItems.length} items</span>
                                        </div>
                                        {/* Omit project column since it's grouped by project */}
                                        {renderTable(projectItems, false)}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
