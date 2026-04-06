/**
 * Error Tracking Service
 * Factory for creating error tracker instances
 */

import { IErrorTracker, ErrorTrackerConfig } from '@campsite-management/shared';
import { SentryErrorTracker } from './sentry';
import { ConsoleErrorTracker } from './console';
import { config } from '@/config';

let errorTrackerInstance: IErrorTracker | null = null;

/**
 * Get or create error tracker instance
 */
export function getErrorTracker(): IErrorTracker {
  if (!errorTrackerInstance) {
    errorTrackerInstance = createErrorTracker();
  }
  return errorTrackerInstance;
}

/**
 * Create error tracker based on configuration
 */
function createErrorTracker(): IErrorTracker {
  const trackerConfig: ErrorTrackerConfig = {
    dsn: config.monitoring.sentry.dsn || '',
    environment: config.monitoring.sentry.environment,
    ...(process.env.npm_package_version && { release: process.env.npm_package_version }),
    ...(config.monitoring.sentry.tracesSampleRate !== undefined && { sampleRate: config.monitoring.sentry.tracesSampleRate }),
    enabled: config.monitoring.sentry.enabled,
  };

  // Use Sentry if DSN is provided and enabled
  if (trackerConfig.dsn && trackerConfig.enabled) {
    const tracker = new SentryErrorTracker();
    tracker.initialize(trackerConfig);
    return tracker;
  }

  // Fallback to console tracker
  const tracker = new ConsoleErrorTracker();
  tracker.initialize(trackerConfig);
  return tracker;
}

/**
 * Initialize error tracking
 */
export function initializeErrorTracking(): IErrorTracker {
  const tracker = getErrorTracker();
  console.log(`Error tracking initialized: ${tracker.isEnabled() ? 'enabled' : 'disabled'}`);
  return tracker;
}

export { SentryErrorTracker } from './sentry';
export { ConsoleErrorTracker } from './console';
