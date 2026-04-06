/**
 * Sentry Error Tracker Implementation
 * Provides error tracking using Sentry service
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type {
  IErrorTracker,
  ErrorTrackerConfig,
  ErrorContext,
  UserContext,
  Breadcrumb,
  ErrorLevel,
} from '@campsite-management/shared';

export class SentryErrorTracker implements IErrorTracker {
  private enabled: boolean = false;

  initialize(config: ErrorTrackerConfig): void {
    if (!config.dsn || config.enabled === false) {
      console.log('Sentry not initialized (disabled or missing DSN)');
      this.enabled = false;
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
        tracesSampleRate: config.sampleRate || 0.1,
        profilesSampleRate: config.sampleRate || 0.1,
        integrations: [
          nodeProfilingIntegration(),
        ],
        beforeSend(event, hint) {
          // Filter out certain errors
          const error = hint.originalException;
          
          if (error && typeof error === 'object' && 'message' in error) {
            const message = String(error.message);
            
            // Ignore expected errors
            if (message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT')) {
              return null;
            }
          }
          
          return event;
        },
      });

      this.enabled = true;
      console.log('Sentry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
      this.enabled = false;
    }
  }

  captureException(error: Error, context?: ErrorContext): void {
    if (!this.enabled) return;

    try {
      Sentry.withScope((scope) => {
        if (context?.level) {
          scope.setLevel(this.mapErrorLevel(context.level));
        }

        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        if (context?.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }

        Sentry.captureException(error);
      });
    } catch (err) {
      console.error('Failed to capture exception in Sentry:', err);
    }
  }

  captureMessage(message: string, level: ErrorLevel, context?: ErrorContext): void {
    if (!this.enabled) return;

    try {
      Sentry.withScope((scope) => {
        scope.setLevel(this.mapErrorLevel(level));

        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        if (context?.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }

        Sentry.captureMessage(message, this.mapErrorLevel(level));
      });
    } catch (err) {
      console.error('Failed to capture message in Sentry:', err);
    }
  }

  setUser(user: UserContext): void {
    if (!this.enabled) return;

    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });
    } catch (err) {
      console.error('Failed to set user in Sentry:', err);
    }
  }

  clearUser(): void {
    if (!this.enabled) return;

    try {
      Sentry.setUser(null);
    } catch (err) {
      console.error('Failed to clear user in Sentry:', err);
    }
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    if (!this.enabled) return;

    try {
      Sentry.addBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category,
        level: breadcrumb.level ? this.mapErrorLevel(breadcrumb.level) : 'info',
        data: breadcrumb.data,
        timestamp: breadcrumb.timestamp,
      });
    } catch (err) {
      console.error('Failed to add breadcrumb in Sentry:', err);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Map our error level to Sentry severity level
   */
  private mapErrorLevel(level: ErrorLevel): Sentry.SeverityLevel {
    const levelMap: Record<ErrorLevel, Sentry.SeverityLevel> = {
      fatal: 'fatal',
      error: 'error',
      warning: 'warning',
      info: 'info',
      debug: 'debug',
    };

    return levelMap[level] || 'error';
  }

  /**
   * Get Sentry request handler middleware
   */
  getRequestHandler() {
    if (!this.enabled) {
      return (req: any, res: any, next: any) => next();
    }
    // Sentry v8+ uses different API
    return (req: any, res: any, next: any) => next();
  }

  /**
   * Get Sentry error handler middleware
   */
  getErrorHandler() {
    if (!this.enabled) {
      return (err: any, req: any, res: any, next: any) => next(err);
    }
    // Sentry v8+ uses different API
    return (err: any, req: any, res: any, next: any) => next(err);
  }

  /**
   * Flush pending events (useful for graceful shutdown)
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.enabled) return true;

    try {
      return await Sentry.close(timeout);
    } catch (err) {
      console.error('Failed to flush Sentry:', err);
      return false;
    }
  }
}
