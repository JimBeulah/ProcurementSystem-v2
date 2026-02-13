import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { Package, Search, MapPin, Calendar, Filter } from 'lucide-react';

export default function InventoryIndex() {
    const { inventory } = usePage().props;
    const items = inventory || [];
    const [search, setSearch] = useState('');

    const filtered = items.filter(i =>
        i.material_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Inventory" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory</h1>
                        <p className="text-slate-500 mt-1">Track materials across all projects and warehouses</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search materials..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <Filter size={18} /> Filter
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest pl-6">Material Name</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Project / Location</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Quantity</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Unit</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right pr-6">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <Package className="mx-auto mb-3 opacity-30" size={36} />
                                        No inventory items found.
                                    </td>
                                </tr>
                            ) : filtered.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 pl-6 font-medium text-slate-900 dark:text-white">{item.material_name}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <MapPin size={14} /> {item.project?.name || 'Central Warehouse'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-blue-600 dark:text-cyan-400 font-medium">
                                        {Number(item.quantity).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">{item.unit}</td>
                                    <td className="p-4 text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 text-slate-500 text-sm">
                                            <Calendar size={14} />
                                            {new Date(item.updated_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
