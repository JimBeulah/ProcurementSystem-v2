import { useState } from 'react';
import Sidebar, { SPRING_TRANSITION } from '@/Components/Layout/Sidebar';
import Header from '@/Components/Layout/Header';
import { motion } from 'framer-motion';
import { usePage } from '@inertiajs/react';
import { Toaster } from 'sonner';
import FlashNotifications from '@/Components/FlashNotifications';
import SubNavigationTabs from '@/Components/Layout/SubNavigationTabs';
import { NAVIGATION_CONFIG } from '@/Config/Navigation';

export default function AuthenticatedLayout({ children }) {
    const { url } = usePage();
    const { auth } = usePage().props;
    const user = auth.user;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarCollapsed');
            return saved === 'true';
        }
        return false;
    });

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', String(newState));
    };

    // Find the current active group to display its children in the SubNavigationTabs
    const activeGroup = NAVIGATION_CONFIG.find(group =>
        group.items.some(item =>
            item.exactMatch ? url === item.matchPrefix : url.startsWith(item.matchPrefix)
        )
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                isCollapsed={isCollapsed}
                onClose={() => setSidebarOpen(false)}
                toggleCollapse={toggleCollapse}
            />

            {/* Main Content */}
            <motion.div
                layout
                initial={false}
                animate={{ marginLeft: isCollapsed ? "5rem" : "14rem" }}
                transition={SPRING_TRANSITION}
                className="flex-1 flex flex-col h-screen overflow-hidden"
            >
                <Header
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <main className="flex-1 flex flex-col overflow-y-auto relative z-10 w-full overflow-x-hidden">
                    {/* Sub Navigation Tabs */}
                    {activeGroup && <SubNavigationTabs items={activeGroup.items} />}

                    {/* Page Content */}
                    <div className="pt-4 pb-8 px-4 md:pt-6 md:pb-8 md:px-8 flex-1 w-full">
                        {/* Ambient glows */}
                        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
                        <div className="fixed bottom-0 right-[20%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                        {children}
                    </div>
                </main>
                <Toaster position="top-right" richColors closeButton />
                <FlashNotifications />
            </motion.div>
        </div>
    );
}
