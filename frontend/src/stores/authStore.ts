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
  clearError: () => void;
  initialize: () => void;
}

type AuthStore = AuthState & AuthActions;

interface LegacyLoginPayload {
  user?: unknown;
  accessToken?: unknown;
  refreshToken?: unknown;
  expiresIn?: unknown;
  tokens?: unknown;
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

const parseLoginResponse = (raw: RawLoginResponse): LoginResponse => {
  if (isLoginResponse(raw)) {
    return raw;
  }

  if (isRecord(raw) && 'data' in raw) {
    const nested = (raw as { data?: LegacyLoginPayload }).data;
    if (nested) {
      if (isLoginResponse(nested)) {
        return nested;
      }

      if (isRecord(nested)) {
        const tokens = normalizeTokens(nested);
        if (isUserLike(nested.user) && tokens) {
          return {
            user: nested.user,
            tokens,
          };
        }
      }
    }
  }

  if (isRecord(raw)) {
    const tokens = normalizeTokens(raw);
    if (isUserLike(raw.user) && tokens) {
      return {
        user: raw.user,
        tokens,
      };
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
          // Validate token format (basic check)
          try {
            // JWT tokens have 3 parts separated by dots
            const parts = token.split('.');
            if (parts.length !== 3) {
              console.warn('[AuthStore] Invalid token format, clearing auth');
              clearAuthTokens();
              return;
            }
            
            // Decode payload to check expiration
            const payloadPart = parts[1];
            if (!payloadPart) {
              console.warn('[AuthStore] Invalid token structure');
              clearAuthTokens();
              return;
            }
            const payload = JSON.parse(atob(payloadPart));
            const expiresAt = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            
            if (expiresAt < now) {
              console.warn('[AuthStore] Token expired, clearing auth');
              clearAuthTokens();
              window.dispatchEvent(new CustomEvent('auth:session-expired'));
              return;
            }
            
            console.log('[AuthStore] Token valid, expires in', Math.round((expiresAt - now) / 1000 / 60), 'minutes');
          } catch (error) {
            console.error('[AuthStore] Error validating token:', error);
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
          
          // Set user context in Sentry
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
          
          // Use mock auth if enabled or backend is unavailable
          if (shouldUseMockAuth()) {
            console.log('Using mock authentication');
            response = await mockLogin(credentials.email, credentials.password);
          } else {
            console.log('[AuthStore] Calling login API...');
            const apiResponse = await post<RawLoginResponse>('/auth/login', credentials);
            console.log('[AuthStore] API Response:', apiResponse);
            response = parseLoginResponse(apiResponse);
          }
          
          console.log('[AuthStore] Parsed response:', response);
          const { user, tokens } = response;
          console.log('[AuthStore] User:', user);
          console.log('[AuthStore] Tokens:', tokens);
          
          // Validate response structure
          if (!user || !tokens || !tokens.accessToken) {
            console.error('[AuthStore] Missing user or tokens!', { user, tokens });
            throw new Error('Invalid response from server. Please ensure the backend API is running and properly configured.');
          }
          
          // Save tokens to localStorage
          saveAuthTokens(tokens);
          setUserData(user);
          
          // Set user context in Sentry
          setUserContext({
            id: user.id,
            email: user.email,
            role: user.role,
          });
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          let errorMessage = 'Login failed. Please try again.';

          if (error instanceof ApiException) {
            if (error.statusCode === 401) {
              errorMessage = 'Invalid email or password.';
            } else if (error.statusCode === 404) {
              errorMessage = 'Login endpoint not found. Please check backend configuration.';
            } else if (error.message) {
              errorMessage = error.message;
            }
          } else if (error instanceof Error) {
            if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
              errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
            } else if (error.message.includes('Invalid response')) {
              errorMessage = error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
          } else if (typeof error === 'string' && error.trim()) {
            errorMessage = error;
          }

          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
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
if (typeof window !== 'undefined') {
  window.addEventListener('auth:session-expired', () => {
    useAuthStore.getState().logout();
  });
}
