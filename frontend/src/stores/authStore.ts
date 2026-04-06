/**
 * Authentication Store
 * Manages authentication state, login, logout, and token refresh
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens, LoginCredentials, LoginResponse } from '@/types';
import {
  saveAuthTokens,
  clearAuthTokens,
  setUserData,
  getUserData,
  getAuthToken,
  getRefreshToken
} from '@/services/api/storage';
import { post } from '@/services/api/client';
import { setUserContext, clearUserContext } from '@/config/sentry';
import { mockLogin, shouldUseMockAuth } from '@/services/api/mock-auth';
import { ApiException } from '@/services/api/errors';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setError: (error: string) => void;
  clearError: () => void;
  initialize: () => void;
}

type AuthStore = AuthState & AuthActions;

interface LegacyLoginPayload {
  user?: unknown | undefined;
  accessToken?: unknown | undefined;
  refreshToken?: unknown | undefined;
  expiresIn?: unknown | undefined;
  tokens?: unknown | undefined;
}

type RawLoginResponse = LoginResponse | (LegacyLoginPayload & { data?: LegacyLoginPayload });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUserLike = (value: unknown): value is User =>
  isRecord(value) && typeof value.id === 'string' && typeof value.email === 'string';

const isAuthTokensLike = (value: unknown): value is AuthTokens =>
  isRecord(value) &&
  typeof value.accessToken === 'string' &&
  typeof value.refreshToken === 'string' &&
  typeof value.expiresIn === 'number';

const normalizeTokens = (payload: LegacyLoginPayload): AuthTokens | null => {
  if (payload.tokens && isAuthTokensLike(payload.tokens)) {
    return payload.tokens;
  }

  if (typeof payload.accessToken === 'string') {
    return {
      accessToken: payload.accessToken,
      refreshToken: typeof payload.refreshToken === 'string' ? payload.refreshToken : '',
      expiresIn: typeof payload.expiresIn === 'number' ? payload.expiresIn : 86400,
    };
  }

  return null;
};

const isLoginResponse = (value: unknown): value is LoginResponse =>
  isRecord(value) && isUserLike(value.user) && isAuthTokensLike(value.tokens);

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiException) {
    if (error.statusCode === 401) return 'Invalid email or password.';
    if (error.statusCode === 404) return 'Login endpoint not found. Please check backend configuration.';
    if (error.message) return error.message;
  }
  if (error instanceof Error) {
    if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
      return 'Cannot connect to server. Please ensure the backend is running.';
    }
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) return error;
  return 'Login failed. Please try again.';
};

const parseLoginResponse = (raw: RawLoginResponse): LoginResponse => {
  if (isLoginResponse(raw)) return raw;

  if (isRecord(raw) && 'data' in raw) {
    const nested = (raw as { data?: LegacyLoginPayload | undefined }).data;
    if (nested) {
      if (isLoginResponse(nested)) return nested;

      if (isRecord(nested)) {
        const tokens = normalizeTokens(nested);
        if (isUserLike(nested.user) && tokens) {
          return { user: nested.user, tokens };
        }
      }
    }
  }

  if (isRecord(raw)) {
    const tokens = normalizeTokens(raw);
    if (isUserLike(raw.user) && tokens) {
      return { user: raw.user, tokens };
    }
  }

  throw new Error('Invalid response from server');
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Initialize auth state from storage
      initialize: () => {
        const token = getAuthToken();
        const user = getUserData<User>();

        if (token && user) {
          try {
            const parts = token.split('.');
            if (parts.length !== 3) {
              clearAuthTokens();
              return;
            }

            const payloadPart = parts[1];
            if (!payloadPart) {
              clearAuthTokens();
              return;
            }
            const payload = JSON.parse(atob(payloadPart));
            const expiresAt = payload.exp * 1000;
            const now = Date.now();

            if (expiresAt < now) {
              clearAuthTokens();
              window.dispatchEvent(new CustomEvent('auth:session-expired'));
              return;
            }
          } catch {
            clearAuthTokens();
            return;
          }

          set({
            user,
            tokens: {
              accessToken: token,
              refreshToken: getRefreshToken() || '',
              expiresIn: 0,
            },
            isAuthenticated: true,
          });

          setUserContext({
            id: user.id,
            email: user.email,
            role: user.role,
          });
        }
      },

      // Login action
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          let response: LoginResponse;

          if (shouldUseMockAuth()) {
            response = await mockLogin(credentials.email, credentials.password);
          } else {
            const apiResponse = await post<RawLoginResponse>('/auth/login', credentials);
            response = parseLoginResponse(apiResponse);
          }

          const { user, tokens } = response;

          if (!user || !tokens || !tokens.accessToken) {
            throw new Error('Invalid response from server. Please ensure the backend API is running and properly configured.');
          }

          saveAuthTokens(tokens);
          setUserData(user);

          setUserContext({
            id: user.id,
            email: user.email,
            role: user.role,
          });

          set({ user, tokens, isAuthenticated: true, isLoading: false, error: null });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error);
          set({ isLoading: false, error: errorMessage, isAuthenticated: false });
          throw error;
        }
      },

      // Logout action
      logout: () => {
        // Clear tokens from storage
        clearAuthTokens();

        // Clear user context in Sentry
        clearUserContext();

        // Reset state
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
        });

        // Dispatch logout event for other parts of the app
        window.dispatchEvent(new CustomEvent('auth:logout'));
      },

      // Refresh token action
      refreshToken: async () => {
        const { tokens } = get();

        if (!tokens?.refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await post<{ accessToken: string; expiresIn: number }>(
            '/auth/refresh',
            { refreshToken: tokens.refreshToken }
          );

          const newTokens: AuthTokens = {
            accessToken: response.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: response.expiresIn,
          };

          // Save new access token
          saveAuthTokens(newTokens);

          set({ tokens: newTokens });
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
      },

      // Update user profile
      updateProfile: async (data: Partial<User>) => {
        const { user } = get();

        if (!user) {
          throw new Error('No user logged in');
        }

        set({ isLoading: true, error: null });

        try {
          const response = await post<User>(`/users/${user.id}`, data);

          // Update user in storage
          setUserData(response);

          set({
            user: response,
            isLoading: false,
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === 'string' && error.trim()
                ? error
                : 'Profile update failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Set user (for external updates)
      setUser: (user: User | null) => {
        if (user) {
          setUserData(user);
        }
        set({ user });
      },

      // Set tokens (for external updates)
      setTokens: (tokens: AuthTokens | null) => {
        if (tokens) {
          saveAuthTokens(tokens);
        }
        set({ tokens, isAuthenticated: !!tokens });
      },

      // Set error manually
      setError: (error: string) => {
        set({ error });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Listen for session expired events

