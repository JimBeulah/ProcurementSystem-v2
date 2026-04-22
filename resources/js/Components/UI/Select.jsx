import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function Select({ value, onChange, options, icon: Icon, placeholder = "Select...", className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full pl-9 pr-8 py-2 text-left
                    bg-black/[0.03] dark:bg-white/[0.04] 
                    hover:bg-black/[0.05] dark:hover:bg-white/[0.08]
                    active:bg-black/[0.07] dark:active:bg-white/[0.1]
                    rounded-lg transition-all duration-150
                    text-[13px] font-medium text-foreground
                    flex items-center outline-none
                    focus:ring-2 focus:ring-blue-500/25
                    border-none cursor-pointer select-none
                `}
            >
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 pointer-events-none">
                        <Icon size={13} />
                    </div>
                )}
                <span className="truncate">{selectedLabel}</span>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 pointer-events-none">
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={14} />
                    </motion.div>
                </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 w-full min-w-[160px] top-full mt-1.5 left-0 
                                   bg-white/80 dark:bg-[#1e1e1e]/90 backdrop-blur-xl backdrop-saturate-150
                                   border border-black/[0.04] dark:border-white/[0.08]
                                   rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20
                                   overflow-hidden p-1.5"
                    >
                        <div className="max-h-[240px] overflow-y-auto scrollbar-thin">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium
                                            flex items-center justify-between group transition-colors duration-150
                                            ${isSelected
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-foreground hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400'
                                            }
                                        `}
                                    >
                                        <span className="truncate mr-2">{option.label}</span>
                                        {isSelected && (
                                            <Check size={12} strokeWidth={3} className="shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
