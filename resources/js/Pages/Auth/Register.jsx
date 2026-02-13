import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2, Mail, Lock, User } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Create Account" />

            <div className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight font-heading">
                        Create your account
                    </h1>
                    <p className="text-sm text-muted font-medium">
                        Get started with ProcureFlow today
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="name" className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><User size={16} /></div>
                            <input
                                id="name" type="text" value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-foreground/[0.03] border border-border rounded-xl text-sm text-foreground placeholder-muted/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all"
                                placeholder="John Doe" autoFocus autoComplete="name" required
                            />
                        </div>
                        {errors.name && <p className="text-xs text-red-500 font-medium mt-1 ml-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Mail size={16} /></div>
                            <input
                                id="email" type="email" value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-foreground/[0.03] border border-border rounded-xl text-sm text-foreground placeholder-muted/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all"
                                placeholder="you@company.com" autoComplete="username" required
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-500 font-medium mt-1 ml-1">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Lock size={16} /></div>
                                <input
                                    id="password" type="password" value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-foreground/[0.03] border border-border rounded-xl text-sm text-foreground placeholder-muted/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all"
                                    placeholder="••••••••" autoComplete="new-password" required
                                />
                            </div>
                            {errors.password && <p className="text-xs text-red-500 font-medium mt-1 ml-1">{errors.password}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password_confirmation" className="text-[10px] text-muted uppercase font-black tracking-widest ml-1">Confirm</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Lock size={16} /></div>
                                <input
                                    id="password_confirmation" type="password" value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-foreground/[0.03] border border-border rounded-xl text-sm text-foreground placeholder-muted/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all"
                                    placeholder="••••••••" autoComplete="new-password" required
                                />
                            </div>
                            {errors.password_confirmation && <p className="text-xs text-red-500 font-medium mt-1 ml-1">{errors.password_confirmation}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                    >
                        {processing ? <><Loader2 className="animate-spin" size={16} /> Creating...</> : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-muted">
                    Already have an account?{' '}
                    <Link href={route('login')} className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
