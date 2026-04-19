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
  const { isAuthenticated, user, initialize, hasHydrated } = useAuthStore();

  // Run after persist rehydration so `initialize` can align token storage with zustand (avoids false "logged in" with no Bearer token).
  useEffect(() => {
    if (hasHydrated) {
      initialize();
    }
  }, [initialize, hasHydrated]);

  // Don't render until auth state is hydrated from storage
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nature-bg dark:bg-night-bg">
        <div className="animate-pulse text-secondary-600 dark:text-secondary-400">Loading...</div>
      </div>
    );
  }

  // Determine redirect destination based on user role or required role
  const getRedirectTo = () => {
    if (redirectTo) return redirectTo;

    // If not authenticated, decide where to send them based on what they are trying to access
    if (!isAuthenticated) {
      // If the route requires admin/staff/manager roles, send to admin login
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const adminRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF];
        if (roles.some(r => adminRoles.includes(r))) {
          return '/admin/login';
        }
      }
      return '/customer/login';
    }

    // If authenticated but wrong role (handled below), or just default fallback
    if (user?.role === UserRole.CUSTOMER) return '/customer/dashboard';
    return '/dashboard';
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
