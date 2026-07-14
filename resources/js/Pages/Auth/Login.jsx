import { Head, useForm, Link } from '@inertiajs/react';
import { Loader2, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import GuestLayout from '@/Layouts/GuestLayout';
import AuthCarousel from '@/Components/AuthCarousel';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout splitScreen={true}>
            <Head title="Sign In" />

            <div className="min-h-screen w-full flex bg-white relative">
                {/* Left Form Section */}
                <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 overflow-y-auto h-screen">

                    {/* Logo Area */}
                    <div className="flex-none pt-8 pb-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-full overflow-hidden shadow-md">
                                <img src="/buildora-logo.png" alt="Buildora" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">
                                Buildora
                            </span>
                        </Link>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto space-y-8 py-10">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Log in to your Account
                            </h1>
                            <p className="text-[15px] text-slate-600">
                                Welcome back! Please enter your details.
                            </p>
                        </div>

                        {status && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium text-center shadow-inner">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            {/* Username/Email */}
                            <div className="space-y-1.5 flex flex-col items-start">
                                <label htmlFor="username" className="text-[14px] font-medium text-slate-700">
                                    Username
                                </label>
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        className="w-full pl-11 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                        autoFocus
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-xs text-red-500 font-medium mt-1">{errors.username}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5 flex flex-col items-start">
                                <label htmlFor="password" className="text-[14px] font-medium text-slate-700">
                                    Password
                                </label>
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full pl-11 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            {showPassword ? (
                                                <>
                                                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" />
                                                </>
                                            ) : (
                                                <>
                                                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
                                                </>
                                            )}
                                        </svg>
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-500 font-medium mt-1">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember and Forgot Password */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]/30 bg-white cursor-pointer"
                                    />
                                    <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                        Remember me
                                    </span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => toast.info('Please contact the system administrator to reset your password.', {
                                        description: 'Account security and reset requests are handled by the Admin.',
                                    })}
                                    className="text-[14px] font-semibold text-[#0066FF] hover:text-[#0052CC] transition-colors"
                                >
                                    Forgot Password?
                                </button>
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
                                        'Log in'
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="text-center pt-8">
                            <p className="text-[14px] text-slate-600">
                                Don&apos;t have an account?{' '}
                                <Link
                                    href={route('register')}
                                    className="font-semibold text-[#0066FF] hover:text-[#0052CC] transition-colors"
                                >
                                    Create an account
                                </Link>
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
