import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';
import { Toaster } from 'sonner';
import FlashNotifications from '@/Components/FlashNotifications';
import { ThemeToggle } from '@/Components/UI/ThemeToggle';
import ParticleCanvas from '@/Components/UI/ParticleCanvas';

export default function GuestLayout({ children, bgImage, splitScreen = false }) {
    const { url } = usePage();

    if (splitScreen) {
        return (
            <div className="flex min-h-screen relative overflow-hidden bg-white">
                <motion.div
                    key={url}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full flex"
                >
                    {children}
                </motion.div>
                <Toaster position="top-right" richColors closeButton />
                <FlashNotifications />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen relative overflow-hidden items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Background Layer */}
            {bgImage ? (
                <div className="absolute inset-0 z-0">
                    <img
                        src={bgImage}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover scale-105"
                    />
                    {/* Overlay for text readability */}
                    <div className="absolute inset-0 bg-white/30 dark:bg-slate-950/40" />
                </div>
            ) : (
                <ParticleCanvas />
            )}

            <div className="absolute top-6 right-6 z-20">
                <ThemeToggle />
            </div>

            {/* Central Content */}
            <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-3 mb-8 group">
                    <div className="w-12 h-12 rounded-[14px] bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-black/20 ring-1 ring-white/30 group-hover:scale-105 transition-transform duration-300">
                        <Hexagon className="text-white fill-white/20" size={26} />
                    </div>
                    <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white drop-shadow-md">
                        ProcureFlow
                    </span>
                </Link>

                <motion.div
                    key={url}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full flex flex-col"
                >
                    {children}
                </motion.div>
            </div>

            <Toaster position="top-right" richColors closeButton />
            <FlashNotifications />
        </div>
    );
}
