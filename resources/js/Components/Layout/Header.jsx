import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Bell, Search, Menu, LogOut, ChevronDown, Settings } from 'lucide-react';
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
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl transition-all">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted/10 text-muted"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Breadcrumbs */}
                    <nav className="hidden md:flex items-center gap-1.5 text-sm">
                        {breadcrumbs.map((crumb, i) => (
                            <React.Fragment key={crumb.href}>
                                {i > 0 && <span className="text-muted/40 text-xs">/</span>}
                                {i === breadcrumbs.length - 1 ? (
                                    <span className="text-foreground font-medium">{crumb.label}</span>
                                ) : (
                                    <Link href={crumb.href} className="text-muted hover:text-foreground transition-colors">
                                        {crumb.label}
                                    </Link>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <motion.div
                        initial={false}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/5 border border-border focus-within:border-cyan-500/50 transition-all w-48"
                    >
                        <Search size={14} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm text-foreground placeholder-muted w-full focus:ring-0"
                        />
                    </motion.div>

                    <ThemeToggle />

                    <button className="p-2 rounded-full hover:bg-muted/10 relative text-muted hover:text-foreground transition-colors">
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 border border-background" />
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <motion.button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-muted/10 transition-all text-left"
                            whileTap={{ scale: 0.97 }}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg text-xs">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="hidden md:flex flex-col">
                                <span className="text-xs font-medium text-foreground leading-none">{user?.name}</span>
                                <span className="text-[10px] text-muted leading-none mt-1">{user?.role || 'User'}</span>
                            </div>
                            <ChevronDown size={14} className={`text-muted transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </motion.button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setIsProfileOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-2xl overflow-hidden z-[70] origin-top-right backdrop-blur-xl"
                                    >
                                        <div className="p-4 border-b border-border bg-muted/5">
                                            <p className="text-sm font-medium text-foreground">{user?.name}</p>
                                            <p className="text-xs text-muted">{user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <Link
                                                href="/profile"
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-muted/10 rounded-lg transition-colors"
                                            >
                                                <Settings size={16} />
                                                Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
