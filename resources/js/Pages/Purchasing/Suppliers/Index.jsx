import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import { Briefcase, Plus, Star } from 'lucide-react';
import Modal from '@/Components/UI/Modal';
import { toast } from 'sonner';
import { DataTable } from '@/Components/UI/DataTable';

export default function SuppliersIndex() {
    const { suppliers } = usePage().props;
    const { can } = usePermissions();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        rating: 3,
    });

    const columns = React.useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Supplier Name',
            cell: info => <span className="font-bold text-slate-900 dark:text-white">{info.getValue()}</span>,
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
            accessorKey: 'rating',
            header: 'Rating',
            cell: info => (
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < info.getValue() ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"} />
                    ))}
                </div>
            )
        },
        {
            accessorKey: 'address',
            header: 'Address',
            cell: info => (
                <span className="line-clamp-1 max-w-xs block" title={info.getValue()}>
                    {info.getValue() || '-'}
                </span>
            ),
        }
    ], []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(route('purchasing.suppliers.store'), formData, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setFormData({ name: '', contact_person: '', email: '', phone: '', address: '', rating: 3 });
                toast.success('Supplier added successfully');
            },
            onError: (err) => {
                if (err.name) toast.error(err.name);
                else toast.error('Check form fields and try again.');
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
                        <p className="text-slate-500">Manage vendor contact information and ratings.</p>
                    </div>
                    {can('manage suppliers') && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
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

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Supplier"
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

                    <div className="grid grid-cols-2 gap-4">
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
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block tracking-widest">Rating (1-5)</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                                value={formData.rating}
                                onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
                            >
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                            </select>
                        </div>
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
                            {submitting ? 'Saving...' : 'Save Supplier'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout >
    );
}
