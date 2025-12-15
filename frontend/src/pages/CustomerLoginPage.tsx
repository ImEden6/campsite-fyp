import React from 'react';
import LoginForm from '@/features/auth/LoginForm';
import ThemeToggle from '@/components/ThemeToggle';

const CustomerLoginPage: React.FC = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 relative">
            <div className="absolute top-4 right-4">
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
