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
        <GuestLayout bgImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop">
            <Head title="Sign In" />

            <div className="glass-card p-8 space-y-6">
                {/* Header */}
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-[15px] text-muted font-normal">
                        Sign in to your account
                    </p>
                </div>

                {status && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 text-sm font-medium text-center">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1">
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white/50 dark:bg-white/5 border border-border/50 rounded-xl text-[15px] text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all shadow-sm"
                            placeholder="Email address"
                            autoFocus
                            autoComplete="username"
                            required
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 font-medium pl-1">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full px-3 py-2.5 bg-white/50 dark:bg-white/5 border border-border/50 rounded-xl text-[15px] text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all shadow-sm pr-20"
                                placeholder="Password"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-red-500 font-medium pl-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="w-4 h-4 rounded-md border-border/60 text-accent focus:ring-accent/20 bg-transparent cursor-pointer"
                            />
                            <span className="text-[13px] text-muted hover:text-foreground transition-colors">
                                Remember me
                            </span>
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-accent hover:bg-accent/90 text-white py-2.5 rounded-xl font-semibold text-[15px] shadow-lg shadow-accent/20 hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        {processing ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Register link */}
                <div className="text-center text-[13px] text-muted pt-2">
                    Don't have an account?{' '}
                    <Link
                        href={route('register')}
                        className="font-medium text-accent hover:text-accent/80 transition-colors"
                    >
                        Create account
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
