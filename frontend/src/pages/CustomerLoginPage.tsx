import React from 'react';
import LoginForm from '@/features/auth/LoginForm';
import ThemeToggle from '@/components/ThemeToggle';

const CustomerLoginPage: React.FC = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-nature-bg dark:bg-night-bg px-4 py-12 relative">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/20 dark:bg-accent-800/10 rounded-full blur-3xl" />
            </div>

            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

            <LoginForm
                title="Customer Login"
                description="Sign in to book sites and manage your reservations"
                type="customer"
                alternativeLoginLink={{
                    text: "Staff member? Login here",
                    path: "/admin/login"
                }}
            />
        </div>
    );
};

export default CustomerLoginPage;
