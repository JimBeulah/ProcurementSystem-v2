import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { Package, Truck, Home, Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '@/Components/UI/Modal';

export default function MasterDataIndex() {
    const [activeTab, setActiveTab] = useState('suppliers');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    // Data would come from controller in a real implementation; using placeholder for now
    const data = usePage().props[activeTab] || [];

    const handleEdit = (item) => { setEditingItem(item); setFormData({ ...item }); setShowModal(true); };
    const handleDelete = (id) => { if (confirm(`Delete this ${activeTab.slice(0, -1)}?`)) { /* router.delete */ } };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-colors ${activeTab === id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            <Icon size={18} /> {label}
        </button>
    );

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500";

    return (
        <AuthenticatedLayout>
            <Head title="Master Data" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><Package className="text-rose-500" /> Master Data</h1>
                        <p className="text-slate-500">Manage standard data lists and codes.</p>
                    </div>
                    <button onClick={() => { setEditingItem(null); setFormData({}); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold">
                        <Plus size={18} /> Add {activeTab.slice(0, -1)}
                    </button>
                </header>

                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <TabButton id="suppliers" label="Suppliers" icon={Truck} />
                    <TabButton id="materials" label="Materials" icon={Package} />
                    <TabButton id="warehouses" label="Warehouses" icon={Home} />
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden min-h-[400px] shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                {activeTab === 'suppliers' && <><th className="p-4">Name</th><th className="p-4">Contact</th><th className="p-4">Email</th></>}
                                {activeTab === 'materials' && <><th className="p-4">Code</th><th className="p-4">Name</th><th className="p-4">Unit</th><th className="p-4">Category</th></>}
                                {activeTab === 'warehouses' && <><th className="p-4">Name</th><th className="p-4">Location</th><th className="p-4">Type</th></>}
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {data.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    {activeTab === 'suppliers' && <><td className="p-4 font-bold text-slate-900 dark:text-white">{item.name}</td><td className="p-4 text-slate-500">{item.contact_person}</td><td className="p-4 text-slate-500">{item.email}</td></>}
                                    {activeTab === 'materials' && <><td className="p-4 font-mono text-blue-600 dark:text-cyan-400">{item.code}</td><td className="p-4 font-bold text-slate-900 dark:text-white">{item.name}</td><td className="p-4 text-slate-500">{item.unit}</td><td className="p-4"><span className="text-xs font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 rounded px-2 py-0.5">{item.category}</span></td></>}
                                    {activeTab === 'warehouses' && <><td className="p-4 font-bold text-slate-900 dark:text-white">{item.name}</td><td className="p-4 text-slate-500">{item.location}</td><td className="p-4 text-xs text-slate-500">{item.type}</td></>}
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 rounded"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 uppercase tracking-widest text-xs font-bold">No records found.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); }} title={editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}>
                    <form onSubmit={e => { e.preventDefault(); setShowModal(false); }} className="space-y-4">
                        {activeTab === 'suppliers' && <>
                            <input placeholder="Company Name" className={inputCls} value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <input placeholder="Contact Person" className={inputCls} value={formData.contact_person || ''} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
                            <input placeholder="Email" className={inputCls} value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <input placeholder="Phone" className={inputCls} value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            <textarea placeholder="Address" className={`${inputCls} h-20`} value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </>}
                        {activeTab === 'materials' && <>
                            <input placeholder="Material Code" className={`${inputCls} font-mono`} value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} required />
                            <input placeholder="Material Name" className={inputCls} value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <textarea placeholder="Description" className={`${inputCls} h-20`} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </>}
                        {activeTab === 'warehouses' && <>
                            <input placeholder="Warehouse Name" className={inputCls} value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <input placeholder="Location" className={inputCls} value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            <select className={inputCls} value={formData.type || 'CENTRAL'} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="CENTRAL">Central</option>
                                <option value="SITE">Site</option>
                            </select>
                        </>}
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Cancel</button>
                            <button type="submit" className="bg-blue-600 px-6 py-2 rounded-lg text-white text-xs font-bold uppercase hover:bg-blue-500">
                                {editingItem ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
