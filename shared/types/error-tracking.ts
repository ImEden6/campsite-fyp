/**
 * Error Tracking Interface
 * Provides abstraction for error tracking services like Sentry
 */

export type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: ErrorLevel;
}

export interface UserContext {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

export interface Breadcrumb {
  message: string;
  category: string;
  level?: ErrorLevel;
  data?: Record<string, unknown>;
  timestamp?: number;
}

export interface ErrorTrackerConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate?: number;
  enabled?: boolean;
}

/**
 * Interface for error tracking services
 */
export interface IErrorTracker {
  /**
   * Initialize the error tracker with configuration
   */
  initialize(config: ErrorTrackerConfig): void;

  /**
   * Capture an exception with optional context
   */
  captureException(error: Error, context?: ErrorContext): void;

  /**
   * Capture a message with level and optional context
   */
  captureMessage(message: string, level: ErrorLevel, context?: ErrorContext): void;

  /**
   * Set user context for error tracking
   */
  setUser(user: UserContext): void;

  /**
   * Clear user context (e.g., on logout)
   */
  clearUser(): void;

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void;

  /**
   * Check if error tracker is enabled
   */
  isEnabled(): boolean;
}
