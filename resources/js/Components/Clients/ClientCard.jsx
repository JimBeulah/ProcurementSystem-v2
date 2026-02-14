import React from 'react';
import { Card } from '@/Components/UI/Card';
import { Building2, Phone, FileText, ChevronRight, Hash, Clock, Edit2, Trash2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function ClientCard({ client, onEdit, onDelete }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            <Card hoverEffect className="group relative overflow-hidden h-full p-4 bg-card shadow-sm hover:shadow-md transition-all rounded-xl border border-border/40">
                {/* Background Accent - Smaller & Subtler */}
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                            <Building2 size={16} />
                        </div>
                        <div className="flex items-center gap-1 relative z-20">
                            <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded mr-1">
                                #{client.id}
                            </span>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(client); }}
                                className="p-1.5 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(client.id); }}
                                className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-3">
                        <h3 className="text-base font-bold text-foreground mb-0.5 group-hover:text-blue-600 transition-colors line-clamp-1 tracking-tight">
                            {client.name}
                        </h3>
                        {client.contact_person && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                                <Users size={12} className="text-blue-500/60" />
                                <span className="truncate">{client.contact_person}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Details */}
                    <div className="grid grid-cols-2 gap-2 pt-3 mt-auto border-t border-border/30">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Contract</p>
                            <div className="flex items-center gap-1">
                                <FileText size={12} className="text-blue-500/60" />
                                <span className="text-[11px] font-semibold text-foreground truncate">{client.contract_type}</span>
                            </div>
                        </div>
                        <div className="space-y-0.5 text-right">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Terms</p>
                            <div className="flex items-center gap-1 justify-end">
                                <Clock size={12} className="text-emerald-500/60" />
                                <span className="text-[11px] font-semibold text-foreground truncate">{client.payment_terms}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Badge */}
                    <div className="mt-3 flex items-center justify-between">
                        <div className="px-2 py-1 rounded-md bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                                {client.projects_count || 0} Project{client.projects_count !== 1 && 's'}
                            </span>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
