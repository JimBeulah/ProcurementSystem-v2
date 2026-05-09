import { Head, Link } from '@inertiajs/react';
import { Hexagon, LogOut, ShieldAlert } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import AuthCarousel from '@/Components/AuthCarousel';

export default function AccountInactive() {
    return (
        <GuestLayout splitScreen={true}>
            <Head title="Account Inactive" />

            <div className="min-h-screen w-full flex bg-white relative">
                {/* Left Content Section */}
                <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 overflow-y-auto h-screen">

                    {/* Logo Area */}
                    <div className="flex-none pt-8 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-[#0066FF] flex items-center justify-center shadow-md">
                                <Hexagon className="text-white fill-white/20" size={20} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">
                                ProcureFlow
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto space-y-8 py-10 text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-2 animate-pulse">
                                <ShieldAlert className="text-amber-600" size={32} />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Account Inactive
                            </h1>
                            <p className="text-[15px] text-slate-600">
                                Your account is currently pending activation. Please contact the system administrator to activate your account.
                            </p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4 text-left">
                            <div className="flex-none">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Hexagon className="text-blue-600" size={20} />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 text-sm">Need help?</h3>
                                <p className="text-blue-700 text-xs mt-0.5 leading-relaxed">
                                    Reach out to your department head or the IT support team to expedite the approval process.
                                </p>
                            </div>
                        </div>

                        <div className="pt-3">
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white py-3 rounded-xl font-medium text-[15px] shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                            >
                                <LogOut size={18} />
                                Return to Login
                            </Link>
                        </div>

                        <div className="text-center pt-8">
                            <p className="text-[14px] text-slate-400 font-medium">
                                ProcureFlow v2.0 &bull; Security Protocol Active
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Branding Section (Carousel) */}
                <AuthCarousel />
            </div>
        </GuestLayout>
    );
}
