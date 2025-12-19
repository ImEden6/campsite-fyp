/**
 * Error Tracking Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConsoleErrorTracker } from '../console';
import { ErrorTrackerConfig } from '@campsite/shared';

describe('Error Tracking Service', () => {
  let tracker: ConsoleErrorTracker;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
  });

  describe('ConsoleErrorTracker', () => {
    it('should initialize successfully', () => {
      const config: ErrorTrackerConfig = {
        dsn: '',
        environment: 'test',
        enabled: true,
      };

      tracker.initialize(config);
      expect(tracker.isEnabled()).toBe(true);
    });

    it('should be disabled when enabled is false', () => {
      const config: ErrorTrackerConfig = {
        dsn: '',
        environment: 'test',
        enabled: false,
      };

      tracker.initialize(config);
      expect(tracker.isEnabled()).toBe(false);
    });

    it('should capture exception', () => {
      const config: ErrorTrackerConfig = {
        dsn: '',
        environment: 'test',
        enabled: true,
      };

      tracker.initialize(config);

      const error = new Error('Test error');
      expect(() => {
        tracker.captureException(error, {
          tags: { test: 'true' },
          extra: { data: 'test data' },
        });
      }).not.toThrow();
    });

    it('should capture message', () => {
      const config: ErrorTrackerConfig = {
        dsn: '',
        environment: 'test',
        enabled: true,
      };

      tracker.initialize(config);

      expect(() => {
        tracker.captureMessage('Test message', 'info', {
          tags: { test: 'true' },
        });
      }).not.toThrow();
    });

    it('should set and clear user context', () => {
      const config: ErrorTrackerConfig = {
        dsn: '',
        environment: 'test',
        enabled: true,
      };

      tracker.initialize(config);

      expect(() => {
        tracker.setUser({
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin',
        });
      }).not.toThrow();

      expect(() => {
        tracker.clearUser();
      }).not.toThrow();
    });

    it('should add breadcrumbs', () => {
      const config: ErrorTrackerConfig = {
        dsn: '',
        environment: 'test',
        enabled: true,
      };

      tracker.initialize(config);

      expect(() => {
        tracker.addBreadcrumb({
          message: 'Test breadcrumb',
          category: 'test',
          level: 'info',
          data: { test: 'data' },
        });
      }).not.toThrow();

      const breadcrumbs = tracker.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].message).toBe('Test breadcrumb');
    });

    it('should not capture when disabled', () => {
      const config: ErrorTrackerConfig = {
        dsn: '',
        environment: 'test',
        enabled: false,
      };

      tracker.initialize(config);

      const error = new Error('Test error');
      expect(() => {
        tracker.captureException(error);
      }).not.toThrow();

      expect(() => {
        tracker.captureMessage('Test message', 'info');
      }).not.toThrow();
    });
  });
});
