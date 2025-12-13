/**
 * Mock Authentication Service
 * Provides mock authentication for development when backend is not available
 */

import { LoginResponse, User, UserRole } from '@/types';

// Mocking users database
const mockUsers: Record<string, { user: User; password: string }> = {
  'admin@campsite.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@campsite.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  'staff@campsite.com': {
    password: 'staff123',
    user: {
      id: '3',
      email: 'staff@campsite.com',
      firstName: 'Sarah',
      lastName: 'Staff',
      role: UserRole.STAFF,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  'manager@campsite.com': {
    password: 'manager123',
    user: {
      id: '4',
      email: 'manager@campsite.com',
      firstName: 'Mike',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  'customer@campsite.com': {
    password: 'customer123',
    user: {
      id: '2',
      email: 'customer@campsite.com',
      firstName: 'John',
      lastName: 'Customer',
      role: UserRole.CUSTOMER,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
};

/**
 * Export mock users for use in other mock services
 */
export const getMockUsers = (): User[] => {
  return Object.values(mockUsers).map(record => record.user);
};

/**
 * Mocking login function
 */
export const mockLogin = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const userRecord = mockUsers[email];

  if (!userRecord || userRecord.password !== password) {
    throw new Error('Invalid email or password');
  }

  return {
    user: userRecord.user,
    tokens: {
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      expiresIn: 86400, // 24 hours
    },
  };
};

/**
 * Check if mock auth should be used
 */
export const shouldUseMockAuth = (): boolean => {
  // Use mock auth if VITE_USE_MOCK_AUTH is explicitly set to 'true'
  // This works in development, preview, and production builds
  const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
  
  return useMockAuth;
};
