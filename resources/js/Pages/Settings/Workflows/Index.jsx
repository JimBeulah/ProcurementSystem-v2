import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { Shield, Plus, Trash2, ArrowRight } from 'lucide-react';
import Modal from '@/Components/UI/Modal';

export default function WorkflowsIndex() {
    const { rules } = usePage().props;
    const ruleList = rules || [];
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ processType: 'PO', minAmount: 0, maxAmount: '', approverRole: 'PROJECT_MANAGER' });

    return (
        <AuthenticatedLayout>
            <Head title="Approval Workflows" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><Shield className="text-emerald-500" /> Approval Workflows</h1>
                        <p className="text-slate-500">Configure approval hierarchy and spending limits.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold"><Plus size={18} /> Add Rule</button>
                </header>

                <div className="grid gap-4">
                    {['PO', 'RFQ', 'PAYMENT'].map(type => {
                        const typeRules = ruleList.filter(r => r.process_type === type);
                        if (typeRules.length === 0) return null;
                        return (
                            <div key={type} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-l-4 border-emerald-500 pl-3">{type} Approval Flow</h2>
                                <div className="space-y-3">
                                    {typeRules.map((rule, idx) => (
                                        <div key={rule.id} className="flex items-center bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg group">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm mr-4">{idx + 1}</div>
                                            <div className="flex-1">
                                                <div className="text-sm text-slate-500 mb-1">Condition</div>
                                                <div className="font-mono text-slate-900 dark:text-white">
                                                    {Number(rule.min_amount).toLocaleString()} <span className="text-slate-400 mx-2">—</span> {rule.max_amount ? Number(rule.max_amount).toLocaleString() : 'Unlimited'}
                                                </div>
                                            </div>
                                            <ArrowRight className="text-slate-400 mx-6" />
                                            <div className="flex-1">
                                                <div className="text-sm text-slate-500 mb-1">Required Approver</div>
                                                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-semibold border border-blue-500/20">{rule.approver_role}</span>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {ruleList.length === 0 && (
                        <div className="text-center p-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            No approval rules configured. Add one to start.
                        </div>
                    )}
                </div>

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Approval Rule">
                    <form onSubmit={e => { e.preventDefault(); setShowModal(false); }} className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Module</label>
                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white" value={formData.processType} onChange={e => setFormData({ ...formData, processType: e.target.value })}>
                                <option value="PO">Purchase Order (PO)</option><option value="RFQ">Request for Quotation (RFQ)</option><option value="PAYMENT">Payment / Disbursement</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Min Amount</label>
                                <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white" value={formData.minAmount} onChange={e => setFormData({ ...formData, minAmount: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Max Amount</label>
                                <input type="number" placeholder="Unlimited" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white" value={formData.maxAmount} onChange={e => setFormData({ ...formData, maxAmount: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Approver Role</label>
                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white" value={formData.approverRole} onChange={e => setFormData({ ...formData, approverRole: e.target.value })}>
                                <option value="PROJECT_MANAGER">Project Manager</option><option value="PROCUREMENT_OFFICER">Procurement Officer</option><option value="FINANCE">Finance</option><option value="AUDITOR">Auditor</option><option value="HEAD_OF_ADMIN">Head of Admin</option><option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold">Cancel</button>
                            <button type="submit" className="bg-emerald-600 px-6 py-2 rounded-lg text-white font-bold text-xs hover:bg-emerald-500">Save Rule</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
