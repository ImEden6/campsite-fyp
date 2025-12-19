/**
 * Backend Test Setup
 * 
 * Bootstrap file for test process. Contains ONLY:
 * - Environment variable normalization with hard overrides
 * - Global afterEach hooks for mock reset
 * - Hard fail guards for production database detection
 * 
 * NO per-test logic belongs here.
 */

import { afterEach, beforeAll } from 'vitest';

// =============================================================================
// ENVIRONMENT GUARDS
// =============================================================================

const FORBIDDEN_REAL_DB_PATTERNS = [
    /^postgres(ql)?:\/\/(?!.*localhost|.*127\.0\.0\.1|.*test)/i,
    /^redis:\/\/(?!.*localhost|.*127\.0\.0\.1|.*test)/i,
    /\.rds\.amazonaws\.com/i,
    /\.redis\.cache\.windows\.net/i,
    /\.upstash\.io/i,
];

function detectProductionDatabase(): void {
    const dbUrl = process.env.DATABASE_URL || '';
    const redisUrl = process.env.REDIS_URL || '';

    for (const pattern of FORBIDDEN_REAL_DB_PATTERNS) {
        if (pattern.test(dbUrl)) {
            throw new Error(
                `FATAL: Real production DATABASE_URL detected in unit tests.\n` +
                `URL: ${dbUrl.substring(0, 50)}...\n` +
                `Unit tests must use mocked Prisma. Set DATABASE_URL to empty or test URL.`
            );
        }
        if (pattern.test(redisUrl)) {
            throw new Error(
                `FATAL: Real production REDIS_URL detected in unit tests.\n` +
                `URL: ${redisUrl.substring(0, 50)}...\n` +
                `Unit tests must use mocked Redis. Set REDIS_URL to empty or test URL.`
            );
        }
    }
}

// =============================================================================
// ENVIRONMENT NORMALIZATION
// =============================================================================

function normalizeTestEnvironment(): void {
    // Hard overrides for test environment - these MUST be set
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.BCRYPT_ROUNDS = '1'; // Fast hashing for tests

    // Disable external services
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.SENDGRID_API_KEY = 'SG.test_mock';
    process.env.TWILIO_ACCOUNT_SID = 'AC_test_mock';
    process.env.TWILIO_AUTH_TOKEN = 'test_mock';

    // Disable Sentry in tests
    process.env.SENTRY_DSN = '';

    // Set safe database URLs for unit tests (will be mocked anyway)
    if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    }
    if (!process.env.REDIS_URL) {
        process.env.REDIS_URL = 'redis://localhost:6379/15';
    }
}

// =============================================================================
// GLOBAL HOOKS
// =============================================================================

beforeAll(() => {
    normalizeTestEnvironment();

    // Only run production detection for unit tests
    // Integration tests may use real test databases
    const testPath = expect.getState().testPath || '';
    if (testPath.includes('.unit.test.')) {
        detectProductionDatabase();
    }
});

afterEach(async () => {
    // Import mocks dynamically to avoid circular dependencies
    const { resetPrismaMock } = await import('./utils/prisma-mock');
    const { resetRedisMock } = await import('./utils/redis-mock');

    // Reset all mocks
    resetPrismaMock();
    resetRedisMock();

    // Clear all vi mocks
    vi.clearAllMocks();
});

// =============================================================================
// GLOBAL IMPORTS
// =============================================================================

import { vi, expect } from 'vitest';

// Suppress console during tests unless DEBUG is set
if (!process.env.DEBUG) {
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'info').mockImplementation(() => { });
    vi.spyOn(console, 'debug').mockImplementation(() => { });
}
