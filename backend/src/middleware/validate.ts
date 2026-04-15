/**
 * Validation Middleware using Zod
 * Provides type-safe input validation with user-friendly error messages
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ApiError, ValidationErrorDetail } from '@/utils/errors';
import logger from '@/utils/logger';

// ============================================================
// Centralized Error Response Type
// ============================================================

export interface ValidationErrorResponse {
    success: false;
    error: {
        code: 'VALIDATION_ERROR';
        message: string;
        details: ValidationErrorDetail[];
    };
}

// ============================================================
// Base Schemas (Reusable)
// ============================================================

export const dateSchema = z.string().datetime({ message: 'Invalid date format. Use ISO 8601 format.' });
export const cuidSchema = z.string().cuid({ message: 'Invalid ID format' });
export const emailSchema = z.string().email({ message: 'Invalid email format' });
export const phoneSchema = z.string().min(10, 'Phone must be at least 10 characters');

// ============================================================
// Auth Schemas
// ============================================================

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(6, 'Password must be at least 6 characters'),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    email: emailSchema,
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: phoneSchema.optional(),
    role: z.enum(['CUSTOMER']).optional(), // Only allow customer self-registration
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
}).strict();

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ============================================================
// Password Reset Schemas
// ============================================================

export const forgotPasswordSchema = z.object({
    email: emailSchema,
}).strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
}).strict();

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
}).strict();

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Token is required'),
}).strict();

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
    email: emailSchema,
}).strict();

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

// ============================================================
// Payment Schemas
// ============================================================

export const createPaymentIntentSchema = z.object({
    bookingId: cuidSchema,
    amount: z.preprocess(
        (val) => (typeof val === 'string' ? parseFloat(val) : val),
        z.number()
            .min(0.50, 'Amount must be at least $0.50')
            .max(999999.99, 'Amount cannot exceed $999,999.99')
    ),
    idempotencyKey: z.string().uuid({ message: 'Invalid idempotency key format' }).optional(),
}).strict();

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

// ============================================================
// Guest Schemas
// ============================================================

export const guestTypeSchema = z.enum(['ADULT', 'CHILD'], {
    errorMap: () => ({ message: 'Guest type must be ADULT or CHILD' })
});

export const guestInputSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: emailSchema.optional().nullable(),
    phone: phoneSchema.optional().nullable(),
    type: guestTypeSchema,
    isPrimary: z.boolean(),
}).strict();

export type GuestInputValidated = z.infer<typeof guestInputSchema>;

// ============================================================
// Booking Schemas
// ============================================================

export const createBookingSchema = z.object({
    siteId: cuidSchema,
    checkInDate: dateSchema,
    checkOutDate: dateSchema,
    adultGuests: z.number().int().min(1, 'At least 1 adult guest is required'),
    childGuests: z.number().int().min(0, 'Child guests cannot be negative'),
    petGuests: z.number().int().min(0).optional().default(0),
    guests: z.array(guestInputSchema).optional(),
}).strict().refine(
    (data) => new Date(data.checkInDate) < new Date(data.checkOutDate),
    { message: 'Check-in date must be before check-out date', path: ['checkInDate'] }
);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = z.object({
    checkInDate: dateSchema.optional(),
    checkOutDate: dateSchema.optional(),
    adultGuests: z.number().int().min(1).optional(),
    childGuests: z.number().int().min(0).optional(),
    petGuests: z.number().int().min(0).optional(),
    guests: z.array(guestInputSchema).optional(),
    notes: z.string().optional(),
    specialRequests: z.string().optional(),
}).strict().refine(
    (data) => {
        if (data.checkInDate && data.checkOutDate) {
            return new Date(data.checkInDate) < new Date(data.checkOutDate);
        }
        return true;
    },
    { message: 'Check-in date must be before check-out date', path: ['checkInDate'] }
);

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

export const updateGuestsSchema = z.object({
    guests: z.array(guestInputSchema).min(1, 'At least one guest is required'),
}).strict().refine(
    (data) => data.guests.some(g => g.type === 'ADULT'),
    { message: 'At least one adult guest is required', path: ['guests'] }
).refine(
    (data) => data.guests.filter(g => g.isPrimary).length === 1,
    { message: 'Exactly one guest must be marked as primary', path: ['guests'] }
).refine(
    (data) => data.guests.find(g => g.isPrimary)?.type === 'ADULT',
    { message: 'Primary guest must be an adult', path: ['guests'] }
);

export type UpdateGuestsInput = z.infer<typeof updateGuestsSchema>;

// ============================================================
// Centralized Error Formatter
// ============================================================

/**
 * Format Zod errors into stable API error response
 * Returns { code, field, message }[] format
 */
function formatZodErrors(error: ZodError): ValidationErrorDetail[] {
    return error.errors.map(e => ({
        code: e.code,
        field: e.path.join('.'),
        message: e.message,
    }));
}

/**
 * Validates request body against a Zod schema
 * Replaces req.body with validated (and transformed) data
 */
export function validateBody<T extends ZodSchema>(schema: T) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                const formatted = formatZodErrors(result.error);

                // Log validation failures without payloads (no PII)
                logger.warn('Validation failed', {
                    endpoint: req.path,
                    method: req.method,
                    fields: formatted.map(e => e.field),
                });

                const response: ValidationErrorResponse = {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        details: formatted,
                    },
                };
                res.status(400).json(response);
                return;
            }

            // Replace body with validated data (includes defaults and transformations)
            req.body = result.data;
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Validates request query parameters against a Zod schema
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = schema.safeParse(req.query);

            if (!result.success) {
                const formatted = formatZodErrors(result.error);

                res.status(400).json({
                    success: false,
                    error: 'Query validation failed',
                    details: formatted,
                });
                return;
            }

            req.query = result.data;
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Validates request params against a Zod schema
 */
export function validateParams<T extends ZodSchema>(schema: T) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = schema.safeParse(req.params);

            if (!result.success) {
                const formatted = formatZodErrors(result.error);

                res.status(400).json({
                    success: false,
                    error: 'Path parameter validation failed',
                    details: formatted,
                });
                return;
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}
