import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2, Mail, Lock, User, Hexagon } from 'lucide-react';
import { useState } from 'react';
import AuthCarousel from '@/Components/AuthCarousel';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout splitScreen={true}>
            <Head title="Create Account" />

            <div className="min-h-screen w-full flex bg-white relative">
                {/* Left Form Section */}
                <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 overflow-y-auto h-screen">

                    {/* Logo Area */}
                    <div className="flex-none pt-8 pb-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-xl bg-[#0066FF] flex items-center justify-center shadow-md">
                                <Hexagon className="text-white fill-white/20" size={20} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">
                                ProcureFlow
                            </span>
                        </Link>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[460px] w-full mx-auto space-y-8 py-7">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Create your account
                            </h1>
                            <p className="text-[15px] text-slate-600">
                                Get started with ProcureFlow today.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Full Name */}
                                <div className="space-y-1.5 flex flex-col items-start">
                                    <label htmlFor="name" className="text-[14px] font-medium text-slate-700">
                                        Full Name
                                    </label>
                                    <div className="relative w-full">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full pl-11 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                            placeholder="John Doe"
                                            autoFocus
                                            autoComplete="name"
                                            required
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-xs text-red-500 font-medium mt-1">{errors.name}</p>
                                    )}
                                </div>

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
                                            autoComplete="username"
                                            required
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-xs text-red-500 font-medium mt-1">{errors.email}</p>
                                    )}
                                </div>
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
                                        placeholder="Create a password"
                                        autoComplete="new-password"
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

                            {/* Confirm Password */}
                            <div className="space-y-1.5 flex flex-col items-start">
                                <label htmlFor="password_confirmation" className="text-[14px] font-medium text-slate-700">
                                    Confirm Password
                                </label>
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="password_confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full pl-11 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                        placeholder="Confirm your password"
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-xs text-red-500 font-medium mt-1">{errors.password_confirmation}</p>
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
                                        'Create Account'
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="text-center">
                            <p className="text-[14px] text-slate-600">
                                Already have an account?{' '}
                                <Link href={route('login')} className="font-semibold text-[#0066FF] hover:text-[#0052CC] transition-colors">
                                    Log in
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
