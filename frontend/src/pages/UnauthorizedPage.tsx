import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { GlassCard } from '@/components/ui/GlassCard';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: _user } = useAuthStore();

  const handleGoBack = () => {
    // If there's no history, go to home
    if (window.history.length <= 2) {
      navigate('/customer-portal');
    } else {
      navigate(-1);
    }
  };

  const handleGoHome = () => {
    navigate('/customer-portal');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-nature-bg dark:bg-night-bg px-4 py-12">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-200/20 dark:bg-red-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-200/20 dark:bg-primary-800/10 rounded-full blur-3xl" />
      </div>

      <GlassCard className="w-full max-w-md text-center p-8" intensity="strong">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="font-heading mb-2 text-3xl font-bold text-gray-900 dark:text-primary-100">
          Access Denied
        </h1>

        <p className="mb-8 text-secondary-600 dark:text-secondary-400">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGoHome}
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleGoBack}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default UnauthorizedPage;
