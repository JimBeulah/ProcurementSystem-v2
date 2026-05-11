import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm } from '@inertiajs/react';
import { Package, MapPin, Calendar, Box, Building2, ClipboardList, Plus } from 'lucide-react';
import DataTable from '@/Components/UI/DataTable';
import Drawer from '@/Components/UI/Drawer';
import Modal from '@/Components/UI/Modal';

export default function InventoryIndex() {
    const { inventory, auth } = usePage().props;
    const items = React.useMemo(() => inventory || [], [inventory]);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'warehouse', 'projects'
    const [selectedItem, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        material_name: '',
        quantity: '',
        unit: '',
    });

    const handleAddMaterial = (e) => {
        e.preventDefault();
        post(route('inventory.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const tabs = React.useMemo(() => [
        { id: 'all', label: 'All Inventory', icon: ClipboardList },
        { id: 'warehouse', label: 'Central Warehouse', icon: Box },
        { id: 'projects', label: 'Project Sites', icon: Building2 },
    ], []);

    // Filter by tab
    const tabFiltered = useMemo(() => {
        if (activeTab === 'warehouse') return items.filter(i => !i.project_id && !i.project);
        if (activeTab === 'projects') return items.filter(i => i.project_id || i.project);
        return items;
    }, [items, activeTab]);

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
                    consolidated[name] = { ...item, quantity: Number(item.quantity) };
                } else {
                    consolidated[name].quantity += Number(item.quantity);
                    if (new Date(item.last_updated) > new Date(consolidated[name].last_updated)) {
                        consolidated[name].last_updated = item.last_updated;
                    }
                }
            });

            grouped[projectName] = Object.values(consolidated);
        });

        return grouped;
    }, [tabFiltered, activeTab]);

    const columns = React.useMemo(() => [
        {
            accessorKey: 'material_name',
            header: 'Material Name',
            cell: ({ row }) => (
                <div className="font-medium text-slate-900 dark:text-white">
                    {row.original.material_name}
                </div>
            )
        },
        {
            id: 'project',
            accessorFn: row => row.project?.name || 'Central Warehouse',
            header: 'Project / Location',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} className={row.original.project ? "text-emerald-500" : "text-blue-500"} />
                    {row.original.project?.name || 'Central Warehouse'}
                </div>
            ),
            // Only show project column if not in warehouse tab
            enableHiding: true,
        },
        {
            accessorKey: 'quantity',
            header: () => <div className="text-right">Quantity</div>,
            cell: ({ row }) => (
                <div className="text-right font-mono text-blue-600 dark:text-cyan-400 font-bold bg-blue-50/50 dark:bg-blue-900/10 px-2 py-1 rounded">
                    {Number(row.original.quantity).toLocaleString()}
                </div>
            )
        },
        {
            accessorKey: 'unit',
            header: 'Unit',
            cell: ({ row }) => (
                <div className="text-slate-500 text-sm font-medium">
                    {row.original.unit}
                </div>
            )
        },
        {
            accessorKey: 'last_updated',
            header: () => <div className="text-right">Last Updated</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2 text-slate-500 text-sm">
                    <Calendar size={14} className="opacity-70" />
                    {new Date(row.original.last_updated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
            )
        }
    ], []);

    const filteredColumns = React.useMemo(() => activeTab === 'warehouse' 
        ? columns.filter(col => col.id !== 'project')
        : columns, [activeTab, columns]);

    const handleRowClick = React.useCallback((row) => setSelectedReport(row), []);

    return (
        <AuthenticatedLayout>
            <Head title="Inventory Tracker" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Tracker</h1>
                    {(auth?.roles?.includes('admin') || auth?.permissions?.includes('manage inventory')) && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus size={16} />
                            Add Material
                        </button>
                    )}
                </div>

                {/* Tabs Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl overflow-x-auto w-full md:w-auto shadow-inner border border-slate-200 dark:border-slate-700">
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
                </div>

                {/* Main Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab !== 'projects' ? (
                        <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                            <DataTable
                                columns={filteredColumns}
                                data={tabFiltered}
                                onRowClick={handleRowClick}
                            />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.keys(groupedByProject).length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
                                    <Building2 className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={48} />
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Project Inventory</h3>
                                    <p className="text-slate-500">There are currently no items matching your criteria assigned to any project sites.</p>
                                </div>
                            ) : (
                                Object.entries(groupedByProject).map(([projectName, projectItems]) => (
                                    <div key={projectName} className="space-y-3 bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                    <Building2 size={16} />
                                                </div>
                                                {projectName}
                                            </h2>
                                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-inset ring-emerald-200/50 dark:ring-emerald-700/50 px-2.5 py-1 rounded-full">{projectItems.length} items</span>
                                        </div>
                                        <DataTable
                                            columns={columns.filter(col => col.id !== 'project')}
                                            data={projectItems}
                                            onRowClick={handleRowClick}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Drawer
                isOpen={!!selectedItem}
                onClose={() => setSelectedReport(null)}
                title="Material Details"
                width="w-full max-w-2xl"
            >
                {selectedItem && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-blue-500/10 rounded-xl">
                            <div className="p-3 bg-blue-500 text-white rounded-lg">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedItem.material_name}</h3>
                                <p className="text-slate-500">{selectedItem.unit}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Current Stock</span>
                                <span className="text-2xl font-mono font-bold text-blue-600 dark:text-cyan-400">
                                    {Number(selectedItem.quantity).toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Location</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    <MapPin size={14} className={selectedItem.project ? "text-emerald-500" : "text-blue-500"} />
                                    {selectedItem.project?.name || 'Central Warehouse'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-widest text-center">Last Inventory Activity</h4>
                            <div className="flex items-center justify-center gap-2 text-slate-900 dark:text-white font-medium">
                                <Calendar size={16} className="text-slate-400" />
                                {new Date(selectedItem.last_updated).toLocaleDateString(undefined, { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Material to Inventory">
                <form onSubmit={handleAddMaterial} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Material Name</label>
                        <input
                            type="text"
                            className={`w-full bg-white dark:bg-slate-900 border rounded-lg p-2.5 text-sm ${errors.material_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                            value={data.material_name}
                            onChange={e => setData('material_name', e.target.value)}
                            placeholder="Enter material name"
                            required
                        />
                        {errors.material_name && <p className="text-xs text-red-500 mt-1">{errors.material_name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Quantity</label>
                            <input
                                type="number"
                                step="any"
                                className={`w-full bg-white dark:bg-slate-900 border rounded-lg p-2.5 text-sm ${errors.quantity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                                value={data.quantity}
                                onChange={e => setData('quantity', e.target.value)}
                                placeholder="0.00"
                                required
                            />
                            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Unit</label>
                            <input
                                type="text"
                                className={`w-full bg-white dark:bg-slate-900 border rounded-lg p-2.5 text-sm ${errors.unit ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                                value={data.unit}
                                onChange={e => setData('unit', e.target.value)}
                                placeholder="pcs, bags, etc."
                                required
                            />
                            {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {processing ? 'Adding...' : 'Add Material'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
