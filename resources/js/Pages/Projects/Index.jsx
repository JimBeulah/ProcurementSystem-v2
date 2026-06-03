import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import Modal from '@/Components/UI/Modal';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import ProjectMetrics from '@/Components/Projects/ProjectMetrics';
import ProjectTable from '@/Components/Projects/ProjectTable';
import ProjectGrid from '@/Components/Projects/ProjectGrid';
import ProjectForm from '@/Components/Projects/ProjectForm';

export default function ProjectsIndex() {
    const { projects: initialProjects, clients, siteEngineers, projectTypes, auth } = usePage().props;
    const projects = initialProjects || [];
    const { can } = usePermissions();

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const searchQuery = '';
    const viewMode = 'table';

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
                        projectTypes={projectTypes}
                        onEdit={can('edit projects') ? handleEdit : null}
                        onDelete={can('delete projects') ? handleDeleteClick : null}
                        onCreate={can('create projects') ? () => {
                            setEditingProject(null);
                            reset();
                            clearErrors();
                            setShowModal(true);
                        } : null}
                    />
                    : <ProjectGrid auth={auth} projects={filteredProjects} projectTypes={projectTypes} onEdit={can('edit projects') ? handleEdit : null} onDelete={can('delete projects') ? handleDeleteClick : null} />
                }

                {/* Create/Edit Modal */}
                <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProject(null); }} title={editingProject ? "Edit Project" : "Create New Project"}>
                    <ProjectForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        handleSubmit={handleSubmit}
                        clients={clients}
                        siteEngineers={siteEngineers}
                        projectTypes={projectTypes}
                        onCancel={() => { setShowModal(false); setEditingProject(null); }}
                        isEditing={!!editingProject}
                    />
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
