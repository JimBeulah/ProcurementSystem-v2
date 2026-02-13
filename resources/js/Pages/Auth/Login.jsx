import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
        <GuestLayout bgImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop">
            <Head title="Sign In" />

            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight font-heading">
                        Welcome back
                    </h1>
                    <p className="text-sm text-muted font-medium">
                        Sign in to your account to continue
                    </p>
                </div>

                {status && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                                <Mail size={16} />
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-foreground/[0.03] border border-border rounded-xl text-sm text-foreground placeholder-muted/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all"
                                placeholder="Enter your email"
                                autoFocus
                                autoComplete="username"
                                required
                            />
                        </div>
                        {errors.email && (
                            <p className="text-xs text-red-500 font-medium mt-1 ml-1">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                                <Lock size={16} />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full pl-10 pr-12 py-3 bg-foreground/[0.03] border border-border rounded-xl text-sm text-foreground placeholder-muted/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-red-500 font-medium mt-1 ml-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500/30 bg-foreground/[0.03] cursor-pointer"
                            />
                            <span className="text-xs font-medium text-muted group-hover:text-foreground transition-colors">
                                Remember me
                            </span>
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Register link */}
                <p className="text-center text-sm text-muted">
                    Don't have an account?{' '}
                    <Link
                        href={route('register')}
                        className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
