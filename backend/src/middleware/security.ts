// Security Middleware

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
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

const createRateLimit = (opts: RateLimitOptions) => {
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

// Rate limiting for payment processing
export const paymentRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 payments
  message: 'Too many payment attempts, please try again later',
  limiterName: 'payment',
});
