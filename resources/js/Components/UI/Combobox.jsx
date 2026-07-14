import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';

export default function Combobox({ value, onChange, options, icon: Icon, placeholder = "Select...", searchPlaceholder = "Search...", className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

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

    // Focus search input when opening
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current.focus(), 100);
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedLabel = options.find(opt => String(opt.value) === String(value))?.label || placeholder;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full ${Icon ? 'pl-9 pr-3' : 'px-3'} py-2.5 text-left
                    bg-white dark:bg-slate-900
                    border border-slate-200 dark:border-slate-700
                    hover:border-slate-300 dark:hover:border-slate-600
                    rounded-lg transition-all duration-150
                    text-sm text-slate-900 dark:text-white
                    flex items-center justify-between cursor-pointer select-none relative
                `}
            >
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Icon size={14} />
                    </div>
                )}
                <span className={`truncate ${!value && 'text-slate-500 font-normal'}`}>
                    {selectedLabel}
                </span>
                <ChevronDown size={14} className="text-slate-400 ml-2 shrink-0" />
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 w-full mt-1 left-0 
                                   bg-white dark:bg-slate-800 
                                   border border-slate-200 dark:border-slate-700
                                   rounded-xl shadow-lg shadow-black/5
                                   overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                            <Search size={14} className="text-slate-400 shrink-0 ml-1" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full bg-transparent border-none p-1 text-sm text-slate-900 dark:text-white focus:ring-0 placeholder-slate-400 focus:outline-none"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Options List */}
                        <div className="max-h-[240px] overflow-y-auto scrollbar-thin p-1">
                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-4 text-sm text-center text-slate-500">
                                    No results found.
                                </div>
                            ) : (
                                filteredOptions.map((option) => {
                                    const isSelected = String(option.value) === String(value);
                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                            }}
                                            className={`
                                                w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium
                                                flex items-center justify-between group transition-colors duration-150 cursor-pointer mb-0.5
                                                ${isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                                }
                                            `}
                                        >
                                            <span className="truncate mr-2">{option.label}</span>
                                            {isSelected && (
                                                <Check size={14} strokeWidth={2.5} className="shrink-0 text-blue-600 dark:text-blue-400" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
