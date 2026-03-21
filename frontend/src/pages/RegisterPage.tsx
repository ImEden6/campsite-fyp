import React from 'react';
import RegisterForm from '@/features/auth/RegisterForm';
import ThemeToggle from '@/components/ThemeToggle';

const RegisterPage: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-nature-bg dark:bg-night-bg px-4 py-12 relative">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/20 dark:bg-accent-800/10 rounded-full blur-3xl" />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <RegisterForm />
    </div>
  );
};

export default RegisterPage;