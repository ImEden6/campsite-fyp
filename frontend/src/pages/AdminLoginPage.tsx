import React from 'react';
import LoginForm from '@/features/auth/LoginForm';
import ThemeToggle from '@/components/ThemeToggle';

const AdminLoginPage: React.FC = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 px-4 py-12 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
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
    );
};

export default AdminLoginPage;
