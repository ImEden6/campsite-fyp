/**
 * Sentry Express integration
 * The error handler used to be a no-op, so errors never reached Sentry from Express.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const { reported, sentryMock } = vi.hoisted(() => {
  const reported: Array<{ message: string; status?: number }> = [];
  return {
    reported,
    sentryMock: {
      init: vi.fn(),
      withScope: vi.fn(),
      captureException: vi.fn(),
      close: vi.fn(async () => true),
      // Behaves like Sentry's handler: reports server errors (5xx) and passes the error on
      expressErrorHandler: vi.fn(() => (err: { message: string; statusCode?: number }, _req: unknown, _res: unknown, next: (e: unknown) => void) => {
        if ((err.statusCode ?? 500) >= 500) reported.push({ message: err.message, status: err.statusCode });
        next(err);
      }),
    },
  };
});

vi.mock('@sentry/node', () => sentryMock);
vi.mock('@sentry/profiling-node', () => ({ nodeProfilingIntegration: vi.fn() }));

import { SentryErrorTracker } from '@/services/error-tracking/sentry';
import { ConsoleErrorTracker } from '@/services/error-tracking/console';
import { hasExpressHandlers, flushErrorTracker } from '@/services/error-tracking';
import { errorHandler, ApiError } from '@/utils/errors';

const appWith = (tracker: SentryErrorTracker) => {
  const app = express();
  app.get('/server-error', () => {
    throw new ApiError(500, 'database exploded');
  });
  app.get('/client-error', () => {
    throw new ApiError(404, 'no such booking');
  });
  app.get('/ok', (_req, res) => res.json({ ok: true }));
  app.use(tracker.getErrorHandler());
  app.use(errorHandler);
  return app;
};

const enabledTracker = () => {
  const tracker = new SentryErrorTracker();
  tracker.initialize({ dsn: 'https://key@example.ingest.sentry.io/1', environment: 'test', enabled: true });
  return tracker;
};

describe('SentryErrorTracker Express handlers', () => {
  beforeEach(() => {
    reported.length = 0;
    vi.clearAllMocks();
  });

  it('reports server errors to Sentry and still answers the client normally', async () => {
    const res = await request(appWith(enabledTracker())).get('/server-error');

    expect(res.status).toBe(500);
    expect(reported).toEqual([{ message: 'database exploded', status: 500 }]);
  });

  it('does not report expected 4xx errors', async () => {
    const res = await request(appWith(enabledTracker())).get('/client-error');

    expect(res.status).toBe(404);
    expect(reported).toEqual([]);
  });

  it('leaves successful requests alone', async () => {
    const res = await request(appWith(enabledTracker())).get('/ok');

    expect(res.status).toBe(200);
    expect(reported).toEqual([]);
  });

  it('is a pass-through when Sentry is not enabled, and the client still gets the error', async () => {
    const tracker = new SentryErrorTracker(); // never initialised: disabled
    const res = await request(appWith(tracker)).get('/server-error');

    expect(res.status).toBe(500);
    expect(sentryMock.expressErrorHandler).not.toHaveBeenCalled();
  });
});

describe('error tracker helpers', () => {
  it('knows which trackers can plug into Express', () => {
    expect(hasExpressHandlers(new SentryErrorTracker())).toBe(true);
    expect(hasExpressHandlers(new ConsoleErrorTracker())).toBe(false);
  });

  it('flushes buffered events before exit, and tolerates trackers that buffer nothing', async () => {
    await flushErrorTracker(enabledTracker(), 1500);
    expect(sentryMock.close).toHaveBeenCalledWith(1500); // close() flushes, then shuts the client down

    await expect(flushErrorTracker(new ConsoleErrorTracker())).resolves.toBeUndefined();
  });
});
