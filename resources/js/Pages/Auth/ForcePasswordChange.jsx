import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export default function ForcePasswordChange() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.change.update'));
    };

    return (
        <GuestLayout>
            <Head title="Set New Password" />

            <div className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-3xl rounded-2xl border border-white/50 dark:border-white/10 shadow-2xl p-8 space-y-6">

                {/* Header */}
                <div className="space-y-2 text-center">
                    <div className="flex justify-center">
                        <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
                            <ShieldAlert className="text-amber-500" size={24} />
                        </div>
                    </div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
                        Set New Password
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Your account is using a temporary password. <br />
                        Please set a new secure password to continue.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {/* New Password */}
                    <div className="space-y-1.5 flex flex-col items-start">
                        <label htmlFor="password" className="text-[13px] font-medium text-slate-700 dark:text-slate-300 ml-1">
                            New Password
                        </label>
                        <div className="relative w-full">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full px-3 py-2 bg-white/90 dark:bg-black/20 border border-slate-300/50 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner pr-16"
                                placeholder="Minimum 8 characters"
                                autoFocus
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

                    {/* Confirm Password */}
                    <div className="space-y-1.5 flex flex-col items-start">
                        <label htmlFor="password_confirmation" className="text-[13px] font-medium text-slate-700 dark:text-slate-300 ml-1">
                            Confirm New Password
                        </label>
                        <input
                            id="password_confirmation"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="w-full px-3 py-2 bg-white/90 dark:bg-black/20 border border-slate-300/50 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner"
                            placeholder="Re-enter your new password"
                            required
                        />
                    </div>

                    {/* Password strength hint */}
                    <div className="flex gap-1.5 items-start p-3 rounded-lg bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                        <span className="text-blue-500 text-[10px] mt-0.5 shrink-0">ℹ</span>
                        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                            Use at least 8 characters. Mix letters, numbers, and symbols for a stronger password.
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[#007AFF] hover:bg-[#0061CC] dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-2 rounded-lg font-medium text-[14px] shadow-sm ring-1 ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {processing ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                'Set Password & Continue'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
