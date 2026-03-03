import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { User, Shield, AlertTriangle } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Card } from '@/Components/UI/Card';

export default function Edit({ mustVerifyEmail, status }) {
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profile Information', icon: <User size={18} /> },
        { id: 'security', label: 'Security', icon: <Shield size={18} /> },
        { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={18} /> },
    ];
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile Settings" />

            <div className="py-8 max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="rounded-3xl bg-zinc-900 dark:bg-zinc-950 p-8 text-white relative overflow-hidden shadow-2xl border border-zinc-800/50">
                    <div className="absolute top-0 right-0 p-12 opacity-30 pointer-events-none">
                        <div className="w-64 h-64 bg-blue-500/30 rounded-full blur-3xl absolute -top-10 -right-10"></div>
                        <div className="w-64 h-64 bg-purple-500/20 rounded-full blur-3xl absolute top-20 right-20"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30 backdrop-blur-md">
                                <User className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white mb-0.5">Account Settings</h1>
                                <p className="text-zinc-400 text-sm font-medium">Manage your personal information, security, and preferences.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar Tabs */}
                    <div className="md:col-span-1 border-r border-zinc-200 dark:border-zinc-800 pr-4">
                        <nav className="flex flex-col space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent'
                                        }`}
                                >
                                    <span className={activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}>
                                        {tab.icon}
                                    </span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="md:col-span-3">
                        <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-3xl overflow-hidden p-8 min-h-[500px]">
                            {activeTab === 'profile' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                        Profile Information
                                    </h3>
                                    <UpdateProfileInformationForm
                                        mustVerifyEmail={mustVerifyEmail}
                                        status={status}
                                        className="max-w-2xl"
                                    />
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                        Update Password
                                    </h3>
                                    <UpdatePasswordForm className="max-w-2xl" />
                                </div>
                            )}

                            {activeTab === 'danger' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-2 border-b border-red-100 dark:border-red-500/20 pb-4 mb-6">
                                        <AlertTriangle className="text-red-500" size={20} />
                                        <h3 className="text-lg font-bold tracking-tight text-red-600 dark:text-red-400">
                                            Danger Zone
                                        </h3>
                                    </div>
                                    <div className="bg-red-50/50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/20 p-6">
                                        <DeleteUserForm className="max-w-2xl" />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
