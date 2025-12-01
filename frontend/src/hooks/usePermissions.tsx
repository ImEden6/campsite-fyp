/**
 * usePermissions Hook
 * Provides component-level permission checking based on user role
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { Permission, ROLE_PERMISSIONS } from './permissionsConstants';

// Re-export for backward compatibility
export type { Permission };
export { PermissionGuard } from './PermissionGuard';

/**
 * Hook for checking user permissions
 */
// eslint-disable-next-line react-refresh/only-export-components
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuthStore();
  
  const permissions = useMemo(() => {
    if (!isAuthenticated || !user) {
      return [];
    }
    
    return ROLE_PERMISSIONS[user.role] || [];
  }, [isAuthenticated, user]);
  
  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };
  
  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => permissions.includes(permission));
  };
  
  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  };
  
  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };
  
  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN';
  };
  
  /**
   * Check if user is manager or above
   */
  const isManager = (): boolean => {
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  };
  
  /**
   * Check if user is staff or above
   */
  const isStaff = (): boolean => {
    return user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'STAFF';
  };
  
  /**
   * Check if user is customer
   */
  const isCustomer = (): boolean => {
    return user?.role === 'CUSTOMER';
  };
  
  return {
    permissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    isAdmin,
    isManager,
    isStaff,
    isCustomer,
    user,
    isAuthenticated,
  };
};

// eslint-disable-next-line react-refresh/only-export-components
export default usePermissions;
