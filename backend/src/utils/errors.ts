// Error Handling Utilities

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from './logger';

// Custom API Error class
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code: string | undefined;
  public details?: any;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: any,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Validation Error class
export class ValidationError extends ApiError {
  public validationErrors: ValidationErrorDetail[];

  constructor(validationErrors: ValidationErrorDetail[], message = 'Validation failed') {
    super(400, message, 'VALIDATION_ERROR');
    this.validationErrors = validationErrors;
  }
}

// Validation Error Detail interface
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Authentication Error class
export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
  }
}

// Authorization Error class
export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
  }
}

// Not Found Error class
export class NotFoundError extends ApiError {
  constructor(resource?: string) {
    const message = resource ? `${resource} not found` : 'Resource not found';
    super(404, message, 'NOT_FOUND');
  }
}

// Conflict Error class
export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict') {
    super(409, message, 'CONFLICT');
  }
}

// Rate Limit Error class
export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
  }
}

// Business Logic Error class
export class BusinessLogicError extends ApiError {
  constructor(message: string, code?: string) {
    super(400, message, code || 'BUSINESS_LOGIC_ERROR');
  }
}

// Payment Error class
export class PaymentError extends ApiError {
  constructor(message: string, code?: string) {
    super(402, message, code || 'PAYMENT_ERROR');
  }
}

// External Service Error class
export class ExternalServiceError extends ApiError {
  constructor(service: string, message?: string) {
    super(503, message || `External service ${service} is unavailable`, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Database Error class
export class DatabaseError extends ApiError {
  constructor(message = 'Database operation failed') {
    super(500, message, 'DATABASE_ERROR');
  }
}

// Handle Zod validation errors
export const handleZodError = (error: ZodError): ValidationError => {
  const validationErrors: ValidationErrorDetail[] = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    value: (err as any).input,
  }));

  return new ValidationError(validationErrors);
};

// Handle Prisma errors
export const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): ApiError => {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = error.meta?.target as string[];
      const field = target?.[0] || 'field';
      return new ConflictError(`${field} already exists`);
    }

    case 'P2025':
      // Record not found
      return new NotFoundError();

    case 'P2003':
      // Foreign key constraint violation
      return new ConflictError('Referenced record does not exist');

    case 'P2014':
      // Invalid ID
      return new ValidationError([{
        field: 'id',
        message: 'Invalid ID format',
        code: 'INVALID_ID',
      }]);

    default:
      logger.error('Unhandled Prisma error', error);
      return new DatabaseError('Database operation failed');
  }
};

// Handle JWT errors
export const handleJWTError = (error: Error): ApiError => {
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }

  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active');
  }

  return new AuthenticationError('Token validation failed');
};

// Handle Multer errors
export const handleMulterError = (error: any): ApiError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError([{
      field: 'file',
      message: 'File size too large',
      code: 'FILE_TOO_LARGE',
    }]);
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ValidationError([{
      field: 'files',
      message: 'Too many files',
      code: 'TOO_MANY_FILES',
    }]);
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError([{
      field: 'file',
      message: 'Unexpected file field',
      code: 'UNEXPECTED_FILE',
    }]);
  }

  return new ValidationError([{
    field: 'file',
    message: 'File upload failed',
    code: 'UPLOAD_ERROR',
  }]);
};

// Handle Stripe errors
export const handleStripeError = (error: any): ApiError => {
  switch (error.type) {
    case 'StripeCardError':
      return new PaymentError('Card was declined', 'CARD_DECLINED');

    case 'StripeRateLimitError':
      return new RateLimitError('Too many requests to Stripe');

    case 'StripeInvalidRequestError':
      return new ValidationError([{
        field: 'payment',
        message: 'Invalid payment request',
        code: 'INVALID_PAYMENT',
      }]);

    case 'StripeAPIError':
      return new ExternalServiceError('Stripe', 'Payment service unavailable');

    case 'StripeConnectionError':
      return new ExternalServiceError('Stripe', 'Payment service connection failed');

    case 'StripeAuthenticationError':
      return new ExternalServiceError('Stripe', 'Payment service authentication failed');

    default:
      return new PaymentError('Payment processing failed');
  }
};

// Convert error to API response format
export const formatErrorResponse = (error: ApiError) => {
  const response: any = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    },
    timestamp: new Date().toISOString(),
  };

  if (error instanceof ValidationError) {
    response.error.validationErrors = error.validationErrors;
  }

  if (error.details) {
    response.error.details = error.details;
  }

  return response;
};

// Check if error is operational
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
};

// Global error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: ApiError;

  // Convert known errors to ApiError
  if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  } else if (err.name && ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(err.name)) {
    error = handleJWTError(err);
  } else if (err.name === 'MulterError') {
    error = handleMulterError(err);
  } else if (err.constructor.name.startsWith('Stripe')) {
    error = handleStripeError(err);
  } else if (err instanceof ApiError) {
    error = err;
  } else {
    // Handle unexpected errors
    logger.error('Unexpected error', err);
    error = new ApiError(500, 'Internal server error', 'INTERNAL_ERROR');
  }

  // Log error details
  const errorDetails = {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    stack: error.stack,
  };

  if (error.statusCode >= 500) {
    logger.error('Server error', errorDetails);
  } else if (error.statusCode >= 400) {
    logger.warn('Client error', errorDetails);
  }

  // Send error response
  const response = formatErrorResponse(error);
  res.status(error.statusCode).json(response);
};

// Not found handler middleware
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware factory
export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(handleZodError(error));
      } else {
        next(error);
      }
    }
  };
};

// Query validation middleware factory
export const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(handleZodError(error));
      } else {
        next(error);
      }
    }
  };
};

// Params validation middleware factory
export const validateParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(handleZodError(error));
      } else {
        next(error);
      }
    }
  };
};

// Error factory functions
export const createValidationError = (field: string, message: string, code: string, value?: any): ValidationError => {
  return new ValidationError([{ field, message, code, value }]);
};

export const createNotFoundError = (resource?: string): NotFoundError => {
  return new NotFoundError(resource);
};

export const createConflictError = (message?: string): ConflictError => {
  return new ConflictError(message);
};

export const createBusinessLogicError = (message: string, code?: string): BusinessLogicError => {
  return new BusinessLogicError(message, code);
};

export const createPaymentError = (message: string, code?: string): PaymentError => {
  return new PaymentError(message, code);
};

export const createExternalServiceError = (service: string, message?: string): ExternalServiceError => {
  return new ExternalServiceError(service, message);
};

export default {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  BusinessLogicError,
  PaymentError,
  ExternalServiceError,
  DatabaseError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validate,
  validateQuery,
  validateParams,
  formatErrorResponse,
  isOperationalError,
  createValidationError,
  createNotFoundError,
  createConflictError,
  createBusinessLogicError,
  createPaymentError,
  createExternalServiceError,
};
