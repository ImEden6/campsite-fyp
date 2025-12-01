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
  const { isAuthenticated, initialize } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

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
