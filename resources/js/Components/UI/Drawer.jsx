import React, { useEffect, useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Drawer({ isOpen, onClose, title, children, width = 'w-full max-w-2xl' }) {
    const isMounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isMounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 40,
                            mass: 0.8
                        }}
                        className={`relative z-10 h-full ${width} bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-xl border-l border-white/20 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-white/[0.06] bg-white/50 dark:bg-black/20">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                {title}
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] flex items-center justify-center transition-colors"
                            >
                                <X size={16} className="text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain container-snap custom-scrollbar p-4 sm:p-6">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
