import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import Modal from '@/Components/UI/Modal';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
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

    const initialFormData = {
        name: '', 
        client_id: '', 
        location: '', 
        budget: '', 
        target_start_date: '', 
        target_end_date: '', 
        duration_days: '',
        total_floor_area: '', 
        carport_area: '', 
        status: 'PLANNING',
        project_type: 'BUILDING', 
        appropriation: '', 
        source_of_fund: '',
        contract_id: '', 
        project_component_id: '', 
        net_length: '', 
        site_engineer_id: '',
        contract_type: 'Lump Sum', 
        payment_terms: '30 Days'
    };

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm(initialFormData);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const options = {
            onSuccess: () => { 
                setShowModal(false); 
                setEditingProject(null); 
                reset(); 
            },
        };

        if (editingProject) {
            put(`/projects/${editingProject.id}`, options);
        } else {
            post('/projects', options);
        }
    };

    const handleEdit = (project, e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingProject(project);
        clearErrors();
        
        setData({
            name: project.name || '',
            client_id: project.client_id?.toString() || '',
            location: project.location || '',
            budget: project.budget?.toString() || '',
            target_start_date: project.target_start_date || '',
            target_end_date: project.target_end_date || '',
            duration_days: project.duration_days?.toString() || '',
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
            contract_type: project.contract_type || 'Lump Sum',
            payment_terms: project.payment_terms || '30 Days',
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
        destroy(`/projects/${projectToDelete.id}`, {
            onSuccess: () => { 
                setShowDeleteModal(false); 
                setProjectToDelete(null); 
            },
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
            <div className="space-y-4 max-w-7xl mx-auto">

                <ProjectMetrics projects={projects} auth={auth} />

                {viewMode === 'table'
                    ? <ProjectTable
                        auth={auth}
                        projects={projects}
                        onEdit={can('edit projects') ? handleEdit : null}
                        onDelete={can('delete projects') ? handleDeleteClick : null}
                        onCreate={can('create projects') ? () => { 
                            setEditingProject(null); 
                            reset(); 
                            clearErrors();
                            setShowModal(true); 
                        } : null}
                    />
                    : <ProjectGrid auth={auth} projects={filteredProjects} onEdit={can('edit projects') ? handleEdit : null} onDelete={can('delete projects') ? handleDeleteClick : null} />
                }

                {/* Create/Edit Modal */}
                <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProject(null); }} title={editingProject ? "Edit Project" : "Create New Project"}>
                    <form onSubmit={handleSubmit} className="space-y-4 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Project Name</label>
                                <input 
                                    className={`w-full bg-slate-50 dark:bg-slate-900/50 border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all`}
                                    value={data.name} 
                                    onChange={e => setData('name', e.target.value)} 
                                    required 
                                    placeholder="Enter project title" 
                                />
                                {errors.name && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.name}</div>}
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Client</label>
                                <Select value={data.client_id} onChange={val => setData('client_id', val)} options={(clients || []).map(c => ({ value: c.id.toString(), label: c.name }))} placeholder="Select Client" icon={Building2} />
                                {errors.client_id && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.client_id}</div>}
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Site Engineer (Optional)</label>
                                <Select value={data.site_engineer_id} onChange={val => setData('site_engineer_id', val)} options={(siteEngineers || []).map(u => ({ value: u.id.toString(), label: u.name }))} placeholder="Unassigned" icon={UserCog} />
                                {errors.site_engineer_id && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.site_engineer_id}</div>}
                            </div>
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Project Type</label>
                                    <Select value={data.project_type} onChange={val => setData('project_type', val)} options={[{ value: "BUILDING", label: "BUILDING" }, { value: "INFRASTRUCTURE", label: "INFRASTRUCTURE" }, { value: "MAINTENANCE", label: "MAINTENANCE" }]} icon={Layers} />
                                    {errors.project_type && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.project_type}</div>}
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Status</label>
                                    <Select value={data.status} onChange={val => setData('status', val)} options={[{ value: "ACTIVE", label: "ACTIVE" }, { value: "ON_HOLD", label: "ON HOLD" }, { value: "WARRANTY_PERIOD", label: "WARRANTY PERIOD" }, { value: "COMPLETED", label: "COMPLETED" }]} />
                                    {errors.status && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.status}</div>}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Budget (PhP)</label>
                                <input type="number" step="0.01" className={`w-full bg-slate-50 dark:bg-slate-900/50 border ${errors.budget ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all font-mono`} value={data.budget} onChange={e => setData('budget', e.target.value)} required />
                                {errors.budget && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.budget}</div>}
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Appropriation (PhP)</label>
                                <input type="number" step="0.01" className={`w-full bg-slate-50 dark:bg-slate-900/50 border ${errors.appropriation ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all font-mono`} value={data.appropriation} onChange={e => setData('appropriation', e.target.value)} />
                                {errors.appropriation && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.appropriation}</div>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Location</label>
                                <input className={`w-full bg-slate-50 dark:bg-slate-900/50 border ${errors.location ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all`} value={data.location} onChange={e => setData('location', e.target.value)} placeholder="Project Site Location" />
                                {errors.location && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.location}</div>}
                            </div>
                            <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Contract ID</label>
                                    <input className={`w-full bg-white dark:bg-slate-900/40 border ${errors.contract_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none`} value={data.contract_id} onChange={e => setData('contract_id', e.target.value)} placeholder="e.g. 24L00123" />
                                    {errors.contract_id && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.contract_id}</div>}
                                </div>
                                <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-3 mt-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Start Date</label>
                                        <input type="date" className={`w-full bg-white dark:bg-slate-900/40 border ${errors.target_start_date ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none uppercase font-mono`} value={data.target_start_date} onChange={e => {
                                            const newStartDate = e.target.value;
                                            setData(prev => {
                                                const updates = { target_start_date: newStartDate };
                                                if (newStartDate && prev.duration_days) {
                                                    const endDate = new Date(newStartDate);
                                                    endDate.setDate(endDate.getDate() + Number(prev.duration_days));
                                                    updates.target_end_date = endDate.toISOString().split('T')[0];
                                                }
                                                return { ...prev, ...updates };
                                            });
                                        }} />
                                        {errors.target_start_date && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.target_start_date}</div>}
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Duration (Days)</label>
                                        <input type="number" min="0" className={`w-full bg-white dark:bg-slate-900/40 border ${errors.duration_days ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none uppercase font-mono`} value={data.duration_days} onChange={e => {
                                            const newDuration = e.target.value;
                                            setData(prev => {
                                                const updates = { duration_days: newDuration };
                                                if (prev.target_start_date && newDuration) {
                                                    const endDate = new Date(prev.target_start_date);
                                                    endDate.setDate(endDate.getDate() + Number(newDuration));
                                                    updates.target_end_date = endDate.toISOString().split('T')[0];
                                                }
                                                return { ...prev, ...updates };
                                            });
                                        }} placeholder="e.g. 180" />
                                        {errors.duration_days && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.duration_days}</div>}
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">End Date</label>
                                        <input type="date" className={`w-full bg-white dark:bg-slate-900/40 border ${errors.target_end_date ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none uppercase font-mono`} value={data.target_end_date} onChange={e => setData('target_end_date', e.target.value)} />
                                        {errors.target_end_date && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.target_end_date}</div>}
                                    </div>
                                </div>
                                <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Source of Fund</label>
                                        <input className={`w-full bg-white dark:bg-slate-900/40 border ${errors.source_of_fund ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none`} value={data.source_of_fund} onChange={e => setData('source_of_fund', e.target.value)} placeholder="e.g. GAA 2024" />
                                        {errors.source_of_fund && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.source_of_fund}</div>}
                                    </div>
                                </div>
                                <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Contract Type</label>
                                        <Select
                                            value={data.contract_type}
                                            onChange={val => setData('contract_type', val)}
                                            options={[
                                                { value: "Lump Sum", label: "Lump Sum" },
                                                { value: "Cost Plus", label: "Cost Plus" },
                                                { value: "Unit Price", label: "Unit Price" },
                                            ]}
                                        />
                                        {errors.contract_type && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.contract_type}</div>}
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-widest">Payment Terms</label>
                                        <input className={`w-full bg-white dark:bg-slate-900/40 border ${errors.payment_terms ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded p-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 outline-none`} value={data.payment_terms} onChange={e => setData('payment_terms', e.target.value)} placeholder="e.g. 30 Days" />
                                        {errors.payment_terms && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.payment_terms}</div>}
                                    </div>
                                </div>
                            </div>
                            {data.project_type === 'BUILDING' ? (
                                <div className="md:col-span-2 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-2">
                                    <div>
                                        <label className="text-[10px] text-cyan-600 uppercase font-black mb-1 block tracking-widest">Total Floor Area (sqm)</label>
                                        <input type="number" step="0.01" className={`w-full bg-cyan-500/5 border ${errors.total_floor_area ? 'border-red-500' : 'border-cyan-500/20'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500`} value={data.total_floor_area} onChange={e => setData('total_floor_area', e.target.value)} />
                                        {errors.total_floor_area && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.total_floor_area}</div>}
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-orange-600 uppercase font-black mb-1 block tracking-widest">Carport Area (sqm)</label>
                                        <input type="number" step="0.01" className={`w-full bg-orange-500/5 border ${errors.carport_area ? 'border-red-500' : 'border-orange-500/20'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500`} value={data.carport_area} onChange={e => setData('carport_area', e.target.value)} />
                                        {errors.carport_area && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.carport_area}</div>}
                                    </div>
                                </div>
                            ) : (
                                <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                                    <label className="text-[10px] text-emerald-600 uppercase font-black mb-1 block tracking-widest">Net Length (Linear Meters)</label>
                                    <input type="number" step="0.01" className={`w-full bg-emerald-500/5 border ${errors.net_length ? 'border-red-500' : 'border-emerald-500/20'} rounded-lg p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500`} value={data.net_length} onChange={e => setData('net_length', e.target.value)} placeholder="e.g. 952.14" />
                                    {errors.net_length && <div className="text-red-500 text-[10px] mt-1 uppercase font-bold">{errors.net_length}</div>}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <button type="button" onClick={() => { setShowModal(false); setEditingProject(null); }} className="min-h-[44px] px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest rounded-lg active:scale-95">Cancel</button>
                            <button type="submit" disabled={processing} className="min-h-[44px] bg-cyan-600 px-6 py-2.5 rounded-lg text-white font-black text-xs uppercase tracking-widest hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 transition-all active:scale-95 disabled:opacity-50">
                                {editingProject ? 'Apply Changes' : 'Establish Project'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => { setShowDeleteModal(false); setProjectToDelete(null); }}
                    onConfirm={confirmDelete}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete the project "${projectToDelete?.name}"? All associated BOQ items, cost data, and documents will be permanently removed.`}
                    confirmText="Delete Project"
                    type="danger"
                />
            </div>
        </AuthenticatedLayout>
    );
}
