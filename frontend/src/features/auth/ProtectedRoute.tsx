import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, initialize } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Determine redirect destination based on user role
  const getRedirectTo = () => {
    if (redirectTo) return redirectTo;
    if (user?.role === UserRole.CUSTOMER) return '/customer/dashboard';
    return '/login';
  };

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    // Redirect to login with return URL
    return (
      <Navigate
        to={getRedirectTo()}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check role-based access if required
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = allowedRoles.includes(user.role);

    if (!hasRequiredRole) {
      // User doesn't have required role, redirect to unauthorized page
      return (
        <Navigate
          to="/unauthorized"
          state={{ from: location.pathname }}
          replace
        />
      );
    }
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

export default ProtectedRoute;
