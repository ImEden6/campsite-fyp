/**
 * Storage Service
 * Handles secure storage of authentication tokens and user data
 */

import { STORAGE_KEYS } from '@/config/constants';
import { AuthTokens } from './types';

/**
 * Get auth token from storage
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error reading auth token from storage:', error);
    return null;
  }
};

/**
 * Set auth token in storage
 */
export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token to storage:', error);
  }
};

/**
 * Get refresh token from storage
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error reading refresh token from storage:', error);
    return null;
  }
};

/**
 * Set refresh token in storage
 */
export const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('Error saving refresh token to storage:', error);
  }
};

/**
 * Save auth tokens to storage
 */
export const saveAuthTokens = (tokens: AuthTokens): void => {
  setAuthToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);
};

/**
 * Clear auth tokens from storage
 */
export const clearAuthTokens = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error clearing auth tokens from storage:', error);
  }
};

/**
 * Get user data from storage
 */
export const getUserData = <T = unknown>(): T | null => {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error reading user data from storage:', error);
    return null;
  }
};

/**
 * Set user data in storage
 */
export const setUserData = <T = unknown>(user: T): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user data to storage:', error);
  }
};

/**
 * Clear user data from storage
 */
export const clearUserData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error clearing user data from storage:', error);
  }
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
