/**
 * API Error Handling
 * Error transformation and handling utilities
 */

import { AxiosError } from 'axios';
import { ApiError } from './types';
import { ERROR_MESSAGES } from '@/config/constants';

/**
 * Custom API Error class
 */
export class ApiException extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;
  public code?: string;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>, code?: string) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
  }
}

/**
 * Transform Axios error to ApiError
 */
export const transformAxiosError = (error: AxiosError): ApiError => {
  // Network error (no response)
  if (!error.response) {
    return {
      message: ERROR_MESSAGES.NETWORK_ERROR,
      statusCode: 0,
      code: 'NETWORK_ERROR',
    };
  }

  const { status, data } = error.response;

  // Extract error details from response
  const errorData = data as Record<string, unknown>;
  const message = (errorData?.message as string) || getDefaultErrorMessage(status);
  const errors = errorData?.errors as Record<string, string[]> | undefined;
  const code = errorData?.code as string | undefined;

  return {
    message,
    statusCode: status,
    errors,
    code,
  };
};

/**
 * Get default error message based on status code
 */
const getDefaultErrorMessage = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 401:
      return ERROR_MESSAGES.SESSION_EXPIRED;
    case 403:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return 'An unexpected error occurred';
  }
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: ApiError): boolean => {
  return error.statusCode === 401;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: ApiError): boolean => {
  return error.statusCode === 400 && !!error.errors;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: ApiError): boolean => {
  return error.statusCode === 0 || error.code === 'NETWORK_ERROR';
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors?: Record<string, string[]>): string => {
  if (!errors) return '';
  
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: ApiError): string => {
  if (isValidationError(error)) {
    return formatValidationErrors(error.errors) || error.message;
  }
  
  return error.message;
};
