/**
 * Permission types and constants
 */

import { UserRole } from '@/types';

export type Permission =
  // Booking permissions
  | 'bookings:view'
  | 'bookings:create'
  | 'bookings:update'
  | 'bookings:delete'
  | 'bookings:manage'
  | 'bookings:check-in'
  | 'bookings:check-out'
  
  // Site permissions
  | 'sites:view'
  | 'sites:create'
  | 'sites:update'
  | 'sites:delete'
  | 'sites:manage'
  
  // User permissions
  | 'users:view'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'users:manage'
  
  // Payment permissions
  | 'payments:view'
  | 'payments:process'
  | 'payments:refund'
  
  // Equipment permissions
  | 'equipment:view'
  | 'equipment:create'
  | 'equipment:update'
  | 'equipment:delete'
  | 'equipment:manage'
  
  // Analytics permissions
  | 'analytics:view'
  | 'analytics:export'
  
  // Settings permissions
  | 'settings:view'
  | 'settings:update';

/**
 * Role-based permission matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access to everything
    'bookings:view',
    'bookings:create',
    'bookings:update',
    'bookings:delete',
    'bookings:manage',
    'bookings:check-in',
    'bookings:check-out',
    'sites:view',
    'sites:create',
    'sites:update',
    'sites:delete',
    'sites:manage',
    'users:view',
    'users:create',
    'users:update',
    'users:delete',
    'users:manage',
    'payments:view',
    'payments:process',
    'payments:refund',
    'equipment:view',
    'equipment:create',
    'equipment:update',
    'equipment:delete',
    'equipment:manage',
    'analytics:view',
    'analytics:export',
    'settings:view',
    'settings:update',
  ],
  
  MANAGER: [
    // Booking management
    'bookings:view',
    'bookings:create',
    'bookings:update',
    'bookings:delete',
    'bookings:manage',
    'bookings:check-in',
    'bookings:check-out',
    // Site viewing and basic management
    'sites:view',
    'sites:update',
    // Limited user management
    'users:view',
    // Payment access
    'payments:view',
    'payments:process',
    'payments:refund',
    // Equipment management
    'equipment:view',
    'equipment:create',
    'equipment:update',
    'equipment:manage',
    // Analytics access
    'analytics:view',
    'analytics:export',
  ],
  
  STAFF: [
    // Basic booking operations
    'bookings:view',
    'bookings:create',
    'bookings:update',
    'bookings:check-in',
    'bookings:check-out',
    // Site viewing
    'sites:view',
    // Payment viewing
    'payments:view',
    'payments:process',
    // Equipment operations
    'equipment:view',
    'equipment:update',
  ],
  
  CUSTOMER: [
    // Own bookings only (enforced by backend)
    'bookings:view',
    'bookings:create',
    'bookings:update',
    // Site browsing
    'sites:view',
    // Own payments
    'payments:view',
    // Equipment viewing
    'equipment:view',
  ],
};
