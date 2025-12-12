/**
 * API Service
 * Central export for all API-related functionality
 */

// Export API client and request helpers
export {
  apiClient,
  request,
  get,
  post,
  put,
  patch,
  del,
  uploadFile,
  downloadFile,
} from './client';

// Export API services
export * from './sites';
export * from './bookings';
export * from './maps';
export * from './equipment';
export * from './analytics';
export * from './users';

// Export error handling utilities
export {
  ApiException,
  transformAxiosError,
  isAuthError,
  isValidationError,
  isNetworkError,
  formatValidationErrors,
  getUserFriendlyErrorMessage,
} from './errors';

// Export storage utilities
export {
  getAuthToken,
  setAuthToken,
  getRefreshToken,
  setRefreshToken,
  saveAuthTokens,
  clearAuthTokens,
  getUserData,
  setUserData,
  clearUserData,
  isAuthenticated,
} from './storage';

// Export types
export type {
  ApiError,
  ApiResponse,
  PaginatedResponse,
  AuthTokens,
  RefreshTokenResponse,
} from './types';

// Export mock data (for development)
export * from './mock-sites';
export * from './mock-equipment';
export * from './mockAnalyticsData';
