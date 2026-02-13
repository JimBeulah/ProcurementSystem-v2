import { useState } from 'react';
import Sidebar, { SPRING_TRANSITION } from '@/Components/Layout/Sidebar';
import Header from '@/Components/Layout/Header';
import { motion } from 'framer-motion';
import { usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-background overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                isCollapsed={isCollapsed}
                onClose={() => setSidebarOpen(false)}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            {/* Main Content */}
            <motion.div
                layout
                initial={false}
                animate={{ marginLeft: isCollapsed ? "5rem" : "18rem" }}
                transition={SPRING_TRANSITION}
                className="flex-1 flex flex-col h-screen overflow-hidden"
            >
                <Header
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 w-full overflow-x-hidden">
                    {/* Ambient glows */}
                    <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
                    <div className="fixed bottom-0 right-[20%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                    {children}
                </main>
            </motion.div>
        </div>
    );
}
