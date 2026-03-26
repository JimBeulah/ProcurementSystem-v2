import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Loader2, Mail, Hexagon, ArrowLeft } from 'lucide-react';
import AuthCarousel from '@/Components/AuthCarousel';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout splitScreen={true}>
            <Head title="Forgot Password" />

            <div className="min-h-screen w-full flex bg-white relative">
                {/* Left Form Section */}
                <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 overflow-y-auto h-screen">

                    {/* Header Area */}
                    <div className="flex-none pt-8 pb-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-xl bg-[#0066FF] flex items-center justify-center shadow-md">
                                <Hexagon className="text-white fill-white/20" size={20} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">
                                ProcureFlow
                            </span>
                        </Link>

                        {/* Back to Login */}
                        <Link
                            href={route('login')}
                            className="flex items-center gap-2 text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto space-y-8 py-10">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Forgot password?
                            </h1>
                            <p className="text-[15px] text-slate-600">
                                No problem. Just let us know your email address and we will email you a password reset link.
                            </p>
                        </div>

                        {status && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium text-center shadow-inner">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            {/* Email Address */}
                            <div className="space-y-1.5 flex flex-col items-start">
                                <label htmlFor="email" className="text-[14px] font-medium text-slate-700">
                                    Email Address
                                </label>
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full pl-11 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                        placeholder="you@company.com"
                                        autoFocus
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-red-500 font-medium mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="pt-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white py-3 rounded-xl font-medium text-[15px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                                >
                                    {processing ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        'Email Password Reset Link'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Branding Section (Carousel) */}
                <AuthCarousel />
            </div>
        </GuestLayout>
    );
}
