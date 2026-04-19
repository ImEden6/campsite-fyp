import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * PublicRoute component for routes that should only be accessible when NOT authenticated
 * (e.g., login, register pages)
 */
const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const location = useLocation();
  const { isAuthenticated, initialize, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated) {
      initialize();
    }
  }, [initialize, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nature-bg dark:bg-night-bg">
        <div className="animate-pulse text-secondary-600 dark:text-secondary-400">Loading...</div>
      </div>
    );
  }

  // If user is already authenticated, redirect to dashboard or specified location
  if (isAuthenticated) {
    // Check if there's a return URL in location state
    const from = (location.state as { from?: string })?.from;
    const destination = from || redirectTo;

    return <Navigate to={destination} replace />;
  }

  // User is not authenticated, show the public page
  return <>{children}</>;
};

export default PublicRoute;
