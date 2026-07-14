import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import AuthCarousel from '@/Components/AuthCarousel';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout splitScreen={true}>
            <Head title="Email Verification" />

            <div className="min-h-screen w-full flex bg-white relative">
                {/* Left Form Section */}
                <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 overflow-y-auto h-screen">

                    {/* Header Area */}
                    <div className="flex-none pt-8 pb-4 flex items-center justify-between">
                        {/* Logo Area */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-full overflow-hidden shadow-md">
                                <img src="/buildora-logo.png" alt="Buildora" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">
                                Buildora
                            </span>
                        </Link>

                        {/* Logout */}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex items-center gap-2 text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Log Out
                        </Link>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto space-y-8 py-10">
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-blue-50 text-[#0066FF] rounded-2xl flex items-center justify-center mb-6">
                                <MailCheck size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Verify your email
                            </h1>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                Thanks for signing up! Before getting started, could you verify
                                your email address by clicking on the link we just emailed to
                                you? If you didn&apos;t receive the email, we will gladly send you
                                another.
                            </p>
                        </div>

                        {status === 'verification-link-sent' && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium text-center shadow-inner">
                                A new verification link has been sent to the email address you provided during registration.
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
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
                                        'Resend Verification Email'
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
