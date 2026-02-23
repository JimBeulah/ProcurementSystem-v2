import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import Modal from '@/Components/UI/Modal';
import Select from '@/Components/UI/Select';
import ProjectMetrics from '@/Components/Projects/ProjectMetrics';
import ProjectTable from '@/Components/Projects/ProjectTable';
import ProjectGrid from '@/Components/Projects/ProjectGrid';
import { Plus, Search, LayoutGrid, List as ListIcon, Building2, Layers, UserCog } from 'lucide-react';

export default function ProjectsIndex() {
    const { projects: initialProjects, clients, siteEngineers, auth } = usePage().props;
    const projects = initialProjects || [];
    const { can } = usePermissions();

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
        contract_id: '', project_component_id: '', net_length: '', site_engineer_id: ''
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
            site_engineer_id: formData.site_engineer_id ? Number(formData.site_engineer_id) : null,
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
            name: project.name || '',
            client_id: project.client_id?.toString() || '',
            location: project.location || '',
            budget: project.budget?.toString() || '',
            duration: project.duration || '',
            total_floor_area: project.total_floor_area?.toString() || '',
            carport_area: project.carport_area?.toString() || '',
            status: project.status || 'ACTIVE',
            project_type: project.project_type || 'BUILDING',
            appropriation: project.appropriation?.toString() || '',
            source_of_fund: project.source_of_fund || '',
            contract_id: project.contract_id || '',
            project_component_id: project.project_component_id || '',
            net_length: project.net_length?.toString() || '',
            site_engineer_id: project.site_engineer_id?.toString() || '',
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

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contract_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Projects" />
            <div className="p-4 space-y-4 max-w-7xl mx-auto">

                <ProjectMetrics projects={projects} auth={auth} />

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
                        {can('create projects') && (
                            <button onClick={() => { setEditingProject(null); setFormData(initialFormData); setShowModal(true); }}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
                                <Plus size={16} /> <span>New Project</span>
                            </button>
                        )}
                    </div>
                </div>

                {viewMode === 'table'
                    ? <ProjectTable auth={auth} projects={filteredProjects} onEdit={can('edit projects') ? handleEdit : null} onDelete={can('delete projects') ? handleDeleteClick : null} />
                    : <ProjectGrid auth={auth} projects={filteredProjects} onEdit={can('edit projects') ? handleEdit : null} onDelete={can('delete projects') ? handleDeleteClick : null} />
                }

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
                                <Select value={formData.client_id} onChange={val => setFormData({ ...formData, client_id: val })} options={(clients || []).map(c => ({ value: c.id.toString(), label: c.name }))} placeholder="Select Client" icon={Building2} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Site Engineer (Optional)</label>
                                <Select value={formData.site_engineer_id} onChange={val => setFormData({ ...formData, site_engineer_id: val })} options={(siteEngineers || []).map(u => ({ value: u.id.toString(), label: u.name }))} placeholder="Unassigned" icon={UserCog} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Project Type</label>
                                <Select value={formData.project_type} onChange={val => setFormData({ ...formData, project_type: val })} options={[{ value: "BUILDING", label: "BUILDING" }, { value: "INFRASTRUCTURE", label: "INFRASTRUCTURE" }, { value: "MAINTENANCE", label: "MAINTENANCE" }]} icon={Layers} />
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
