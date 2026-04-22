import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import {
    Search,
    LayoutDashboard,
    FolderKanban,
    FileText,
    ShoppingCart,
    Truck,
    Package,
    Users,
    Settings,
    Banknote,
    Send
} from 'lucide-react';

export default function GlobalSearch({ isOpen, onClose }) {
    const isMounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );
    const [searchQuery, setSearchQuery] = useState('');
    const { auth, search_projects } = usePage().props;

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (!isOpen) {
            setSearchQuery('');
        }
    }

    // Helper function to check permissions
    const hasPermission = (permission) => {
        if (!auth?.user) return false;
        if (auth.roles?.includes('admin')) return true;
        return auth.permissions?.includes(permission);
    };

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
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const handleSelect = (href) => {
        onClose();
        router.get(href);
    };

    if (!isMounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-2xl"
                        onClick={onClose}
                    />

                    {/* Dialog Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -16 }}
                        transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 30,
                            mass: 0.8
                        }}
                        className="relative z-10 w-full max-w-2xl bg-white/80 dark:bg-[#1e1e1e]/90 backdrop-blur-3xl backdrop-saturate-[1.8] border border-white/40 dark:border-white/[0.08] rounded-2xl shadow-[0_32px_100px_-16px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_100px_-16px_rgba(0,0,0,0.7)] overflow-hidden"
                    >
                        <Command
                            className="flex flex-col w-full bg-transparent [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground/70 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:mt-1 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-tight"
                            shouldFilter={true}
                        >
                            <div className="flex items-center px-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                                <Search size={18} className="text-muted-foreground mr-3" />
                                <Command.Input
                                    autoFocus
                                    placeholder="Type a command or search..."
                                    value={searchQuery}
                                    onValueChange={setSearchQuery}
                                    className="flex-1 h-14 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-[15px] font-medium focus:ring-0 p-0"
                                />
                                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-black/[0.04] dark:bg-white/[0.06] text-xs font-medium text-muted-foreground ml-3 select-none">
                                    <span className="text-[10px] font-bold">ESC</span> to close
                                </div>
                            </div>

                            <Command.List className="max-h-[60vh] overflow-y-auto overscroll-contain p-2 space-y-1 cmdk-list">
                                {searchQuery.trim() === '' ? (
                                    <div className="py-14 text-center">
                                        <p className="text-sm font-medium text-muted-foreground/80">
                                            Start typing to search projects and modules...
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <Command.Empty className="py-14 text-center text-sm text-muted-foreground/80 font-medium">
                                            No results found.
                                        </Command.Empty>

                                        {search_projects && search_projects.length > 0 && (
                                            <Command.Group heading="My Projects">
                                                {search_projects.map((project) => (
                                                    <Command.Item
                                                        key={`project-${project.id}`}
                                                        onSelect={() => handleSelect(`/projects/${project.id}`)}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                                    >
                                                        <FolderKanban size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                        {project.name}
                                                    </Command.Item>
                                                ))}
                                            </Command.Group>
                                        )}

                                        <Command.Group heading="Overview">
                                            <Command.Item
                                                onSelect={() => handleSelect('/dashboard')}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                            >
                                                <LayoutDashboard size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                Dashboard
                                            </Command.Item>

                                            {hasPermission('view projects') && (
                                                <Command.Item
                                                    onSelect={() => handleSelect('/projects')}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                                >
                                                    <FolderKanban size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                    All Projects
                                                </Command.Item>
                                            )}
                                        </Command.Group>

                                        <Command.Group heading="Modules">
                                            {hasPermission('view material requests') && (
                                                <Command.Item
                                                    onSelect={() => handleSelect('/material-requests')}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                                >
                                                    <FileText size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                    Material Requests
                                                </Command.Item>
                                            )}
                                            {hasPermission('view purchase requests') && (
                                                <Command.Item
                                                    onSelect={() => handleSelect('/purchase-requests')}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                                >
                                                    <ShoppingCart size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                    Purchase Requests
                                                </Command.Item>
                                            )}
                                            {hasPermission('view purchase orders') && (
                                                <Command.Item
                                                    onSelect={() => handleSelect('/purchase-orders')}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                                >
                                                    <Package size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                    Purchase Orders
                                                </Command.Item>
                                            )}
                                            {/* Using exact check from routes: role_or_permission:site_engineer|view receiving */}
                                            {(hasPermission('view receiving') || auth?.roles?.includes('site_engineer')) && (
                                                <Command.Item
                                                    onSelect={() => handleSelect('/receiving')}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                                >
                                                    <Truck size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                    Receiving
                                                </Command.Item>
                                            )}
                                            {(hasPermission('view invoices') || hasPermission('view disbursements')) && (
                                                <Command.Item
                                                    onSelect={() => handleSelect('/finance')}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                                >
                                                    <Banknote size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                    Finance
                                                </Command.Item>
                                            )}
                                        </Command.Group>

                                        <Command.Group heading="Settings">
                                            <Command.Item
                                                onSelect={() => handleSelect('/settings/profile')}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                            >
                                                <Settings size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                Profile Settings
                                            </Command.Item>
                                            {hasPermission('manage users') && (
                                                <Command.Item
                                                    onSelect={() => handleSelect('/settings/users')}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                                >
                                                    <Users size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                    User Management
                                                </Command.Item>
                                            )}
                                            <Command.Item
                                                onSelect={() => handleSelect('/settings')}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] data-[selected='true']:bg-blue-600 data-[selected='true']:text-white cursor-pointer transition-colors group"
                                            >
                                                <Settings size={16} className="text-muted-foreground group-data-[selected='true']:text-white transition-colors" />
                                                System Settings
                                            </Command.Item>
                                        </Command.Group>
                                    </>
                                )}
                            </Command.List>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
