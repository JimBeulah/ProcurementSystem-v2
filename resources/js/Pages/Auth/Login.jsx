import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
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
        <GuestLayout>
            <Head title="Sign In" />

            {/* macOS Window Glass Panel */}
            <div className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-3xl rounded-2xl border border-white/50 dark:border-white/10 shadow-2xl p-8 space-y-6">

                {/* Header */}
                <div className="space-y-1 text-center">
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
                        Sign In
                    </h1>
                    <p className="text-[14px] text-slate-600 dark:text-slate-300">
                        Use your ProcureFlow account
                    </p>
                </div>

                {status && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium text-center shadow-inner">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1.5 flex flex-col items-start">
                        <label htmlFor="email" className="text-[13px] font-medium text-slate-700 dark:text-slate-300 ml-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3 py-2 bg-white/90 dark:bg-black/20 border border-slate-300/50 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner"
                            placeholder="Enter your email"
                            autoFocus
                            autoComplete="username"
                            required
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 font-medium pl-1 mt-1">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5 flex flex-col items-start">
                        <label htmlFor="password" className="text-[13px] font-medium text-slate-700 dark:text-slate-300 ml-1">
                            Password
                        </label>
                        <div className="relative w-full">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full px-3 py-2 bg-white/90 dark:bg-black/20 border border-slate-300/50 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner pr-16"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-red-500 font-medium pl-1 mt-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="w-3.5 h-3.5 rounded-[4px] border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500/30 bg-white/90 dark:bg-black/20 cursor-pointer"
                            />
                            <span className="text-[13px] text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                Keep me logged in
                            </span>
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[#007AFF] hover:bg-[#0061CC] dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-2 rounded-lg font-medium text-[14px] shadow-sm ring-1 ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {processing ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>
                </form>

                {/* Register link */}
                <div className="text-center text-[13px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/50 dark:border-white/10 mt-6 flex justify-center items-center">
                    <span className="mt-4 inline-block">
                        Don't have an account?{' '}
                        <Link
                            href={route('register')}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            Create account
                        </Link>
                    </span>
                </div>
            </div>
        </GuestLayout>
    );
}
