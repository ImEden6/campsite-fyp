import React from 'react';

// Lazy load Sentry - only import when needed
let Sentry: typeof import('@sentry/react') | null = null;
let isInitialized = false;

/**
 * Lazy load and initialize Sentry only when an error occurs
 */
const lazyInitSentry = async () => {
  if (isInitialized || Sentry) return Sentry;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_ENV || 'development';
  const release = import.meta.env.VITE_APP_VERSION || '1.0.0';

  // Only initialize if DSN is provided and not in development
  if (!dsn || environment === 'development') {
    console.log('Sentry not initialized (development mode or missing DSN)');
    return null;
  }

  try {
    // Dynamically import Sentry only when needed
    Sentry = await import('@sentry/react');
    
    Sentry.init({
      dsn,
      environment,
      release: `campsite-frontend@${release}`,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Use tunnel route for privacy (bypasses ad blockers)
      tunnel: '/api/sentry-tunnel',
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Error filtering
      beforeSend(event, hint) {
        // Filter out certain errors
        const error = hint.originalException;
        
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message);
          
          // Ignore network errors that are expected
          if (message.includes('Network Error') || message.includes('timeout')) {
            return null;
          }
          
          // Ignore cancelled requests
          if (message.includes('cancelled') || message.includes('aborted')) {
            return null;
          }
        }
        
        return event;
      },
      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        // Random plugins/extensions
        'Can\'t find variable: ZiteReader',
        'jigsaw is not defined',
        'ComboSearch is not defined',
        // Network errors
        'NetworkError',
        'Failed to fetch',
        // ResizeObserver errors (benign)
        'ResizeObserver loop limit exceeded',
      ],
    });

    isInitialized = true;
    console.log('Sentry initialized successfully (lazy loaded)');
    return Sentry;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    return null;
  }
};

/**
 * Initialize Sentry error tracking (lazy - only loads when error occurs)
 * This function is called early but doesn't actually load Sentry until needed
 */
export const initSentry = () => {
  // Don't load Sentry immediately - wait for first error
  // This keeps Sentry out of the initial bundle
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    console.log('Sentry will be lazy loaded on first error');
  }
};

/**
 * Capture an exception with additional context (lazy loads Sentry if needed)
 */
export const captureException = async (
  error: Error,
  context?: Record<string, unknown>
): Promise<string | null> => {
  const sentry = await lazyInitSentry();
  if (!sentry) return null;
  
  if (context) {
    sentry.setContext('additional', context);
  }
  return sentry.captureException(error) || null;
};

/**
 * Capture a message with level (lazy loads Sentry if needed)
 */
export const captureMessage = async (
  message: string,
  level: 'info' | 'warning' | 'error' | 'debug' | 'fatal' = 'info',
  context?: Record<string, unknown>
) => {
  const sentry = await lazyInitSentry();
  if (!sentry) return;
  
  if (context) {
    sentry.setContext('additional', context);
  }
  sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking (lazy loads Sentry if needed)
 */
export const setUserContext = async (user: {
  id: string;
  email?: string;
  role?: string;
}) => {
  const sentry = await lazyInitSentry();
  if (!sentry) return;
  
  sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

/**
 * Clear user context (on logout) (lazy loads Sentry if needed)
 */
export const clearUserContext = async () => {
  const sentry = await lazyInitSentry();
  if (!sentry) return;
  
  sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging (lazy loads Sentry if needed)
 */
export const addBreadcrumb = async (
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' | 'debug' | 'fatal' = 'info',
  data?: Record<string, unknown>
) => {
  const sentry = await lazyInitSentry();
  if (!sentry) return;
  
  sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
};

/**
 * Get Sentry ErrorBoundary component (lazy loads Sentry if needed)
 * Note: This returns a promise, so use it with React.lazy or Suspense
 */
export const getErrorBoundary = async () => {
  const sentry = await lazyInitSentry();
  return sentry?.ErrorBoundary || null;
};

/**
 * Simple fallback error boundary that lazy loads Sentry
 */
class ErrorBoundaryFallback extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error) {
    this.props.onError(error);
    // Trigger lazy Sentry load
    lazyInitSentry().then((sentry) => {
      if (sentry) {
        sentry.captureException(error);
      }
    });
  }

  override render() {
    if (this.state.hasError) {
      return React.createElement('div', null, 'Something went wrong');
    }
    return this.props.children;
  }
}

/**
 * ErrorBoundary wrapper that lazy loads Sentry
 * For now, use the fallback - Sentry ErrorBoundary will be loaded on first error
 */
export const ErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  beforeCapture?: (scope: unknown, error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ children, fallback }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((e: Error) => {
    setError(e);
    setHasError(true);
    // Trigger lazy Sentry load
    lazyInitSentry().then((sentry) => {
      if (sentry) {
        sentry.captureException(e);
      }
    });
  }, []);

  if (hasError && error) {
    return fallback || React.createElement('div', null, `Something went wrong: ${error.message}`);
  }

  return React.createElement(ErrorBoundaryFallback, { onError: handleError, children });
};

// Re-export for compatibility
export default { lazyInitSentry, captureException, captureMessage };
