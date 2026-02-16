import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';
import {
    Briefcase, Plus, MapPin, DollarSign, Building, Edit2, Trash2,
    Search, LayoutGrid, List as ListIcon, Building2, Layers
} from 'lucide-react';
import Select from '@/Components/UI/Select';

export default function ProjectsIndex() {
    const { projects: initialProjects, clients } = usePage().props;
    const projects = initialProjects || [];

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [submitting, setSubmitting] = useState(false);

    const initialFormData = {
        name: '', client_id: '', location: '', budget: '', duration: '',
        total_floor_area: '', carport_area: '', status: 'ACTIVE',
        project_type: 'BUILDING', appropriation: '', source_of_fund: '',
        contract_id: '', project_component_id: '', net_length: ''
    };
    const [formData, setFormData] = useState(initialFormData);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        const payload = {
            ...formData,
            client_id: Number(formData.client_id),
            budget: Number(formData.budget),
            total_floor_area: Number(formData.total_floor_area) || 0,
            carport_area: Number(formData.carport_area) || 0,
            appropriation: Number(formData.appropriation) || 0,
            net_length: Number(formData.net_length) || 0,
        };

        if (editingProject) {
            router.put(`/projects/${editingProject.id}`, payload, {
                onSuccess: () => { setShowModal(false); setEditingProject(null); setFormData(initialFormData); },
                onFinish: () => setSubmitting(false),
            });
        } else {
            router.post('/projects', payload, {
                onSuccess: () => { setShowModal(false); setFormData(initialFormData); },
                onFinish: () => setSubmitting(false),
            });
        }
    };

    const handleEdit = (project, e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingProject(project);
        setFormData({
            name: project.name || '', client_id: project.client_id?.toString() || '',
            location: project.location || '', budget: project.budget?.toString() || '',
            duration: project.duration || '', total_floor_area: project.total_floor_area?.toString() || '',
            carport_area: project.carport_area?.toString() || '', status: project.status || 'ACTIVE',
            project_type: project.project_type || 'BUILDING', appropriation: project.appropriation?.toString() || '',
            source_of_fund: project.source_of_fund || '', contract_id: project.contract_id || '',
            project_component_id: project.project_component_id || '', net_length: project.net_length?.toString() || '',
        });
        setShowModal(true);
    };

    const handleDeleteClick = (project, e) => {
        e.preventDefault();
        e.stopPropagation();
        setProjectToDelete(project);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!projectToDelete) return;
        router.delete(`/projects/${projectToDelete.id}`, {
            onSuccess: () => { setShowDeleteModal(false); setProjectToDelete(null); },
        });
    };

    // Metrics
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = totalProjects - activeProjects;
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget), 0);
    const totalAppropriation = projects.reduce((sum, p) => sum + (Number(p.appropriation) || 0), 0);
    const totalFloorArea = projects.filter(p => p.project_type === 'BUILDING').reduce((sum, p) => sum + (Number(p.total_floor_area) || 0), 0);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contract_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Projects" />
            <div className="p-4 space-y-4 max-w-7xl mx-auto">

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 group hover:border-cyan-500/30 transition-all shadow-sm">
                        <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-600 group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">Total Projects</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalProjects}</p>
                            <div className="flex gap-2 text-[9px] font-bold mt-1">
                                <span className="text-emerald-600">{activeProjects} Active</span>
                                <span className="text-slate-400">|</span>
                                <span className="text-slate-500">{completedProjects} Completed</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 group hover:border-emerald-500/30 transition-all shadow-sm">
                        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform"><DollarSign size={24} /></div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">Total Budget</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">₱ {(totalBudget / 1000000).toFixed(2)}M</p>
                            <p className="text-[9px] text-slate-500 mt-1">Appropriations: ₱ {(totalAppropriation / 1000000).toFixed(2)}M</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 group hover:border-blue-500/30 transition-all shadow-sm">
                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform"><Building size={24} /></div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">Total Floor Area</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalFloorArea.toLocaleString()} <span className="text-xs text-slate-500">sqm</span></p>
                            <p className="text-[9px] text-slate-500 mt-1">Building Projects Only</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-center gap-2 group hover:border-orange-500/30 transition-all shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Project Health</span>
                            <span className="text-xs font-bold text-emerald-600">98% On Track</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[98%]" />
                        </div>
                        <p className="text-[9px] text-slate-500">Based on timeline and budget utilization</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                    <div className="relative group max-w-xs w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={14} />
                        <input
                            type="text" placeholder="Search projects..."
                            className="w-full md:w-64 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-slate-900 dark:text-white text-xs focus:border-cyan-500/50 outline-none transition-all"
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow-sm text-cyan-600' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`} title="Table View"><ListIcon size={14} /></button>
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow-sm text-cyan-600' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`} title="Grid View"><LayoutGrid size={14} /></button>
                        </div>
                        <button onClick={() => { setEditingProject(null); setFormData(initialFormData); setShowModal(true); }}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
                            <Plus size={16} /> <span>New Project</span>
                        </button>
                    </div>
                </div>

                {/* Table View */}
                {viewMode === 'table' ? (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-3 text-center w-12">#</th>
                                        <th className="p-3 min-w-[200px]">Project Name / Client</th>
                                        <th className="p-3">Location / Contract</th>
                                        <th className="p-3 text-center">Type</th>
                                        <th className="p-3 text-right">Budget</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                                    {filteredProjects.map((project, idx) => (
                                        <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group transition-colors">
                                            <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <Link href={`/projects/${project.id}`} className="font-bold text-slate-900 dark:text-white hover:text-cyan-600 transition-colors uppercase truncate max-w-[300px]">{project.name}</Link>
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Briefcase size={10} className="inline opacity-50" /> {project.client?.name || 'Internal'}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><MapPin size={10} className="opacity-50" /> {project.location || 'N/A'}</span>
                                                    <span className="text-[9px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded w-fit">{project.contract_id || 'No Contract ID'}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${project.project_type === 'BUILDING' ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' : project.project_type === 'INFRASTRUCTURE' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                                                    {project.project_type}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-mono text-slate-900 dark:text-white">₱ {Number(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-center">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{project.status}</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={(e) => handleEdit(project, e)} className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded transition-colors" title="Edit"><Edit2 size={14} /></button>
                                                    <button onClick={(e) => handleDeleteClick(project, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProjects.length === 0 && (
                                        <tr><td colSpan={7} className="p-12 text-center text-slate-400 opacity-50 uppercase text-xs tracking-widest font-bold">No projects found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Grid View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjects.map(project => (
                            <div key={project.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 group relative hover:border-cyan-500/30 transition-all shadow-sm">
                                <Link href={`/projects/${project.id}`} className="absolute inset-0 z-10" />
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${project.project_type === 'BUILDING' ? 'bg-cyan-500/10 text-cyan-600' : 'bg-orange-500/10 text-orange-600'}`}><Briefcase size={20} /></div>
                                    <div className="flex items-center gap-1 relative z-20">
                                        <button onClick={(e) => handleEdit(project, e)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-cyan-600 rounded"><Edit2 size={12} /></button>
                                        <button onClick={(e) => handleDeleteClick(project, e)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-cyan-600 transition-colors uppercase tracking-tight truncate">{project.name}</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-4">{project.client?.name || 'Internal'}</p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50"><span className="text-slate-500">Budget</span><span className="font-mono font-bold text-emerald-600">₱ {Number(project.budget).toLocaleString()}</span></div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50"><span className="text-slate-500">Status</span><span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'text-slate-500 bg-slate-100 dark:bg-slate-700'}`}>{project.status}</span></div>
                                    <div className="flex justify-between items-center py-1"><span className="text-slate-500">Contract ID</span><span className="font-mono text-slate-900 dark:text-white">{project.contract_id || '-'}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Modal */}
                <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProject(null); }} title={editingProject ? "Edit Project" : "Create New Project"}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Project Name</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter project title" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Client</label>
                                <Select
                                    value={formData.client_id}
                                    onChange={val => setFormData({ ...formData, client_id: val })}
                                    options={(clients || []).map(c => ({ value: c.id.toString(), label: c.name }))}
                                    placeholder="Select Client"
                                    icon={Building2}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Project Type</label>
                                <Select
                                    value={formData.project_type}
                                    onChange={val => setFormData({ ...formData, project_type: val })}
                                    options={[
                                        { value: "BUILDING", label: "BUILDING" },
                                        { value: "INFRASTRUCTURE", label: "INFRASTRUCTURE" },
                                        { value: "MAINTENANCE", label: "MAINTENANCE" },
                                    ]}
                                    icon={Layers}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Budget (PhP)</label>
                                <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all font-mono" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Appropriation (PhP)</label>
                                <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all font-mono" value={formData.appropriation} onChange={e => setFormData({ ...formData, appropriation: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Location</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Project Site Location" />
                            </div>
                            <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Contract ID</label>
                                    <input className="w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none" value={formData.contract_id} onChange={e => setFormData({ ...formData, contract_id: e.target.value })} placeholder="e.g. 24L00123" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Duration</label>
                                    <input className="w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 180 C.D." />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Source of Fund</label>
                                    <input className="w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none" value={formData.source_of_fund} onChange={e => setFormData({ ...formData, source_of_fund: e.target.value })} placeholder="e.g. GAA 2024" />
                                </div>
                            </div>
                            {formData.project_type === 'BUILDING' ? (
                                <div className="md:col-span-2 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-2">
                                    <div>
                                        <label className="text-[10px] text-cyan-600 uppercase font-black mb-1 block tracking-widest">Total Floor Area (sqm)</label>
                                        <input type="number" step="0.01" className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500" value={formData.total_floor_area} onChange={e => setFormData({ ...formData, total_floor_area: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-orange-600 uppercase font-black mb-1 block tracking-widest">Carport Area (sqm)</label>
                                        <input type="number" step="0.01" className="w-full bg-orange-500/5 border border-orange-500/20 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500" value={formData.carport_area} onChange={e => setFormData({ ...formData, carport_area: e.target.value })} />
                                    </div>
                                </div>
                            ) : (
                                <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                                    <label className="text-[10px] text-emerald-600 uppercase font-black mb-1 block tracking-widest">Net Length (Linear Meters)</label>
                                    <input type="number" step="0.01" className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500" value={formData.net_length} onChange={e => setFormData({ ...formData, net_length: e.target.value })} placeholder="e.g. 952.14" />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <button type="button" onClick={() => { setShowModal(false); setEditingProject(null); }} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest">Cancel</button>
                            <button type="submit" disabled={submitting} className="bg-cyan-600 px-6 py-2.5 rounded-lg text-white font-black text-xs uppercase tracking-widest hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 transition-all active:scale-95 disabled:opacity-50">
                                {editingProject ? 'Apply Changes' : 'Establish Project'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Modal */}
                <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setProjectToDelete(null); }} title="Confirm Deletion">
                    <div className="space-y-6">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-500 font-bold block mb-2">DELETE PROJECT: <span className="uppercase text-slate-900 dark:text-white">{projectToDelete?.name}</span></p>
                            <p className="text-xs text-red-400/80 uppercase font-black tracking-wide">Warning: This action is irreversible. All associated BOQ items, cost data, and documents will be permanently removed.</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setShowDeleteModal(false); setProjectToDelete(null); }} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest">Cancel</button>
                            <button onClick={confirmDelete} className="bg-red-600 px-6 py-2 rounded-lg text-white font-black text-xs uppercase tracking-widest hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all">Confirm Delete</button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
