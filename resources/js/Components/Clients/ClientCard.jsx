import React from 'react';
import { Card } from '@/Components/UI/Card';
import { Building2, Phone, FileText, ChevronRight, Hash, Clock, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ClientCard({ client, onEdit, onDelete }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            <Card hoverEffect className="group relative overflow-hidden h-full p-3.5 border-border bg-card">
                {/* Background Accent */}
                <div className="absolute -right-8 -top-8 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                            <Building2 size={16} />
                        </div>
                        <div className="flex items-center gap-2 relative z-20">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(client); }}
                                className="p-1 hover:bg-blue-500/10 text-muted hover:text-blue-500 rounded transition-colors"
                                title="Edit Client"
                            >
                                <Edit2 size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(client.id); }}
                                className="p-1 hover:bg-red-500/10 text-muted hover:text-red-500 rounded transition-colors"
                                title="Delete Client"
                            >
                                <Trash2 size={12} />
                            </button>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/10 border border-border">
                                <Hash size={10} className="text-muted" />
                                <span className="text-[9px] font-black text-muted uppercase tracking-tight">{client.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-2">
                        <h3 className="text-[15px] font-bold text-foreground mb-0.5 group-hover:text-blue-600 transition-colors line-clamp-1 uppercase tracking-tight">
                            {client.name}
                        </h3>
                        {client.contact_person && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted mb-1 font-medium">
                                <Phone size={10} className="text-blue-500/50" />
                                <span className="truncate">{client.contact_person}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Details */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 mt-auto border-t border-border">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-muted uppercase tracking-wider">Contract</p>
                            <div className="flex items-center gap-1">
                                <FileText size={10} className="text-blue-500/70" />
                                <span className="text-[11px] font-bold text-foreground opacity-80 uppercase">{client.contract_type || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="space-y-0.5 text-right">
                            <p className="text-[9px] font-black text-muted uppercase tracking-wider">Terms</p>
                            <div className="flex items-center gap-1 justify-end">
                                <Clock size={10} className="text-emerald-500/70" />
                                <span className="text-[11px] font-bold text-foreground opacity-80 uppercase">{client.payment_terms || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Badge */}
                    <div className="mt-2.5 flex items-center justify-between">
                        <div className="px-1.5 py-0.5 rounded bg-blue-500/5 border border-blue-500/10">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                                {client.projects_count || 0} Projects
                            </span>
                        </div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-muted group-hover:text-foreground transition-colors">
                            <ChevronRight size={12} />
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
