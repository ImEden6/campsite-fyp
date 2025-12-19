/**
 * Error Tracking Types
 * Local copy to avoid @campsite/shared dependency issues with ts-node
 */

export type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
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
  data?: Record<string, any>;
  timestamp?: number;
}

export interface ErrorTrackerConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate?: number;
  enabled?: boolean;
}

export interface IErrorTracker {
  initialize(config: ErrorTrackerConfig): void;
  captureException(error: Error, context?: ErrorContext): void;
  captureMessage(message: string, level: ErrorLevel, context?: ErrorContext): void;
  setUser(user: UserContext): void;
  clearUser(): void;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  isEnabled(): boolean;
}
