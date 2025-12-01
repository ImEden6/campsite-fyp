/**
 * Users API Service
 * Handles all user management API calls
 */

import { get, post, put, patch, del } from './client';
import { shouldUseMockAuth } from './mock-auth';
import {
  mockGetUsers,
  mockGetUserById,
  mockCreateUser,
  mockUpdateUser,
  mockUpdateUserStatus,
  mockDeleteUser,
  mockSendPasswordResetEmail,
} from './mock-users';
import type {
  User,
  UserRole,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

export interface UserFilters {
  role?: UserRole[];
  isActive?: boolean;
  searchTerm?: string;
  isEmailVerified?: boolean;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserPasswordData {
  currentPassword?: string;
  newPassword: string;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Get all users with optional filters
 */
export const getUsers = async (filters?: UserFilters): Promise<User[]> => {
  if (shouldUseMockAuth()) {
    return mockGetUsers(filters);
  }
  const response = await get<ApiResponse<User[]>>('/users', { params: filters });
  return response.data || [];
};

/**
 * Get paginated users
 */
export const getUsersPaginated = async (
  page: number = 1,
  limit: number = 10,
  filters?: UserFilters
): Promise<PaginatedResponse<User>> => {
  const response = await get<PaginatedResponse<User>>('/users/paginated', {
    params: { page, limit, ...filters },
  });
  return response;
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User> => {
  if (shouldUseMockAuth()) {
    return mockGetUserById(id);
  }
  const response = await get<ApiResponse<User>>(`/users/${id}`);
  return response.data!;
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await get<ApiResponse<User>>('/users/me');
  return response.data!;
};

/**
 * Create a new user (Admin only)
 */
export const createUser = async (userData: CreateUserData): Promise<User> => {
  if (shouldUseMockAuth()) {
    return mockCreateUser(userData);
  }
  const response = await post<ApiResponse<User>>('/users', userData);
  return response.data!;
};

/**
 * Update user
 */
export const updateUser = async (
  id: string,
  userData: UpdateUserData
): Promise<User> => {
  if (shouldUseMockAuth()) {
    return mockUpdateUser(id, userData);
  }
  const response = await put<ApiResponse<User>>(`/users/${id}`, userData);
  return response.data!;
};

/**
 * Update user status (activate/deactivate)
 */
export const updateUserStatus = async (
  id: string,
  isActive: boolean
): Promise<User> => {
  if (shouldUseMockAuth()) {
    return mockUpdateUserStatus(id, isActive);
  }
  const response = await patch<ApiResponse<User>>(`/users/${id}/status`, { isActive });
  return response.data!;
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (
  id: string,
  role: UserRole
): Promise<User> => {
  const response = await patch<ApiResponse<User>>(`/users/${id}/role`, { role });
  return response.data!;
};

/**
 * Update user password
 */
export const updateUserPassword = async (
  id: string,
  passwordData: UpdateUserPasswordData
): Promise<void> => {
  await post<ApiResponse<void>>(`/users/${id}/password`, passwordData);
};

/**
 * Reset user password (Admin only)
 */
export const resetUserPassword = async (id: string): Promise<{ temporaryPassword: string }> => {
  const response = await post<ApiResponse<{ temporaryPassword: string }>>(`/users/${id}/reset-password`);
  return response.data!;
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (id: string): Promise<void> => {
  if (shouldUseMockAuth()) {
    return mockDeleteUser(id);
  }
  await del<ApiResponse<void>>(`/users/${id}`);
};

/**
 * Get user activity log
 */
export const getUserActivityLog = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<UserActivityLog>> => {
  const response = await get<PaginatedResponse<UserActivityLog>>(`/users/${userId}/activity`, {
    params: { page, limit },
  });
  return response;
};

/**
 * Get user login history
 */
export const getUserLoginHistory = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<{
  id: string;
  userId: string;
  loginAt: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}>> => {
  const response = await get<PaginatedResponse<{
    id: string;
    userId: string;
    loginAt: Date;
    ipAddress: string;
    userAgent: string;
    success: boolean;
  }>>(`/users/${userId}/login-history`, {
    params: { page, limit },
  });
  return response;
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (userId: string): Promise<void> => {
  if (shouldUseMockAuth()) {
    return mockSendPasswordResetEmail(userId);
  }
  await post<ApiResponse<void>>(`/users/${userId}/send-reset-email`);
};

/**
 * Verify user email
 */
export const verifyUserEmail = async (userId: string): Promise<User> => {
  const response = await post<ApiResponse<User>>(`/users/${userId}/verify-email`);
  return response.data!;
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (userId: string, file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await post<ApiResponse<User>>(`/users/${userId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data!;
};

/**
 * Delete user avatar
 */
export const deleteUserAvatar = async (userId: string): Promise<User> => {
  const response = await del<ApiResponse<User>>(`/users/${userId}/avatar`);
  return response.data!;
};
