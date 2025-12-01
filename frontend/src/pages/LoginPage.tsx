import React from 'react';
import LoginForm from '@/features/auth/LoginForm';
import ThemeToggle from '@/components/ThemeToggle';

const LoginPage: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <LoginForm />
    </div>
  );
};

export default LoginPage;
