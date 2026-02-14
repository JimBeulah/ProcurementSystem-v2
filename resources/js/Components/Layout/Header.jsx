import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Bell, Search, Menu, LogOut, ChevronDown, Settings, ChevronRight, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/Components/UI/ThemeToggle';

export default function Header({ user, onMenuClick }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { url } = usePage();

    // Generate breadcrumbs from URL
    const segments = url.split('/').filter(Boolean);
    const breadcrumbs = segments.map((seg, i) => ({
        label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
        href: '/' + segments.slice(0, i + 1).join('/'),
    }));

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-black/5 dark:border-white/5 bg-background/70 backdrop-blur-2xl saturate-180 transition-all supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted/10 text-muted-foreground"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Breadcrumbs - Finder Style */}
                    <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                            <span className="sr-only">Home</span>
                            <LayoutDashboard size={16} />
                        </Link>
                        {breadcrumbs.length > 0 && <ChevronRight size={12} className="text-muted-foreground/40" />}

                        {breadcrumbs.map((crumb, i) => (
                            <React.Fragment key={crumb.href}>
                                {i > 0 && <ChevronRight size={12} className="text-muted-foreground/40" />}
                                {i === breadcrumbs.length - 1 ? (
                                    <span className="text-foreground tracking-tight">{crumb.label}</span>
                                ) : (
                                    <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors tracking-tight">
                                        {crumb.label}
                                    </Link>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search - Spotlight Style */}
                    <motion.div
                        initial={false}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-transparent focus-within:bg-background focus-within:border-blue-500/30 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all w-64 group shadow-sm hover:shadow-md"
                    >
                        <Search size={14} className="text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground/70 w-full focus:ring-0 p-0 h-auto font-medium"
                        />
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded bg-background/50 border border-border/50 px-1.5 font-mono text-[10px] font-bold text-muted-foreground opacity-70 sm:flex">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </motion.div>

                    <div className="h-6 w-px bg-border/40 mx-1" />

                    <ThemeToggle />

                    <button className="p-2 rounded-full hover:bg-muted/10 relative text-muted-foreground hover:text-foreground transition-colors">
                        <Bell size={18} strokeWidth={2} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-background" />
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <motion.button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-muted/10 transition-all text-left group"
                            whileTap={{ scale: 0.97 }}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm text-xs ring-2 ring-transparent group-hover:ring-border/50 transition-all">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </motion.button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setIsProfileOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-xl shadow-black/5 overflow-hidden z-[70] origin-top-right"
                                    >
                                        <div className="p-4 border-b border-black/5 dark:border-white/5">
                                            <p className="text-sm font-semibold text-foreground tracking-tight">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        </div>
                                        <div className="p-1.5">
                                            <Link
                                                href="/profile"
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-blue-500/10 hover:text-blue-600 rounded-xl transition-all"
                                            >
                                                <Settings size={16} />
                                                Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                            >
                                                <LogOut size={16} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
