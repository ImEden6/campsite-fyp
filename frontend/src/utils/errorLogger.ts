/**
 * Error Logger Utility
 * Provides centralized error logging for debugging and monitoring
 */

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  TRANSFORM = 'transform',
  CLIPBOARD = 'clipboard',
  HISTORY = 'history',
  PROPERTY = 'property',
  NETWORK = 'network',
  RENDER = 'render',
  STATE = 'state',
  UNKNOWN = 'unknown',
}

export interface ErrorLogEntry {
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  details?: unknown;
  stack?: string;
  userId?: string;
  sessionId?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs: number = 1000;
  private sessionId: string;
  private enableConsoleOutput: boolean = true;
  private enableRemoteLogging: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an error
   */
  log(
    severity: ErrorSeverity,
    category: ErrorCategory,
    message: string,
    details?: unknown,
    error?: Error
  ): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      severity,
      category,
      message,
      details,
      stack: error?.stack,
      sessionId: this.sessionId,
    };

    // Add to in-memory logs
    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    if (this.enableConsoleOutput) {
      this.logToConsole(entry);
    }

    // Remote logging (if enabled)
    if (this.enableRemoteLogging) {
      this.logToRemote(entry);
    }
  }

  /**
   * Log to browser console
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = `[${entry.category.toUpperCase()}]`;
    const timestamp = entry.timestamp.toISOString();

    switch (entry.severity) {
      case ErrorSeverity.INFO:
        console.info(`${prefix} ${timestamp}:`, entry.message, entry.details);
        break;
      case ErrorSeverity.WARNING:
        console.warn(`${prefix} ${timestamp}:`, entry.message, entry.details);
        break;
      case ErrorSeverity.ERROR:
        console.error(`${prefix} ${timestamp}:`, entry.message, entry.details);
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`${prefix} CRITICAL ${timestamp}:`, entry.message, entry.details);
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
    }
  }

  /**
   * Log to remote service (Sentry integration)
   */
  private logToRemote(entry: ErrorLogEntry): void {
    // Only send ERROR and CRITICAL severity to Sentry
    if (entry.severity === ErrorSeverity.CRITICAL || entry.severity === ErrorSeverity.ERROR) {
      try {
        // Import Sentry dynamically to avoid issues if not initialized
        import('@/config/sentry')
          .then((sentryModule) => {
            const { captureException, captureMessage } = sentryModule;
            if (entry.stack) {
              // If we have a stack trace, create an Error object
              const error = new Error(entry.message);
              error.stack = entry.stack;
              captureException(error, {
                category: entry.category,
                severity: entry.severity,
                details: entry.details,
                sessionId: entry.sessionId,
              });
            } else {
              // Otherwise, capture as a message
              const level = entry.severity === ErrorSeverity.CRITICAL ? 'fatal' : 'error';
              captureMessage(entry.message, level, {
                category: entry.category,
                details: entry.details,
                sessionId: entry.sessionId,
              });
            }
          })
          .catch((err: unknown) => {
            console.error('Failed to send error to Sentry:', err);
          });
      } catch (err) {
        console.error('Failed to import Sentry:', err);
      }
    }
  }

  /**
   * Log info message
   */
  info(category: ErrorCategory, message: string, details?: unknown): void {
    this.log(ErrorSeverity.INFO, category, message, details);
  }

  /**
   * Log warning message
   */
  warn(category: ErrorCategory, message: string, details?: unknown): void {
    this.log(ErrorSeverity.WARNING, category, message, details);
  }

  /**
   * Log error message
   */
  error(category: ErrorCategory, message: string, details?: unknown, error?: Error): void {
    this.log(ErrorSeverity.ERROR, category, message, details, error);
  }

  /**
   * Log critical error message
   */
  critical(category: ErrorCategory, message: string, details?: unknown, error?: Error): void {
    this.log(ErrorSeverity.CRITICAL, category, message, details, error);
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: ErrorSeverity): ErrorLogEntry[] {
    return this.logs.filter(log => log.severity === severity);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: ErrorCategory): ErrorLogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Enable/disable console output
   */
  setConsoleOutput(enabled: boolean): void {
    this.enableConsoleOutput = enabled;
  }

  /**
   * Enable/disable remote logging
   */
  setRemoteLogging(enabled: boolean): void {
    this.enableRemoteLogging = enabled;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Export singleton instance
export default errorLogger;

// Export convenience functions
export const logInfo = (category: ErrorCategory, message: string, details?: unknown) => {
  errorLogger.info(category, message, details);
};

export const logWarning = (category: ErrorCategory, message: string, details?: unknown) => {
  errorLogger.warn(category, message, details);
};

export const logError = (category: ErrorCategory, message: string, details?: unknown, error?: Error) => {
  errorLogger.error(category, message, details, error);
};

export const logCritical = (category: ErrorCategory, message: string, details?: unknown, error?: Error) => {
  errorLogger.critical(category, message, details, error);
};
