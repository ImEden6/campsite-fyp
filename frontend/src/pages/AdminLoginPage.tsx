/**
 * AdminLoginPage
 * Login page for staff and administrators
 */

import React from 'react';
import LoginForm from '@/features/auth/LoginForm';
import ThemeToggle from '@/components/ThemeToggle';
import { Tent, Shield } from 'lucide-react';

const AdminLoginPage: React.FC = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-nature-bg dark:bg-night-bg px-4 py-12 relative">
            {/* Nature decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200/30 dark:bg-accent-900/20 rounded-full blur-3xl" />
            </div>

            {/* Theme toggle */}
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

            {/* Logo and branding */}
            <div className="absolute top-8 left-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Tent className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="font-heading font-bold text-xl text-gray-900 dark:text-primary-100">CampSite</span>
            </div>

            {/* Login form container */}
            <div className="relative z-10 w-full max-w-md">
                {/* Admin badge */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                        <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Staff Portal</span>
                    </div>
                </div>

                <LoginForm
                    title="Admin Portal"
                    description="Secure access for staff and administrators"
                    type="admin"
                    alternativeLoginLink={{
                        text: "Not staff? Customer login",
                        path: "/customer/login"
                    }}
                />
            </div>
        </div>
    );
};

export default AdminLoginPage;
