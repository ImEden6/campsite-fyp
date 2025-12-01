/**
 * Component wrapper for permission-based rendering
 */

import { UserRole } from '@/types';
import { Permission } from './permissionsConstants';
import { usePermissions } from './usePermissions';

interface PermissionGuardProps {
  permission?: Permission | Permission[];
  role?: UserRole | UserRole[];
  requireAll?: boolean; // For multiple permissions, require all (default) or any
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  role,
  requireAll = true,
  fallback = null,
  children,
}) => {
  const { hasAllPermissions, hasAnyPermission, hasRole } = usePermissions();
  
  // Check role if specified
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }
  
  // Check permission if specified
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
};
