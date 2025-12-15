import React from 'react';
import RegisterForm from '@/features/auth/RegisterForm';
import ThemeToggle from '@/components/ThemeToggle';

const RegisterPage: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <RegisterForm />
    </div>
  );
};

export default RegisterPage;