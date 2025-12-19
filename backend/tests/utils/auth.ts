/**
 * Authentication Test Helpers
 * 
 * Token and session helpers for testing authenticated endpoints.
 * Does NOT import app startup - that belongs in tests.
 */

import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

export interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

export interface TokenOptions {
    expiresIn?: string | number;
    secret?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production';
const DEFAULT_EXPIRES_IN = '1h';

// =============================================================================
// TOKEN GENERATION
// =============================================================================

/**
 * Creates a valid JWT token for testing.
 */
export function createToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>,
    options: TokenOptions = {}
): string {
    const secret = options.secret || DEFAULT_SECRET;
    const expiresIn = options.expiresIn || DEFAULT_EXPIRES_IN;

    // Cast to any to avoid strict type issues with jsonwebtoken
    return jwt.sign(payload, secret, { expiresIn } as any);
}

/**
 * Creates a token for a specific user role.
 */
export function createTokenForRole(
    role: UserRole,
    userId = `test_${role.toLowerCase()}_${Date.now()}`,
    options: TokenOptions = {}
): string {
    return createToken(
        {
            userId,
            email: `${role.toLowerCase()}@test.local`,
            role,
        },
        options
    );
}

/**
 * Creates an admin token.
 */
export function createAdminToken(userId?: string, options?: TokenOptions): string {
    return createTokenForRole(UserRole.ADMIN, userId, options);
}

/**
 * Creates a manager token.
 */
export function createManagerToken(userId?: string, options?: TokenOptions): string {
    return createTokenForRole(UserRole.MANAGER, userId, options);
}

/**
 * Creates a staff token.
 */
export function createStaffToken(userId?: string, options?: TokenOptions): string {
    return createTokenForRole(UserRole.STAFF, userId, options);
}

/**
 * Creates a customer token.
 */
export function createCustomerToken(userId?: string, options?: TokenOptions): string {
    return createTokenForRole(UserRole.CUSTOMER, userId, options);
}

/**
 * Creates an expired token for testing token validation.
 */
export function createExpiredToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    const secret = DEFAULT_SECRET;
    // Create token that expired 1 hour ago
    const iat = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
    const exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

    return jwt.sign({ ...payload, iat, exp }, secret);
}

/**
 * Creates a token with invalid signature.
 */
export function createInvalidToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });
}

/**
 * Creates a malformed token string.
 */
export function createMalformedToken(): string {
    return 'not.a.valid.jwt.token';
}

// =============================================================================
// TOKEN PARSING
// =============================================================================

/**
 * Decodes a token without verification (for test assertions).
 */
export function decodeToken(token: string): TokenPayload | null {
    try {
        return jwt.decode(token) as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * Verifies a token and returns the payload.
 */
export function verifyToken(token: string, secret = DEFAULT_SECRET): TokenPayload {
    return jwt.verify(token, secret) as TokenPayload;
}

// =============================================================================
// HEADER HELPERS
// =============================================================================

/**
 * Creates an Authorization header value.
 */
export function createAuthHeader(token: string): string {
    return `Bearer ${token}`;
}

/**
 * Creates headers object with Authorization.
 */
export function createAuthHeaders(token: string): Record<string, string> {
    return {
        Authorization: createAuthHeader(token),
        'Content-Type': 'application/json',
    };
}

/**
 * Creates headers for a specific role.
 */
export function createHeadersForRole(role: UserRole, userId?: string): Record<string, string> {
    const token = createTokenForRole(role, userId);
    return createAuthHeaders(token);
}

// =============================================================================
// SESSION HELPERS
// =============================================================================

export interface MockSession {
    id: string;
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Creates a mock session object.
 */
export function createMockSession(
    userId: string,
    overrides: Partial<MockSession> = {}
): MockSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return {
        id: `session_${Date.now()}`,
        userId,
        token: createTokenForRole(UserRole.CUSTOMER, userId),
        refreshToken: `refresh_${Date.now()}_${Math.random().toString(36)}`,
        expiresAt,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

/**
 * Creates an expired session.
 */
export function createExpiredSession(userId: string): MockSession {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return createMockSession(userId, {
        expiresAt: pastDate,
    });
}
