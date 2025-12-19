// Logging Utility for Campsite Management System

import winston from 'winston';
import path from 'path';
import { config } from '@/config';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [];

// Console transport
if (config.server.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transport
transports.push(
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: config.logging.maxFileSize,
    maxFiles: config.logging.maxFiles,
  })
);

// Combined log file
transports.push(
  new winston.transports.File({
    filename: path.join(process.cwd(), config.logging.file),
    format: fileFormat,
    maxsize: config.logging.maxFileSize,
    maxFiles: config.logging.maxFiles,
  })
);

// Rotating file transport for production
if (config.server.nodeEnv === 'production') {
  const DailyRotateFile = require('winston-daily-rotate-file');
  
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'application-%DATE%.log'),
      datePattern: config.logging.datePattern,
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: winston.format.timestamp(),
  transports,
  exitOnError: false,
});

// Logger methods with additional functionality
export const loggerMethods = {
  error: (message: string, error?: any, metadata?: any) => {
    if (error instanceof Error) {
      logger.error(message, {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        metadata,
      });
      
      // Send to error tracking service
      try {
        import('../services/error-tracking').then(({ getErrorTracker }) => {
          const tracker = getErrorTracker();
          tracker.captureException(error, {
            tags: { source: 'logger' },
            extra: { message, metadata },
            level: 'error',
          });
        }).catch(() => {
          // Silently fail if error tracking is not available
        });
      } catch {
        // Silently fail
      }
    } else {
      logger.error(message, { error, metadata });
    }
  },

  warn: (message: string, metadata?: any) => {
    logger.warn(message, { metadata });
  },

  info: (message: string, metadata?: any) => {
    logger.info(message, { metadata });
  },

  http: (message: string, metadata?: any) => {
    logger.http(message, { metadata });
  },

  debug: (message: string, metadata?: any) => {
    logger.debug(message, { metadata });
  },

  // Database operations
  dbQuery: (query: string, params?: any, duration?: number) => {
    logger.debug('Database Query', {
      query,
      params,
      duration: duration ? `${duration}ms` : undefined,
    });
  },

  dbError: (message: string, error: any, query?: string) => {
    logger.error('Database Error', {
      message,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      query,
    });
  },

  // Authentication operations
  authSuccess: (userId: string, userAgent?: string, ip?: string) => {
    logger.info('Authentication Success', {
      userId,
      userAgent,
      ip,
    });
  },

  authFailure: (email: string, reason: string, userAgent?: string, ip?: string) => {
    logger.warn('Authentication Failure', {
      email,
      reason,
      userAgent,
      ip,
    });
  },

  // API operations
  apiRequest: (method: string, url: string, userId?: string, duration?: number) => {
    logger.http('API Request', {
      method,
      url,
      userId,
      duration: duration ? `${duration}ms` : undefined,
    });
  },

  apiError: (method: string, url: string, error: any, userId?: string) => {
    logger.error('API Error', {
      method,
      url,
      userId,
      error: {
        message: error.message,
        stack: error.stack,
        status: error.status,
      },
    });
  },

  // Business operations
  bookingCreated: (bookingId: string, userId: string, siteId: string) => {
    logger.info('Booking Created', {
      bookingId,
      userId,
      siteId,
    });
  },

  bookingCancelled: (bookingId: string, userId: string, reason?: string) => {
    logger.info('Booking Cancelled', {
      bookingId,
      userId,
      reason,
    });
  },

  paymentProcessed: (paymentId: string, bookingId: string, amount: number, method: string) => {
    logger.info('Payment Processed', {
      paymentId,
      bookingId,
      amount,
      method,
    });
  },

  paymentFailed: (bookingId: string, amount: number, error: any) => {
    logger.error('Payment Failed', {
      bookingId,
      amount,
      error: {
        message: error.message,
        code: error.code,
      },
    });
  },

  // Security operations
  securityAlert: (type: string, details: any, userId?: string, ip?: string) => {
    logger.warn('Security Alert', {
      type,
      details,
      userId,
      ip,
    });
  },

  rateLimitHit: (ip: string, endpoint: string, limit: number) => {
    logger.warn('Rate Limit Hit', {
      ip,
      endpoint,
      limit,
    });
  },

  // System operations
  systemStart: (port: number, environment: string) => {
    logger.info('System Started', {
      port,
      environment,
      timestamp: new Date().toISOString(),
    });
  },

  systemShutdown: (reason?: string) => {
    logger.info('System Shutdown', {
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  // Email operations
  emailSent: (to: string, subject: string, template?: string) => {
    logger.info('Email Sent', {
      to,
      subject,
      template,
    });
  },

  emailFailed: (to: string, subject: string, error: any) => {
    logger.error('Email Failed', {
      to,
      subject,
      error: {
        message: error.message,
        code: error.code,
      },
    });
  },

  // SMS operations
  smsSent: (to: string, message: string) => {
    logger.info('SMS Sent', {
      to,
      messageLength: message.length,
    });
  },

  smsFailed: (to: string, error: any) => {
    logger.error('SMS Failed', {
      to,
      error: {
        message: error.message,
        code: error.code,
      },
    });
  },

  // File operations
  fileUploaded: (filename: string, size: number, userId: string) => {
    logger.info('File Uploaded', {
      filename,
      size,
      userId,
    });
  },

  fileUploadFailed: (filename: string, error: any, userId?: string) => {
    logger.error('File Upload Failed', {
      filename,
      userId,
      error: {
        message: error.message,
        code: error.code,
      },
    });
  },

  // Cache operations
  cacheHit: (key: string, ttl?: number) => {
    logger.debug('Cache Hit', {
      key,
      ttl,
    });
  },

  cacheMiss: (key: string) => {
    logger.debug('Cache Miss', {
      key,
    });
  },

  cacheSet: (key: string, ttl: number) => {
    logger.debug('Cache Set', {
      key,
      ttl,
    });
  },

  // Job operations
  jobStarted: (jobName: string, jobId: string, data?: any) => {
    logger.info('Job Started', {
      jobName,
      jobId,
      data,
    });
  },

  jobCompleted: (jobName: string, jobId: string, duration?: number) => {
    logger.info('Job Completed', {
      jobName,
      jobId,
      duration: duration ? `${duration}ms` : undefined,
    });
  },

  jobFailed: (jobName: string, jobId: string, error: any) => {
    logger.error('Job Failed', {
      jobName,
      jobId,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  },

  // External API operations
  externalApiCall: (service: string, endpoint: string, method: string, duration?: number) => {
    logger.info('External API Call', {
      service,
      endpoint,
      method,
      duration: duration ? `${duration}ms` : undefined,
    });
  },

  externalApiError: (service: string, endpoint: string, error: any) => {
    logger.error('External API Error', {
      service,
      endpoint,
      error: {
        message: error.message,
        status: error.status,
        response: error.response?.data,
      },
    });
  },
};

// Stream for Morgan middleware
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Export combined logger
export { logger };
export default { ...logger, ...loggerMethods };
