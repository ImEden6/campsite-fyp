/**
 * Console Error Tracker Implementation
 * Fallback error tracker that logs to console
 */

import {
  IErrorTracker,
  ErrorTrackerConfig,
  ErrorContext,
  UserContext,
  Breadcrumb,
  ErrorLevel,
} from '@campsite-management/shared';

export class ConsoleErrorTracker implements IErrorTracker {
  private enabled: boolean = false;
  private currentUser: UserContext | null = null;
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs: number = 100;

  initialize(config: ErrorTrackerConfig): void {
    this.enabled = config.enabled !== false;
    
    if (this.enabled) {
      console.log(`Console Error Tracker initialized (${config.environment})`);
    }
  }

  captureException(error: Error, context?: ErrorContext): void {
    if (!this.enabled) return;

    const level = context?.level || 'error';
    const timestamp = new Date().toISOString();

    console.error(`[${level.toUpperCase()}] ${timestamp}:`, error.message);
    console.error('Stack:', error.stack);

    if (context?.tags) {
      console.error('Tags:', context.tags);
    }

    if (context?.extra) {
      console.error('Extra:', context.extra);
    }

    if (this.currentUser) {
      console.error('User:', {
        id: this.currentUser.id,
        email: this.currentUser.email,
        role: this.currentUser.role,
      });
    }

    if (this.breadcrumbs.length > 0) {
      console.error('Recent breadcrumbs:', this.breadcrumbs.slice(-5));
    }
  }

  captureMessage(message: string, level: ErrorLevel, context?: ErrorContext): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const logMethod = this.getLogMethod(level);

    logMethod(`[${level.toUpperCase()}] ${timestamp}:`, message);

    if (context?.tags) {
      logMethod('Tags:', context.tags);
    }

    if (context?.extra) {
      logMethod('Extra:', context.extra);
    }

    if (this.currentUser) {
      logMethod('User:', {
        id: this.currentUser.id,
        email: this.currentUser.email,
        role: this.currentUser.role,
      });
    }
  }

  setUser(user: UserContext): void {
    if (!this.enabled) return;

    this.currentUser = user;
    console.log('User context set:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  clearUser(): void {
    if (!this.enabled) return;

    this.currentUser = null;
    console.log('User context cleared');
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    if (!this.enabled) return;

    const enrichedBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
    };

    this.breadcrumbs.push(enrichedBreadcrumb);

    // Trim breadcrumbs if exceeding max
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    console.debug(`[BREADCRUMB] ${breadcrumb.category}:`, breadcrumb.message, breadcrumb.data);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get appropriate console method based on error level
   */
  private getLogMethod(level: ErrorLevel): typeof console.log {
    switch (level) {
      case 'fatal':
      case 'error':
        return console.error;
      case 'warning':
        return console.warn;
      case 'info':
        return console.info;
      case 'debug':
        return console.debug;
      default:
        return console.log;
    }
  }

  /**
   * Get all breadcrumbs (useful for debugging)
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}
