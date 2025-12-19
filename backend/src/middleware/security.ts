// Security Middleware

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import crypto from 'crypto';
import { config } from '@/config';
import logger from '@/utils/logger';
import { RateLimitError } from '@/utils/errors';

// ============================================================
// Rate Limiting Key Generator
// Order: userId -> IP (only if trust proxy set, never trust X-Forwarded-For directly)
// ============================================================

const getClientIdentifier = (req: Request): string => {
  // Authenticated user takes priority
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  // Use req.ip which respects trust proxy setting
  return `ip:${req.ip || 'unknown'}`;
};

// Hash the key for logging (avoid logging raw IPs/user IDs)
const hashKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 12);
};

// ============================================================
// Rate Limiting Factory
// ============================================================

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  limiterName: string;
}

export const createRateLimit = (opts: RateLimitOptions) => {
  // Check feature flag
  if (config.features?.enableRateLimiting === false) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    message: opts.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIdentifier,
    skipSuccessfulRequests: opts.skipSuccessfulRequests ?? false,
    handler: (req: Request, res: Response, next: NextFunction) => {
      const key = getClientIdentifier(req);
      logger.warn('Rate limit exceeded', {
        limiter: opts.limiterName,
        endpoint: req.path,
        method: req.method,
        keyHash: hashKey(key),
      });
      next(new RateLimitError(opts.message || 'Too many requests'));
    },
    skip: (req: Request) => {
      // Skip rate limiting for admin users in development
      if (config.server.nodeEnv === 'development' && req.user?.role === 'ADMIN') {
        return true;
      }
      return false;
    },
  });
};

// ============================================================
// Predefined Rate Limiters
// ============================================================

// General rate limiting
export const generalRateLimit = createRateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: 'Too many requests from this IP, please try again later',
  limiterName: 'general',
});

// Strict rate limiting for login (skip successful to prevent lockout)
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
  limiterName: 'auth',
});

// Rate limiting for registration
export const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: 'Too many registration attempts, please try again later',
  limiterName: 'register',
});

// Rate limiting for password reset (skip successful)
export const passwordResetRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts
  message: 'Too many password reset attempts, please try again later',
  skipSuccessfulRequests: true,
  limiterName: 'password_reset',
});

// Rate limiting for file uploads
export const uploadRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads
  message: 'Too many file uploads, please try again later',
  limiterName: 'upload',
});

// Rate limiting for payment processing
export const paymentRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 payments
  message: 'Too many payment attempts, please try again later',
  limiterName: 'payment',
});

// Rate limiting for booking creation
export const bookingRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 bookings
  message: 'Too many booking attempts, please try again later',
  limiterName: 'booking',
});

// Helmet security configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
});

// CORS configuration
export const corsConfig = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      config.security.corsOrigin,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001',
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.securityAlert('CORS violation', { origin }, undefined, origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Forwarded-For',
    'X-Real-IP',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'Link',
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = req.user?.id;

    logger.apiRequest(req.method, req.path, userId, duration);

    // Log potentially suspicious activity
    if (res.statusCode >= 400) {
      logger.apiError(req.method, req.path, {
        message: `HTTP ${res.statusCode}`,
        status: res.statusCode,
      }, userId);
    }
  });

  next();
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!allowedIPs.includes(clientIP)) {
      logger.securityAlert('IP not whitelisted', { clientIP, allowedIPs }, undefined, clientIP);
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
          code: 'IP_NOT_ALLOWED',
        },
      });
      return;
    }

    next();
  };
};

// User-Agent validation middleware
export const validateUserAgent = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent');

  if (!userAgent) {
    logger.securityAlert('Missing User-Agent header', {
      ip: req.ip,
      path: req.path,
    }, undefined, req.ip);
  }

  // Check for suspicious user agents
  const suspiciousPatterns = [
    /curl/i,
    /wget/i,
    /python/i,
    /bot/i,
    /crawler/i,
    /spider/i,
  ];

  if (userAgent && suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.securityAlert('Suspicious User-Agent detected', {
      userAgent,
      ip: req.ip,
      path: req.path,
    }, undefined, req.ip);
  }

  next();
};

// Request size limiting middleware
export const requestSizeLimit = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);

    if (contentLength > maxSize) {
      logger.securityAlert('Request size exceeded', {
        contentLength,
        maxSize,
        ip: req.ip,
        path: req.path,
      }, undefined, req.ip);

      res.status(413).json({
        success: false,
        error: {
          message: 'Request entity too large',
          code: 'REQUEST_TOO_LARGE',
        },
      });
      return;
    }

    next();
  };
};

// SQL injection detection middleware
export const sqlInjectionDetection = (req: Request, res: Response, next: NextFunction): void => {
  const sqlPatterns = [
    /(%27)|(')|(--)|(%23)|(#)/i,
    /((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))/i,
    /\w*((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))/i,
    /((%27)|('))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /union([^a-z]|$)/i,
    /select.*from/i,
    /insert.*into/i,
    /delete.*from/i,
    /update.*set/i,
    /drop.*table/i,
    /create.*table/i,
    /alter.*table/i,
  ];

  const checkForSQLInjection = (value: string): boolean => {
    return sqlPatterns.some(pattern => pattern.test(value));
  };

  const scanObject = (obj: any, path: string = ''): void => {
    if (typeof obj === 'string') {
      if (checkForSQLInjection(obj)) {
        logger.securityAlert('SQL injection attempt detected', {
          path,
          value: obj,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        }, req.user?.id, req.ip);

        throw new Error('Suspicious input detected');
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        scanObject(item, `${path}[${index}]`);
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        scanObject(obj[key], path ? `${path}.${key}` : key);
      });
    }
  };

  try {
    if (req.body) {
      scanObject(req.body, 'body');
    }
    if (req.query) {
      scanObject(req.query, 'query');
    }
    if (req.params) {
      scanObject(req.params, 'params');
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid input detected',
        code: 'INVALID_INPUT',
      },
    });
    return;
  }

  next();
};

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction): void => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
    /onmouseover=/gi,
  ];

  const checkForXSS = (value: string): boolean => {
    return xssPatterns.some(pattern => pattern.test(value));
  };

  const scanObject = (obj: any, path: string = ''): void => {
    if (typeof obj === 'string') {
      if (checkForXSS(obj)) {
        logger.securityAlert('XSS attempt detected', {
          path,
          value: obj,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        }, req.user?.id, req.ip);

        throw new Error('Suspicious input detected');
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        scanObject(item, `${path}[${index}]`);
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        scanObject(obj[key], path ? `${path}.${key}` : key);
      });
    }
  };

  try {
    if (req.body) {
      scanObject(req.body, 'body');
    }
    if (req.query) {
      scanObject(req.query, 'query');
    }
    if (req.params) {
      scanObject(req.params, 'params');
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid input detected',
        code: 'INVALID_INPUT',
      },
    });
    return;
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  next();
};

// Maintenance mode middleware
export const maintenanceMode = (req: Request, res: Response, next: NextFunction): void => {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    // Allow admins to access during maintenance
    if (req.user?.role === 'ADMIN') {
      next();
      return;
    }

    res.status(503).json({
      success: false,
      error: {
        message: 'Service temporarily unavailable for maintenance',
        code: 'MAINTENANCE_MODE',
      },
    });
    return;
  }

  next();
};

// API version validation middleware
export const validateApiVersion = (req: Request, res: Response, next: NextFunction): void => {
  const acceptedVersion = req.headers['accept-version'] || req.headers['api-version'];
  const currentVersion = config.api.version;

  if (acceptedVersion && acceptedVersion !== currentVersion) {
    logger.warn('API version mismatch', {
      acceptedVersion,
      currentVersion,
      path: req.path,
      ip: req.ip,
    });

    res.status(400).json({
      success: false,
      error: {
        message: `API version ${acceptedVersion} is not supported. Current version: ${currentVersion}`,
        code: 'API_VERSION_MISMATCH',
        supportedVersion: currentVersion,
      },
    });
    return;
  }

  next();
};

// Combined security middleware
export const securityMiddleware = [
  helmetConfig,
  sanitizeInput,
  securityHeaders,
];

export default {
  securityMiddleware,
  generalRateLimit,
  authRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  uploadRateLimit,
  paymentRateLimit,
  bookingRateLimit,
  helmetConfig,
  corsConfig,
  sanitizeInput,
  requestLogger,
  ipWhitelist,
  validateUserAgent,
  requestSizeLimit,
  sqlInjectionDetection,
  xssProtection,
  securityHeaders,
  maintenanceMode,
  validateApiVersion,
  createRateLimit,
};
