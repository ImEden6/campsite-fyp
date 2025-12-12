/**
 * Mock Users Service
 * Provides mock user data for development when backend is not available
 */

import { User } from '@/types';
import { getMockUsers } from './mock-auth';
import type { CreateUserData, UpdateUserData, UserFilters } from './users';

// In-memory storage for mock users (includes the default test users)
const mockUsersList: User[] = [...getMockUsers()];

/**
 * Get all mock users with optional filters
 */
export const mockGetUsers = async (filters?: UserFilters): Promise<User[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filteredUsers = [...mockUsersList];

  // Apply filters
  if (filters) {
    if (filters.role && filters.role.length > 0) {
      filteredUsers = filteredUsers.filter(user => filters.role!.includes(user.role));
    }

    if (filters.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === filters.isActive);
    }

    if (filters.isEmailVerified !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isEmailVerified === filters.isEmailVerified);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }
  }

  return filteredUsers;
};

/**
 * Get mock user by ID
 */
export const mockGetUserById = async (id: string): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const user = mockUsersList.find(u => u.id === id);
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Create a new mock user
 */
export const mockCreateUser = async (userData: CreateUserData): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const newUser: User = {
    id: String(Date.now()),
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    role: userData.role,
    isActive: true,
    isEmailVerified: false,
    isPhoneVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockUsersList.push(newUser);
  return newUser;
};

/**
 * Update mock user
 */
export const mockUpdateUser = async (id: string, userData: UpdateUserData): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const userIndex = mockUsersList.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const existingUser = mockUsersList[userIndex];
  if (!existingUser) {
    throw new Error('User not found');
  }

  const updatedUser: User = {
    id: existingUser.id,
    email: existingUser.email,
    firstName: userData.firstName ?? existingUser.firstName,
    lastName: userData.lastName ?? existingUser.lastName,
    phone: userData.phone ?? existingUser.phone,
    role: userData.role ?? existingUser.role,
    isActive: userData.isActive ?? existingUser.isActive,
    isEmailVerified: existingUser.isEmailVerified,
    isPhoneVerified: existingUser.isPhoneVerified,
    createdAt: existingUser.createdAt,
    updatedAt: new Date(),
    preferences: existingUser.preferences,
  };

  mockUsersList[userIndex] = updatedUser;
  return updatedUser;
};

/**
 * Update mock user status
 */
export const mockUpdateUserStatus = async (id: string, isActive: boolean): Promise<User> => {
  return mockUpdateUser(id, { isActive });
};

/**
 * Delete mock user
 */
export const mockDeleteUser = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const userIndex = mockUsersList.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  mockUsersList.splice(userIndex, 1);
};

/**
 * Send password reset email (mock - just simulates the action)
 */
export const mockSendPasswordResetEmail = async (_userId: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In a real implementation, this would send an email
  // For mock, just simulate the delay
};