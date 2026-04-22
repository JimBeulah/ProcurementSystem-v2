import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Database, Download, Upload, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';

export default function DatabaseManagement() {
    const [confirmingReset, setConfirmingReset] = useState(false);
    const [confirmingImport, setConfirmingImport] = useState(false);
    const fileInput = useRef();

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        database_file: null,
    });

    const handleBackup = () => {
        window.location.href = route('settings.database.backup');
    };

    const handleImportClick = () => {
        if (!data.database_file) {
            fileInput.current.click();
        } else {
            setConfirmingImport(true);
        }
    };

    const submitImport = (e) => {
        e.preventDefault();
        post(route('settings.database.import'), {
            onSuccess: () => {
                setConfirmingImport(false);
                reset();
            },
        });
    };

    const handleReset = (e) => {
        e.preventDefault();
        post(route('settings.database.reset'), {
            onSuccess: () => {
                setConfirmingReset(false);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Database Management" />

            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Database className="text-blue-500" /> Database Management
                    </h1>
                    <p className="text-slate-500">Maintain, backup, and restore your system data.</p>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {/* Backup Section */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                <Download size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Database Backup</h3>
                                <p className="text-slate-500 text-sm mb-4">
                                    Download a full backup of your database in .sql format. You should perform backups regularly to prevent data loss.
                                </p>
                                <PrimaryButton onClick={handleBackup} className="flex items-center gap-2">
                                    <Download size={16} /> Download Backup
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>

                    {/* Import Section */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-amber-500">
                        <div className="p-6 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                <Upload size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Restore Database</h3>
                                <p className="text-slate-500 text-sm mb-4">
                                    Upload a .sql backup file to restore the database. <span className="text-amber-600 dark:text-amber-400 font-semibold italic">Warning: This will overwrite all current data!</span>
                                </p>
                                
                                <div className="space-y-3">
                                    <input 
                                        type="file" 
                                        ref={fileInput}
                                        className="hidden" 
                                        accept=".sql,.txt"
                                        onChange={e => setData('database_file', e.target.files[0])}
                                    />
                                    
                                    {data.database_file && (
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                                            <CheckCircle2 size={14} className="text-emerald-500" />
                                            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                                {data.database_file.name}
                                            </span>
                                            <button onClick={() => setData('database_file', null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <SecondaryButton onClick={handleImportClick} disabled={processing}>
                                            <Upload size={16} className="mr-2" />
                                            {data.database_file ? 'Confirm Restore' : 'Select SQL File'}
                                        </SecondaryButton>
                                        
                                        {errors.database_file && (
                                            <span className="text-xs text-red-500">{errors.database_file}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reset Section */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-red-500">
                        <div className="p-6 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                <RefreshCw size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Factory Reset</h3>
                                <p className="text-slate-500 text-sm mb-4">
                                    Wipe all data and return the database to its initial state (with default seed data). <span className="text-red-600 font-bold underline italic">This action is permanent and irreversible!</span>
                                </p>
                                <DangerButton onClick={() => setConfirmingReset(true)}>
                                    <RefreshCw size={16} className="mr-2" /> Reset Database
                                </DangerButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Confirmation Modal */}
            <Modal show={confirmingImport} onClose={() => setConfirmingImport(false)}>
                <div className="p-6">
                    <div className="flex items-center gap-3 text-amber-600 mb-4">
                        <AlertTriangle size={24} />
                        <h2 className="text-lg font-bold">Confirm Database Restore</h2>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        Are you absolutely sure you want to restore the database from <span className="font-mono font-bold text-slate-900 dark:text-white">{data.database_file?.name}</span>? 
                        This will delete and replace all current data in the system. This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setConfirmingImport(false)}>Cancel</SecondaryButton>
                        <PrimaryButton onClick={submitImport} className="bg-amber-600 hover:bg-amber-500" disabled={processing}>
                            {processing ? 'Restoring...' : 'Yes, Restore Database'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Reset Confirmation Modal */}
            <Modal show={confirmingReset} onClose={() => setConfirmingReset(false)}>
                <div className="p-6">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <ShieldAlert size={24} />
                        <h2 className="text-lg font-bold">Extreme Warning: Factory Reset</h2>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                        <p className="text-red-700 dark:text-red-400 text-sm leading-relaxed font-medium">
                            This will completely wipe all projects, BOQs, materials, suppliers, and transactions. 
                            The system will be returned to its &quot;empty&quot; state with only the administrator accounts.
                        </p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Please type <span className="font-mono font-bold text-red-600 select-all">RESET DATABASE</span> below to confirm.
                    </p>
                    
                    <input 
                        type="text" 
                        placeholder="Type confirmation here"
                        className="w-full mb-6 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-900 dark:text-white focus:ring-red-500 focus:border-red-500"
                        onChange={(e) => {
                            if (e.target.value === 'RESET DATABASE') {
                                setData('confirm_reset_text', true);
                            } else {
                                setData('confirm_reset_text', false);
                            }
                        }}
                    />

                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setConfirmingReset(false)}>Cancel</SecondaryButton>
                        <DangerButton 
                            onClick={handleReset} 
                            disabled={!data.confirm_reset_text || processing}
                        >
                            {processing ? 'Resetting...' : 'Yes, WIPE EVERYTHING'}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
