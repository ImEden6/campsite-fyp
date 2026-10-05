/**
 * Error Tracking Service
 * Factory for creating error tracker instances
 */

import { IErrorTracker, ErrorTrackerConfig } from '@campsite-management/shared';
import { SentryErrorTracker } from './sentry';
import { ConsoleErrorTracker } from './console';
import { config } from '@/config';
import type { ErrorRequestHandler, RequestHandler } from 'express';

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

/** Trackers that can plug into Express (Sentry); the console tracker cannot. */
export interface ExpressErrorTracking {
  getRequestHandler(): RequestHandler;
  getErrorHandler(): ErrorRequestHandler;
}

export function hasExpressHandlers(tracker: IErrorTracker): tracker is IErrorTracker & ExpressErrorTracking {
  const candidate = tracker as Partial<ExpressErrorTracking>;
  return typeof candidate.getRequestHandler === 'function' && typeof candidate.getErrorHandler === 'function';
}

/** Flush buffered events before exit, if the tracker buffers any. */
export async function flushErrorTracker(tracker: IErrorTracker, timeoutMs = 2000): Promise<void> {
  const candidate = tracker as { flush?: (timeout?: number) => Promise<boolean> };
  if (typeof candidate.flush === 'function') {
    await candidate.flush(timeoutMs);
  }
}
