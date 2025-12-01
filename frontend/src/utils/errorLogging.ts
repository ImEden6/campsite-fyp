import { ErrorInfo } from 'react';
import { isAxiosError } from 'axios';

type ErrorContext = Record<string, unknown>;

/**
 * Error logging utility for integration with error tracking services
 */
class ErrorLogger {
  private isInitialized = false;
  private isDevelopment = import.meta.env.DEV;

  /**
   * Initialize error logging service
   * Call this in your app's entry point (main.tsx)
   */
  init(): void {
    if (this.isInitialized) {
      console.warn('ErrorLogger already initialized');
      return;
    }

    // Sentry is initialized in main.tsx via initSentry()
    // This method is kept for backward compatibility
    this.isInitialized = true;
    
    if (this.isDevelopment) {
      console.log('ErrorLogger initialized (development mode)');
    }
  }

  /**
   * Log a caught error
   */
  logError(error: Error, context?: ErrorContext): void {
    if (this.isDevelopment) {
      console.error('Error logged:', error, context);
    }

    // Send to Sentry
    import('@/config/sentry')
      .then(({ captureException }) => {
        captureException(error, context);
      })
      .catch((err: unknown) => {
        console.error('Failed to send error to Sentry:', err);
      });
  }

  /**
   * Log a React error boundary error
   */
  logReactError(error: Error, errorInfo: ErrorInfo, context?: ErrorContext): void {
    if (this.isDevelopment) {
      console.error('React error logged:', error, errorInfo, context);
    }

    // Send to Sentry with React context
    import('@sentry/react')
      .then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
            custom: context,
          },
        });
      })
      .catch((err: unknown) => {
        console.error('Failed to send React error to Sentry:', err);
      });
  }

  /**
   * Log a message (non-error)
   */
  logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (this.isDevelopment) {
      const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
      logFn('Message logged:', message, context);
    }

    // Send to Sentry
    import('@/config/sentry')
      .then(({ captureMessage }) => {
        captureMessage(message, level, context);
      })
      .catch((err: unknown) => {
        console.error('Failed to send message to Sentry:', err);
      });
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; username?: string } | null): void {
    if (this.isDevelopment) {
      console.log('User context set:', user);
    }

    // Set user context in Sentry
    import('@/config/sentry')
      .then(({ setUserContext, clearUserContext }) => {
        if (user) {
          setUserContext({ id: user.id, email: user.email, role: user.username ?? undefined });
        } else {
          clearUserContext();
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to set user context in Sentry:', err);
      });
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category?: string, data?: ErrorContext): void {
    if (this.isDevelopment) {
      console.log('Breadcrumb added:', { message, category, data });
    }

    // Add breadcrumb to Sentry
    import('@/config/sentry')
      .then(({ addBreadcrumb }) => {
        addBreadcrumb(message, category || 'custom', 'info', data);
      })
      .catch((err: unknown) => {
        console.error('Failed to add breadcrumb to Sentry:', err);
      });
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Helper function to log API errors
export const logApiError = (error: unknown, endpoint: string): void => {
  const context: ErrorContext = {
    endpoint,
  };

  if (isAxiosError(error)) {
    context.status = error.response?.status;
    context.statusText = error.response?.statusText;
    context.data = error.response?.data;
  }

  const normalizedError = error instanceof Error ? error : new Error('Unknown API error');
  errorLogger.logError(normalizedError, context);
};

// Helper function to log network errors
export const logNetworkError = (error: Error): void => {
  errorLogger.logError(error, { type: 'network' });
};

// Helper function to log validation errors
export const logValidationError = (errors: Record<string, string>, formName: string): void => {
  errorLogger.logMessage(
    `Validation errors in ${formName}`,
    'warning',
    { errors, formName }
  );
};
