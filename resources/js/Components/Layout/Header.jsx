import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Bell, Search, Menu, LogOut, ChevronDown, Settings, ChevronRight, LayoutDashboard, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/Components/UI/ThemeToggle';
import GlobalSearch from '@/Components/UI/GlobalSearch';
import ConfirmationModal from '@/Components/UI/ConfirmationModal';

export default function Header({ user, onMenuClick }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const { url } = usePage();
    const { auth } = usePage().props;

    const handleMarkAllAsRead = (e) => {
        e.preventDefault();
        router.post(route('notifications.read-all'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Optional: show a success toast or message
            }
        });
    };

    const handleMarkAsRead = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        router.post(route('notifications.read', { notification: id }), {}, {
            preserveScroll: true
        });
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read_at) {
            router.post(route('notifications.read', { notification: notification.id }), {}, {
                preserveScroll: true,
                onFinish: () => {
                    if (notification.data?.url) {
                        router.visit(notification.data.url);
                    }
                }
            });
        } else if (notification.data?.url) {
            router.visit(notification.data.url);
        }
    };

    // Listen for Ctrl+K OR Cmd+K to toggle global search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Generate breadcrumbs from URL
    const { project } = usePage().props;
    const segments = url.split('/').filter(Boolean);
    const breadcrumbs = segments.map((seg, i) => {
        let label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');

        // If segment is numeric and matches project ID, use project name
        if (project && !isNaN(seg) && parseInt(seg) === project.id) {
            label = project.name;
        }

        return {
            label: label,
            href: '/' + segments.slice(0, i + 1).join('/'),
        };
    });

    const handleLogout = (e) => {
        e.preventDefault();
        setIsLogoutConfirmOpen(true);
    };

    const confirmLogout = () => {
        setIsLogoutConfirmOpen(false);
        router.post('/logout');
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-black/5 dark:border-white/5 bg-background/70 backdrop-blur-2xl saturate-180 transition-all supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-2 md:px-4">
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
                    {/* Search - Spotlight Style */}
                    <motion.div
                        initial={false}
                        onClick={() => setIsSearchOpen(true)}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.05] focus-within:bg-white/80 dark:focus-within:bg-white/[0.1] focus-within:shadow-sm focus-within:ring-2 focus-within:ring-black/[0.05] dark:focus-within:ring-white/[0.05] transition-all duration-300 w-64 group backdrop-blur-sm cursor-pointer"
                    >
                        <Search size={14} className="text-muted-foreground/60 group-focus-within:text-foreground/80 transition-colors" />
                        <input
                            type="text"
                            readOnly
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-[13px] text-foreground placeholder:text-muted-foreground/50 w-full focus:ring-0 p-0 h-auto font-medium cursor-pointer"
                        />
                    </motion.div>

                    <div className="h-6 w-px bg-border/40 mx-1" />

                    <ThemeToggle />

                    {/* Notifications Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="p-2 rounded-full hover:bg-muted/10 relative text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Bell size={18} strokeWidth={2} />
                            {auth?.notifications_count > 0 && (
                                <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 border border-background text-[9px] font-bold text-white">
                                    {auth.notifications_count > 99 ? '99+' : auth.notifications_count}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setIsNotificationsOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="fixed md:absolute inset-x-4 md:inset-x-auto md:right-0 top-16 md:top-full mt-2 md:w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-xl shadow-black/5 overflow-hidden z-[70] origin-top-right"
                                    >
                                        <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-foreground tracking-tight">Notifications</h3>
                                            {auth?.notifications_count > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto overscroll-contain">
                                            {auth?.notifications?.length > 0 ? (
                                                <div className="divide-y divide-black/5 dark:divide-white/5">
                                                    {auth.notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`group relative flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer ${!notification.read_at ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}`}
                                                            onClick={() => handleNotificationClick(notification)}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm mb-1 ${!notification.read_at ? 'font-semibold text-foreground' : 'text-foreground/70'}`}>
                                                                    {notification.data?.message || 'New notification'}
                                                                </p>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    {new Date(notification.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            {!notification.read_at && (
                                                                <button
                                                                    onClick={(e) => handleMarkAsRead(e, notification.id)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-all"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            )}
                                                            {!notification.read_at && (
                                                                <div className="absolute top-4 right-2 w-2 h-2 rounded-full bg-blue-600 group-hover:hidden" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-muted-foreground text-sm">
                                                    No new notifications
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

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
                                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-xl shadow-black/5 overflow-hidden z-[70] origin-top-right"
                                    >
                                        <div className="p-4 border-b border-black/5 dark:border-white/5">
                                            <p className="text-sm font-semibold text-foreground tracking-tight">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        </div>
                                        <div className="p-1.5">
                                            <Link
                                                href="/settings"
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

            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <ConfirmationModal
                isOpen={isLogoutConfirmOpen}
                onClose={() => setIsLogoutConfirmOpen(false)}
                onConfirm={confirmLogout}
                title="Sign Out"
                message="Are you sure you want to sign out of your account?"
                confirmText="Sign Out"
                type="danger"
            />
        </header>
    );
}
