/**
 * HTTP Request Test Helpers
 * 
 * Request builders for API testing.
 * Does NOT import app startup - that belongs in tests.
 */

import type { Application } from 'express';

// We use supertest for HTTP testing
// Import it dynamically in tests to avoid loading at module level
type SuperTest = typeof import('supertest');

// =============================================================================
// TYPES
// =============================================================================

export interface RequestOptions {
    token?: string;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean>;
    body?: unknown;
}

export interface RequestBuilder {
    get: (path: string, options?: RequestOptions) => Promise<unknown>;
    post: (path: string, options?: RequestOptions) => Promise<unknown>;
    put: (path: string, options?: RequestOptions) => Promise<unknown>;
    patch: (path: string, options?: RequestOptions) => Promise<unknown>;
    delete: (path: string, options?: RequestOptions) => Promise<unknown>;
}

// =============================================================================
// REQUEST BUILDER FACTORY
// =============================================================================

/**
 * Creates a request builder for an Express app.
 * Import supertest in your test file and pass the app.
 * 
 * @example
 * ```ts
 * import request from 'supertest';
 * import { createApp } from '@/app';
 * 
 * const app = createApp();
 * const api = createRequestBuilder(request, app);
 * 
 * const response = await api.get('/api/v1/users', { token: adminToken });
 * ```
 */
export function createRequestBuilder(
    supertest: (app: Application) => { get: Function; post: Function; put: Function; patch: Function; delete: Function },
    app: Application
): RequestBuilder {
    const applyOptions = (
        req: any,
        options: RequestOptions = {}
    ) => {
        if (options.token) {
            req = req.set('Authorization', `Bearer ${options.token}`);
        }

        if (options.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
                req = req.set(key, value);
            }
        }

        if (options.query) {
            req = req.query(options.query);
        }

        if (options.body !== undefined) {
            req = req.send(options.body);
        }

        return req;
    };

    return {
        get: async (path, options) => {
            const req = supertest(app).get(path);
            return applyOptions(req, options);
        },
        post: async (path, options) => {
            const req = supertest(app).post(path).set('Content-Type', 'application/json');
            return applyOptions(req, options);
        },
        put: async (path, options) => {
            const req = supertest(app).put(path).set('Content-Type', 'application/json');
            return applyOptions(req, options);
        },
        patch: async (path, options) => {
            const req = supertest(app).patch(path).set('Content-Type', 'application/json');
            return applyOptions(req, options);
        },
        delete: async (path, options) => {
            const req = supertest(app).delete(path);
            return applyOptions(req, options);
        },
    };
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Type guard for checking response status.
 */
export function isSuccessResponse(response: { status: number }): boolean {
    return response.status >= 200 && response.status < 300;
}

/**
 * Type guard for checking client error response.
 */
export function isClientErrorResponse(response: { status: number }): boolean {
    return response.status >= 400 && response.status < 500;
}

/**
 * Type guard for checking server error response.
 */
export function isServerErrorResponse(response: { status: number }): boolean {
    return response.status >= 500;
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

export interface ApiErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        details?: unknown;
    };
}

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}

/**
 * Asserts response is a success with expected status.
 */
export function assertSuccess(
    response: { status: number; body: unknown },
    expectedStatus = 200
): asserts response is { status: number; body: ApiSuccessResponse } {
    if (response.status !== expectedStatus) {
        throw new Error(
            `Expected status ${expectedStatus}, got ${response.status}.\n` +
            `Body: ${JSON.stringify(response.body, null, 2)}`
        );
    }

    const body = response.body as Record<string, unknown>;
    if (body.success !== true) {
        throw new Error(
            `Expected success: true, got: ${body.success}.\n` +
            `Body: ${JSON.stringify(response.body, null, 2)}`
        );
    }
}

/**
 * Asserts response is an error with expected status.
 */
export function assertError(
    response: { status: number; body: unknown },
    expectedStatus: number,
    expectedCode?: string
): asserts response is { status: number; body: ApiErrorResponse } {
    if (response.status !== expectedStatus) {
        throw new Error(
            `Expected status ${expectedStatus}, got ${response.status}.\n` +
            `Body: ${JSON.stringify(response.body, null, 2)}`
        );
    }

    const body = response.body as Record<string, unknown>;
    if (body.success !== false) {
        throw new Error(
            `Expected success: false, got: ${body.success}.\n` +
            `Body: ${JSON.stringify(response.body, null, 2)}`
        );
    }

    if (expectedCode) {
        const error = body.error as Record<string, unknown>;
        if (error?.code !== expectedCode) {
            throw new Error(
                `Expected error code "${expectedCode}", got "${error?.code}".\n` +
                `Body: ${JSON.stringify(response.body, null, 2)}`
            );
        }
    }
}

/**
 * Asserts response has pagination metadata.
 */
export function assertPaginated(
    response: { body: ApiSuccessResponse },
    expectedTotal?: number
): void {
    const meta = response.body.meta;

    if (!meta) {
        throw new Error('Expected paginated response with meta, but meta is missing');
    }

    if (typeof meta.page !== 'number') {
        throw new Error(`Expected meta.page to be a number, got ${typeof meta.page}`);
    }

    if (typeof meta.limit !== 'number') {
        throw new Error(`Expected meta.limit to be a number, got ${typeof meta.limit}`);
    }

    if (typeof meta.total !== 'number') {
        throw new Error(`Expected meta.total to be a number, got ${typeof meta.total}`);
    }

    if (expectedTotal !== undefined && meta.total !== expectedTotal) {
        throw new Error(`Expected total ${expectedTotal}, got ${meta.total}`);
    }
}

// =============================================================================
// COMMON API PATHS
// =============================================================================

export const API_PATHS = {
    // Auth
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    ME: '/api/v1/auth/me',

    // Users
    USERS: '/api/v1/users',
    USER: (id: string) => `/api/v1/users/${id}`,

    // Sites
    SITES: '/api/v1/sites',
    SITE: (id: string) => `/api/v1/sites/${id}`,
    CAMPSITES: '/api/v1/campsites',

    // Bookings
    BOOKINGS: '/api/v1/bookings',
    BOOKING: (id: string) => `/api/v1/bookings/${id}`,
    BOOKING_CHECK_IN: (id: string) => `/api/v1/bookings/${id}/check-in`,
    BOOKING_CHECK_OUT: (id: string) => `/api/v1/bookings/${id}/check-out`,

    // Payments
    PAYMENTS: '/api/v1/payments',
    PAYMENT_INTENT: '/api/v1/payments/intent',
    PAYMENT: (id: string) => `/api/v1/payments/${id}`,

    // Equipment
    EQUIPMENT: '/api/v1/equipment',
    EQUIPMENT_ITEM: (id: string) => `/api/v1/equipment/${id}`,

    // Health
    HEALTH: '/api/v1/health',
} as const;
