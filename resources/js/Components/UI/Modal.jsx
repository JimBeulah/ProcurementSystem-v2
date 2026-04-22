import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', closeOnOutsideClick = false }) {
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
            if (e.key === 'Escape' && closeOnOutsideClick) onClose?.();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose, closeOnOutsideClick]);

    if (!isMounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* macOS Backdrop — deep blur like Spotlight */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-2xl"
                        onClick={() => closeOnOutsideClick && onClose?.()}
                    />

                    {/* Modal Panel — macOS sheet style */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 32,
                            mass: 0.7
                        }}
                        className={`relative z-10 w-full ${maxWidth} bg-white/80 dark:bg-[#1e1e1e]/90 backdrop-blur-2xl backdrop-saturate-[1.8] border border-white/30 dark:border-white/[0.08] rounded-2xl shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)] overflow-hidden`}
                    >
                        {/* macOS Title Bar — centered title with traffic-light close */}
                        <div className="relative flex items-center justify-center px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                            {/* Close button — left side like macOS */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute left-4 top-1/2 -translate-y-1/2 group w-7 h-7 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-red-500 flex items-center justify-center transition-all duration-150"
                            >
                                <X size={12} className="text-black/40 dark:text-white/40 group-hover:text-white transition-colors" />
                            </button>

                            {/* Centered title — macOS style */}
                            <h2 className="text-[13px] font-semibold text-foreground/90 tracking-[-0.01em] select-none">
                                {title}
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[85vh] overflow-y-auto overscroll-contain scrollbar-thin">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
