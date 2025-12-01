import React from 'react';
import RegisterForm from '@/features/auth/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
