// Authentication and Authorization Middleware

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import logger from '@/utils/logger';
import { ApiError } from '@/utils/errors';
import { apiKeyService } from '@/services/api-key';

type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';

const prisma = new PrismaClient();

// Extend Express Request type to include user and API key info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
        isActive: boolean;
        isEmailVerified: boolean;
      };
      apiKey?: {
        keyId: string;
        permissions: string[];
        rateLimit: number;
      };
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.authFailure('', 'Missing or invalid authorization header', req.get('User-Agent'), req.ip);
      throw new ApiError(401, 'Authentication required');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      logger.authFailure('', 'Missing token', req.get('User-Agent'), req.ip);
      throw new ApiError(401, 'Authentication required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      logger.authFailure(decoded.email, 'User not found', req.get('User-Agent'), req.ip);
      throw new ApiError(401, 'Invalid token');
    }

    if (!user.isActive) {
      logger.authFailure(user.email, 'Account inactive', req.get('User-Agent'), req.ip);
      throw new ApiError(401, 'Account is inactive');
    }

    if (!user.isEmailVerified && !config.development.skipEmailVerification) {
      logger.authFailure(user.email, 'Email not verified', req.get('User-Agent'), req.ip);
      throw new ApiError(401, 'Email verification required');
    }

    // Attach user to request
    req.user = user;
    
    logger.authSuccess(user.id, req.get('User-Agent'), req.ip);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.authFailure('', 'Token expired', req.get('User-Agent'), req.ip);
      return next(new ApiError(401, 'Token expired'));
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      logger.authFailure('', 'Invalid token', req.get('User-Agent'), req.ip);
      return next(new ApiError(401, 'Invalid token'));
    }
    
    next(error);
  }
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Silently fail for optional authentication
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.authFailure('', 'No user in request', req.get('User-Agent'), req.ip);
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.securityAlert('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.path,
        method: req.method,
      }, req.user.id, req.ip);
      
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};

// Role hierarchy check
const roleHierarchy: Record<UserRole, number> = {
  ADMIN: 4,
  MANAGER: 3,
  STAFF: 2,
  CUSTOMER: 1,
};

export const authorizeMinimumRole = (minimumRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRoleLevel = roleHierarchy[req.user.role];
    const requiredRoleLevel = roleHierarchy[minimumRole];

    if (userRoleLevel < requiredRoleLevel) {
      logger.securityAlert('Insufficient role level', {
        userId: req.user.id,
        userRole: req.user.role,
        userRoleLevel,
        requiredRole: minimumRole,
        requiredRoleLevel,
        endpoint: req.path,
        method: req.method,
      }, req.user.id, req.ip);
      
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};

// Resource ownership check
export const authorizeOwnership = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    // Admins and managers can access all resources
    if (req.user.role === 'ADMIN' || req.user.role === 'MANAGER') {
      return next();
    }

    const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];
    
    if (!resourceUserId) {
      return next(new ApiError(400, 'Resource user ID not provided'));
    }

    if (req.user.id !== resourceUserId) {
      logger.securityAlert('Unauthorized resource access', {
        userId: req.user.id,
        resourceUserId,
        endpoint: req.path,
        method: req.method,
      }, req.user.id, req.ip);
      
      return next(new ApiError(403, 'Access denied'));
    }

    next();
  };
};

// Custom authorization check with callback
export const authorizeCustom = (
  authCallback: (user: NonNullable<Request['user']>, req: Request) => Promise<boolean>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    try {
      const isAuthorized = await authCallback(req.user, req);
      
      if (!isAuthorized) {
        logger.securityAlert('Custom authorization failed', {
          userId: req.user.id,
          endpoint: req.path,
          method: req.method,
        }, req.user.id, req.ip);
        
        return next(new ApiError(403, 'Access denied'));
      }

      next();
    } catch (error) {
      logger.error('Custom authorization error', error);
      next(new ApiError(500, 'Authorization check failed'));
    }
  };
};

// Middleware to check if user owns a booking
export const authorizeBookingOwnership = authorizeCustom(async (user, req) => {
  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    return true;
  }

  const bookingId = req.params.bookingId || req.params.id;
  if (!bookingId) {
    return false;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { userId: true },
  });

  return booking?.userId === user.id;
});

// Middleware to check if user can manage a site
export const authorizeSiteManagement = authorizeCustom(async (user, req) => {
  return user.role === 'ADMIN' || user.role === 'MANAGER';
});

// Middleware to check if user can access analytics
export const authorizeAnalytics = authorizeCustom(async (user, req) => {
  return user.role === 'ADMIN' || user.role === 'MANAGER';
});

// Middleware to check if user can manage equipment
export const authorizeEquipmentManagement = authorizeCustom(async (user, req) => {
  return user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'STAFF';
});

// Middleware to check if user can manage other users
export const authorizeUserManagement = authorizeCustom(async (user, req) => {
  if (user.role === 'ADMIN') {
    return true;
  }

  if (user.role === 'MANAGER') {
    const targetUserId = req.params.userId || req.params.id;
    if (!targetUserId) {
      return false;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });

    // Managers can manage staff and customers, but not other managers or admins
    return targetUser?.role === 'STAFF' || targetUser?.role === 'CUSTOMER';
  }

  return false;
});

// Middleware to validate API key for external integrations
export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      logger.securityAlert('Missing API key', {
        endpoint: req.path,
        method: req.method,
      }, undefined, req.ip);
      
      return next(new ApiError(401, 'API key required'));
    }

    // Validate the API key
    const validation = await apiKeyService.validateApiKey(apiKey);
    
    if (!validation.valid) {
      logger.securityAlert('Invalid API key', {
        endpoint: req.path,
        method: req.method,
        error: validation.error,
      }, undefined, req.ip);
      
      return next(new ApiError(401, validation.error || 'Invalid API key'));
    }

    // Check rate limit
    const withinLimit = await apiKeyService.checkRateLimit(
      validation.keyId!,
      validation.rateLimit!
    );

    if (!withinLimit) {
      logger.rateLimitHit(req.ip || 'unknown', req.path, validation.rateLimit!);
      
      return next(new ApiError(429, 'Rate limit exceeded'));
    }

    // Increment usage counter (async, don't wait)
    apiKeyService.incrementUsage(validation.keyId!).catch((error) => {
      logger.error('Failed to increment API key usage', error);
    });

    // Log successful API key usage
    logger.info('API key validated', {
      keyId: validation.keyId,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
    });

    // Attach API key info to request
    req.apiKey = {
      keyId: validation.keyId!,
      permissions: validation.permissions!,
      rateLimit: validation.rateLimit!,
    };

    next();
  } catch (error) {
    logger.error('API key validation error', error);
    next(new ApiError(500, 'API key validation failed'));
  }
};

// Middleware to check if user has verified their email
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (!req.user.isEmailVerified && !config.development.skipEmailVerification) {
    logger.authFailure(req.user.email, 'Email not verified', req.get('User-Agent'), req.ip);
    return next(new ApiError(403, 'Email verification required'));
  }

  next();
};

// Middleware to check if user account is active
export const requireActiveAccount = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (!req.user.isActive) {
    logger.authFailure(req.user.email, 'Account inactive', req.get('User-Agent'), req.ip);
    return next(new ApiError(403, 'Account is inactive'));
  }

  next();
};

// Middleware to log user activity
export const logUserActivity = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      logger.info('User activity', {
        userId: req.user.id,
        action,
        endpoint: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
    next();
  };
};

// Middleware to check API key permissions
export const requireApiKeyPermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      logger.securityAlert('API key permission check without API key', {
        endpoint: req.path,
        method: req.method,
      }, undefined, req.ip);
      
      return next(new ApiError(401, 'API key required'));
    }

    const hasPermission = requiredPermissions.some(permission =>
      req.apiKey!.permissions.includes(permission) || 
      req.apiKey!.permissions.includes('*')
    );

    if (!hasPermission) {
      logger.securityAlert('Insufficient API key permissions', {
        keyId: req.apiKey.keyId,
        requiredPermissions,
        actualPermissions: req.apiKey.permissions,
        endpoint: req.path,
        method: req.method,
      }, undefined, req.ip);
      
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};

// Alias for authenticate
export const authMiddleware = authenticate;

export default {
  authenticate,
  authMiddleware,
  optionalAuthenticate,
  authorize,
  authorizeMinimumRole,
  authorizeOwnership,
  authorizeCustom,
  authorizeBookingOwnership,
  authorizeSiteManagement,
  authorizeAnalytics,
  authorizeEquipmentManagement,
  authorizeUserManagement,
  validateApiKey,
  requireApiKeyPermission,
  requireEmailVerification,
  requireActiveAccount,
  logUserActivity,
};
