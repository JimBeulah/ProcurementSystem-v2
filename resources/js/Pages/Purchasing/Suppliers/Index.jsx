import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { Briefcase, Plus, MoreVertical, Edit2, Slash, CheckCircle } from 'lucide-react';
import Modal from '@/Components/UI/Modal';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';
import { DataTable } from '@/Components/UI/DataTable';
import Dropdown from '@/Components/Dropdown';

export default function SuppliersIndex() {
    const { suppliers } = usePage().props;
    const { can } = usePermissions();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, supplier: null });

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
    });

    const columns = React.useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Supplier Name',
            cell: info => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white">{info.getValue()}</span>
                    {!info.row.original.is_active && (
                        <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded w-fit font-bold uppercase tracking-wider mt-1">
                            Disabled
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'contact_person',
            header: 'Contact Person',
            cell: info => info.getValue() || <span className="text-slate-400 italic">None</span>,
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: info => info.getValue() || '-',
        },
        {
            accessorKey: 'phone',
            header: 'Phone',
            cell: info => info.getValue() || '-',
        },
        {
            accessorKey: 'address',
            header: 'Address',
            cell: info => (
                <span className="line-clamp-1 max-w-xs block" title={info.getValue()}>
                    {info.getValue() || '-'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-center">Actions</div>,
            cell: info => can('manage suppliers') && (
                <div className="flex justify-center">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <MoreVertical size={16} className="text-slate-500" />
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content width="48">
                            <button
                                onClick={() => handleEdit(info.row.original)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Edit2 size={14} /> Edit Supplier
                            </button>
                            <button
                                onClick={() => handleToggleActive(info.row.original)}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                    info.row.original.is_active 
                                    ? 'text-rose-600 hover:bg-rose-50' 
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                            >
                                {info.row.original.is_active ? (
                                    <><Slash size={14} /> Disable Supplier</>
                                ) : (
                                    <><CheckCircle size={14} /> Enable Supplier</>
                                )}
                            </button>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            )
        }
    ], [can]);

    const handleEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact_person: supplier.contact_person || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
        });
        setIsEditModalOpen(true);
    };

    const handleToggleActive = (supplier) => {
        setConfirmModal({ isOpen: true, supplier });
    };

    const executeToggleActive = () => {
        if (!confirmModal.supplier) return;
        router.patch(route('purchasing.suppliers.toggle-active', confirmModal.supplier.id), {}, {
            onSuccess: () => { setConfirmModal({ isOpen: false, supplier: null }); },
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        const url = isEditModalOpen 
            ? route('purchasing.suppliers.update', selectedSupplier.id)
            : route('purchasing.suppliers.store');
            
        const method = isEditModalOpen ? 'put' : 'post';

        router[method](url, formData, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' });
            },
            onError: () => {
                // If it's a validation error, standard Inertia handling will show it.
                // We only log if it's unexpected or handled specifically.
            },
            onFinish: () => setSubmitting(false)
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Suppliers" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Briefcase className="text-blue-500" /> Suppliers
                        </h1>
                        <p className="text-slate-500">Manage vendor contact information.</p>
                    </div>
                    {can('manage suppliers') && (
                        <button
                            onClick={() => {
                                setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' });
                                setIsAddModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={18} /> Add Supplier
                        </button>
                    )}
                </header>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <DataTable
                        columns={columns}
                        data={suppliers || []}
                        showSearch={true}
                        showPagination={true}
                    />
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                }}
                title={isEditModalOpen ? "Edit Supplier" : "Add New Supplier"}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Supplier Name *</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="E.g. BuildMart Construction Supplies"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Contact Person</label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                            value={formData.contact_person}
                            onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Email</label>
                            <input
                                type="email"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="sales@buildmart.com"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Phone</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+63 912 345 6789"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Full Address</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none h-20"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Industrial Ave, Metro..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || !formData.name}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : (isEditModalOpen ? 'Update Supplier' : 'Save Supplier')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, supplier: null })}
                onConfirm={executeToggleActive}
                title={confirmModal.supplier?.is_active ? "Disable Supplier" : "Enable Supplier"}
                message={`Are you sure you want to ${confirmModal.supplier?.is_active ? 'disable' : 'enable'} this supplier?`}
                type={confirmModal.supplier?.is_active ? "danger" : "confirm"}
                confirmText={confirmModal.supplier?.is_active ? "Disable" : "Enable"}
            />
        </AuthenticatedLayout >
    );
}
