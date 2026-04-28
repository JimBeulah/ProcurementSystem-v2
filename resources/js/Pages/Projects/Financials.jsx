import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Briefcase, ArrowLeft, Printer } from 'lucide-react';
import IncomeStatement from '@/Components/Finance/IncomeStatement';
import PdfPreviewModal from '@/Components/UI/PdfPreviewModal';

export default function ProjectFinancials({ project, financialData }) {
    const [previewUrl, setPreviewUrl] = useState(null);

    const handlePrint = () => {
        const url = route('finance.reports.print', { project_id: project.id });
        setPreviewUrl(url);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Financials - ${project.name}`} />

            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('projects.show', project.id)}
                            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 transition-colors shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                                <Briefcase size={22} className="text-blue-500" />
                                Financial Performance
                            </h1>
                            <p className="text-sm text-muted-foreground italic">{project.name}</p>
                        </div>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-sm active:scale-95"
                    >
                        <Printer size={18} /> Print Statement
                    </button>
                </header>

                <div className="pb-12">
                    <IncomeStatement data={financialData} />
                </div>
            </div>

            <PdfPreviewModal
                isOpen={!!previewUrl}
                onClose={() => setPreviewUrl(null)}
                url={previewUrl}
                title={`Financial Report - ${project.name}`}
            />
        </AuthenticatedLayout>
    );
}
