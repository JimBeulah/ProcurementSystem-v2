import React from 'react';
import { Card } from '@/Components/UI/Card';
import { Building2, ChevronRight, Edit2, Trash2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function ClientCard({ client, onEdit, onDelete }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <Card hoverEffect className="group relative overflow-hidden h-full p-5 rounded-2xl border-none">
                {/* Subtle gradient accent on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-[14px] bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
                            <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        {(onEdit || onDelete) && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {onEdit && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(client); }}
                                        className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-black/40 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-150 cursor-pointer"
                                        title="Edit"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(client.id); }}
                                        className="p-2 hover:bg-red-500/10 text-black/40 dark:text-white/40 hover:text-red-500 rounded-lg transition-all duration-150 cursor-pointer"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Title & Contact */}
                    <div className="mb-4">
                        <h3 className="text-[15px] font-semibold text-foreground mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 tracking-[-0.01em]">
                            {client.name}
                        </h3>
                        {client.contacts && client.contacts.length > 0 ? (
                            <div className="flex flex-col gap-1 mt-2">
                                {client.contacts.slice(0, 2).map((contact, idx) => (
                                    <div key={idx} className="flex flex-col text-xs">
                                        <div className="flex items-center gap-1.5 text-black/60 dark:text-white/60">
                                            <Users size={12} />
                                            <span className="truncate font-medium">{contact.name}</span>
                                        </div>
                                        {contact.phone && (
                                            <div className="text-[11px] text-black/40 dark:text-white/40 pl-4">
                                                {contact.phone}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {client.contacts.length > 2 && (
                                    <div className="text-[11px] text-blue-600/70 dark:text-blue-400/70 font-medium pl-4">
                                        +{client.contacts.length - 2} more contact(s)
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40 mt-2">
                                <Users size={12} />
                                <span className="truncate">No contacts added</span>
                            </div>
                        )}
                    </div>

                    {/* Projects Badge */}
                    <div className="mt-auto pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
                        <span className="text-[11px] font-medium text-blue-600/80 dark:text-blue-400/80 bg-blue-500/[0.06] px-2.5 py-1 rounded-full">
                            {client.projects_count || 0} Project{client.projects_count !== 1 && 's'}
                        </span>
                        <ChevronRight size={14} className="text-black/15 dark:text-white/15 group-hover:text-black/40 dark:group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
