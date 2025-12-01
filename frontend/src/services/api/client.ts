/**
 * API Client
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { API_TIMEOUT } from '@/config/constants';
import { transformAxiosError, ApiException, isAuthError } from './errors';
import { getAuthToken, setAuthToken, clearAuthTokens } from './storage';
import { RefreshTokenResponse } from './types';
import { addBreadcrumb, captureException } from '@/config/sentry';

/**
 * Transform date strings to Date objects in API responses
 * Handles nested objects and arrays
 */
const transformDates = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(transformDates);
  }

  // Handle objects
  if (typeof data === 'object') {
    const transformed: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Convert date fields
      if ((key === 'checkInDate' || key === 'checkOutDate' || key === 'createdAt' || 
           key === 'updatedAt' || key === 'checkInTime' || key === 'checkOutTime' ||
           key === 'startDate' || key === 'endDate' || key === 'sentAt' || key === 'readAt' ||
           key === 'processedAt' || key === 'refundedAt' || key === 'returnedAt' ||
           key === 'lastLoginAt' || key === 'emailVerifiedAt' || key === 'phoneVerifiedAt') && 
          typeof value === 'string') {
        transformed[key] = new Date(value);
      } else if (typeof value === 'object') {
        // Recursively transform nested objects
        transformed[key] = transformDates(value);
      } else {
        transformed[key] = value;
      }
    }
    
    return transformed;
  }

  return data;
};

/**
 * Create Axios instance with base configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: env.apiUrl,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor for authentication
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAuthToken();
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add breadcrumb for API request
      addBreadcrumb(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        'http',
        'info',
        {
          method: config.method,
          url: config.url,
        }
      );
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Add breadcrumb for successful response
      addBreadcrumb(
        `API Response: ${response.status} ${response.config.url}`,
        'http',
        'info',
        {
          status: response.status,
          url: response.config.url,
        }
      );
      
      // Transform date strings to Date objects for booking-related endpoints
      if (response.config.url?.includes('/bookings')) {
        response.data = transformDates(response.data);
      }
      
      // Return successful response
      return response;
    },
    async (error) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Transform error to ApiError format
      const apiError = transformAxiosError(error);
      
      // Add breadcrumb for error
      addBreadcrumb(
        `API Error: ${apiError.statusCode} ${originalRequest.url}`,
        'http',
        'error',
        {
          status: apiError.statusCode,
          url: originalRequest.url,
          message: apiError.message,
        }
      );

      // Handle authentication errors (401)
      if (isAuthError(apiError) && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh the token
          const newToken = await refreshAuthToken();
          
          if (newToken && originalRequest.headers) {
            // Update the authorization header with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Retry the original request
            return client.request(originalRequest);
          }
        } catch (refreshError) {
          // Token refresh failed, clear auth and redirect to login
          clearAuthTokens();
          
          // Capture exception in Sentry
          captureException(
            refreshError instanceof Error ? refreshError : new Error('Token refresh failed'),
            { originalError: apiError }
          );
          
          // Dispatch custom event for auth failure
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
          
          return Promise.reject(new ApiException(
            apiError.message,
            apiError.statusCode,
            apiError.errors,
            apiError.code
          ));
        }
      }
      
      // Capture non-auth errors in Sentry (except expected errors)
      if (apiError.statusCode >= 500) {
        captureException(
          new Error(apiError.message),
          {
            statusCode: apiError.statusCode,
            url: originalRequest.url,
            errors: apiError.errors,
          }
        );
      }

      // Reject with ApiException
      return Promise.reject(new ApiException(
        apiError.message,
        apiError.statusCode,
        apiError.errors,
        apiError.code
      ));
    }
  );

  return client;
};

/**
 * Refresh authentication token
 */
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    // Get refresh token from storage
    const refreshToken = localStorage.getItem('campsite_refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Create a new axios instance without interceptors to avoid infinite loop
    const refreshClient = axios.create({
      baseURL: env.apiUrl,
      timeout: API_TIMEOUT,
    });

    // Call refresh token endpoint
    const response = await refreshClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });

    const { accessToken } = response.data;

    // Save new access token
    setAuthToken(accessToken);

    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

/**
 * API Client instance
 */
export const apiClient = createApiClient();

/**
 * Generic request wrapper with type safety
 */
export const request = async <T = unknown>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException('An unexpected error occurred', 500);
  }
};

/**
 * GET request helper
 */
export const get = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'GET', url });
};

/**
 * POST request helper
 */
export const post = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'POST', url, data });
};

/**
 * PUT request helper
 */
export const put = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'PUT', url, data });
};

/**
 * PATCH request helper
 */
export const patch = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'PATCH', url, data });
};

/**
 * DELETE request helper
 */
export const del = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return request<T>({ ...config, method: 'DELETE', url });
};

/**
 * Upload file helper
 */
export const uploadFile = async <T = unknown>(
  url: string,
  file: File,
  fieldName: string = 'file',
  additionalData?: Record<string, unknown>,
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
): Promise<T> => {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });
  }

  return request<T>({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

/**
 * Download file helper
 */
export const downloadFile = async (
  url: string,
  filename?: string,
  config?: AxiosRequestConfig
): Promise<void> => {
  try {
    const response = await apiClient.request({
      ...config,
      method: 'GET',
      url,
      responseType: 'blob',
    });

    // Create blob link to download
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename || 'download';
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException('File download failed', 500);
  }
};

export default apiClient;
