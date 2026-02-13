import { Link } from '@inertiajs/react';
import { Hexagon } from 'lucide-react';
import { Toaster } from 'sonner';
import FlashNotifications from '@/Components/FlashNotifications';
import { ThemeToggle } from '@/Components/UI/ThemeToggle';

export default function GuestLayout({ children, bgImage }) {
    return (
        <div className="flex min-h-screen">
            {/* Left Panel - Branding/Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                {bgImage ? (
                    <>
                        <img
                            src={bgImage}
                            alt="Background"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/10" />
                        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                        {/* Ambient glows */}
                        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
                        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
                        {/* Grid pattern overlay */}
                        <div className="absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                                backgroundSize: '60px 60px',
                            }}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    <div>
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-shadow">
                                <Hexagon className="text-white fill-white/20" size={22} />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">ProcureFlow</span>
                        </Link>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
                            Streamline your
                            <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                                procurement workflow
                            </span>
                        </h2>
                        <p className="text-blue-100/80 text-lg leading-relaxed max-w-md drop-shadow-sm font-medium">
                            End-to-end procurement management — from material requests to purchase orders, all in one platform.
                        </p>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {['BOQ Management', 'RFQ Tracking', 'Budget Control', 'Inventory'].map((feat) => (
                                <span
                                    key={feat}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.1] border border-white/[0.1] text-white backdrop-blur-md shadow-sm"
                                >
                                    {feat}
                                </span>
                            ))}
                        </div>
                    </div>

                    <p className="text-blue-100/50 text-xs font-medium">
                        © {new Date().getFullYear()} ProcureFlow. Built for construction procurement.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-background relative transition-colors duration-300">
                <div className="absolute top-4 right-4 z-20">
                    <ThemeToggle />
                </div>
                {/* Subtle ambient */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Hexagon className="text-white fill-white/20" size={22} />
                        </div>
                        <span className="text-xl font-bold text-foreground tracking-tight">ProcureFlow</span>
                    </div>

                    {children}
                </div>
            </div>
            <Toaster position="top-right" richColors closeButton />
            <FlashNotifications />
        </div>
    );
}
