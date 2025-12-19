/**
 * Typed Prisma Mock
 * 
 * Provides a type-safe mock of PrismaClient for unit tests.
 * 
 * Pattern:
 * - PrismaClient shape mirrored exactly
 * - Each model method mocked independently
 * - Reset via factory, not global singleton
 * - NEVER use in integration tests
 */

import { vi, type Mock } from 'vitest';

// =============================================================================
// TYPES
// =============================================================================

type MockModelMethods = {
    findUnique: Mock;
    findUniqueOrThrow: Mock;
    findFirst: Mock;
    findFirstOrThrow: Mock;
    findMany: Mock;
    create: Mock;
    createMany: Mock;
    update: Mock;
    updateMany: Mock;
    upsert: Mock;
    delete: Mock;
    deleteMany: Mock;
    count: Mock;
    aggregate: Mock;
    groupBy: Mock;
};

type MockTransactionClient = {
    $executeRaw: Mock;
    $executeRawUnsafe: Mock;
    $queryRaw: Mock;
    $queryRawUnsafe: Mock;
} & {
    [K in PrismaModelName]: MockModelMethods;
};

// All Prisma model names from schema
type PrismaModelName =
    | 'user'
    | 'userPreferences'
    | 'userSession'
    | 'apiKey'
    | 'site'
    | 'booking'
    | 'guest'
    | 'vehicle'
    | 'payment'
    | 'equipment'
    | 'equipmentRental'
    | 'communication'
    | 'notification'
    | 'pricingRule'
    | 'groupBooking'
    | 'campsiteSettings'
    | 'fileUpload'
    | 'weatherData'
    | 'weatherForecast'
    | 'calendarEvent'
    | 'auditLog';

export type MockPrismaClient = {
    $connect: Mock;
    $disconnect: Mock;
    $executeRaw: Mock;
    $executeRawUnsafe: Mock;
    $queryRaw: Mock;
    $queryRawUnsafe: Mock;
    $transaction: Mock;
} & {
    [K in PrismaModelName]: MockModelMethods;
};

// =============================================================================
// MOCK FACTORY
// =============================================================================

function createMockModelMethods(): MockModelMethods {
    return {
        findUnique: vi.fn().mockResolvedValue(null),
        findUniqueOrThrow: vi.fn().mockRejectedValue(new Error('Not found')),
        findFirst: vi.fn().mockResolvedValue(null),
        findFirstOrThrow: vi.fn().mockRejectedValue(new Error('Not found')),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'mock-id', ...args.data })),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
        update: vi.fn().mockImplementation((args) => Promise.resolve({ id: args.where?.id, ...args.data })),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        upsert: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'mock-id', ...args.create })),
        delete: vi.fn().mockResolvedValue({ id: 'mock-id' }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({}),
        groupBy: vi.fn().mockResolvedValue([]),
    };
}

const MODEL_NAMES: PrismaModelName[] = [
    'user',
    'userPreferences',
    'userSession',
    'apiKey',
    'site',
    'booking',
    'guest',
    'vehicle',
    'payment',
    'equipment',
    'equipmentRental',
    'communication',
    'notification',
    'pricingRule',
    'groupBooking',
    'campsiteSettings',
    'fileUpload',
    'weatherData',
    'weatherForecast',
    'calendarEvent',
    'auditLog',
];

/**
 * Creates a fresh mock PrismaClient instance.
 * Call this in beforeEach for test isolation.
 */
export function createMockPrismaClient(): MockPrismaClient {
    const mockClient = {
        $connect: vi.fn().mockResolvedValue(undefined),
        $disconnect: vi.fn().mockResolvedValue(undefined),
        $executeRaw: vi.fn().mockResolvedValue(0),
        $executeRawUnsafe: vi.fn().mockResolvedValue(0),
        $queryRaw: vi.fn().mockResolvedValue([]),
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        $transaction: vi.fn().mockImplementation(async (fn) => {
            if (typeof fn === 'function') {
                // Interactive transaction - pass a mock client
                const txClient = createMockTransactionClient();
                return fn(txClient);
            }
            // Batch transaction - return empty results
            return [];
        }),
    } as MockPrismaClient;

    // Add all model methods
    for (const modelName of MODEL_NAMES) {
        (mockClient as any)[modelName] = createMockModelMethods();
    }

    return mockClient;
}

function createMockTransactionClient(): MockTransactionClient {
    const txClient = {
        $executeRaw: vi.fn().mockResolvedValue(0),
        $executeRawUnsafe: vi.fn().mockResolvedValue(0),
        $queryRaw: vi.fn().mockResolvedValue([]),
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    } as MockTransactionClient;

    for (const modelName of MODEL_NAMES) {
        (txClient as any)[modelName] = createMockModelMethods();
    }

    return txClient;
}

// =============================================================================
// SINGLETON FOR GLOBAL MOCK (used by setup.ts)
// =============================================================================

let globalMockClient: MockPrismaClient | null = null;

/**
 * Gets the global mock client, creating one if needed.
 * Prefer createMockPrismaClient() in tests for isolation.
 */
export function getMockPrismaClient(): MockPrismaClient {
    if (!globalMockClient) {
        globalMockClient = createMockPrismaClient();
    }
    return globalMockClient;
}

/**
 * Resets all mocks on the global client.
 * Called by setup.ts afterEach hook.
 */
export function resetPrismaMock(): void {
    if (!globalMockClient) return;

    // Reset top-level mocks
    globalMockClient.$connect.mockClear();
    globalMockClient.$disconnect.mockClear();
    globalMockClient.$executeRaw.mockClear();
    globalMockClient.$executeRawUnsafe.mockClear();
    globalMockClient.$queryRaw.mockClear();
    globalMockClient.$queryRawUnsafe.mockClear();
    globalMockClient.$transaction.mockClear();

    // Reset all model mocks
    for (const modelName of MODEL_NAMES) {
        const model = (globalMockClient as any)[modelName] as MockModelMethods;
        Object.values(model).forEach((mock) => mock.mockClear());
    }
}

/**
 * Destroys the global mock client.
 * Use when you need a completely fresh mock.
 */
export function destroyMockPrismaClient(): void {
    globalMockClient = null;
}

// =============================================================================
// GUARD
// =============================================================================

/**
 * Throws if called from an integration test file.
 * Use at top of test files to enforce boundaries.
 */
export function assertNotIntegrationTest(): void {
    const testPath = expect.getState().testPath || '';
    if (testPath.includes('.int.test.')) {
        throw new Error(
            'prisma-mock.ts must not be imported in integration tests.\n' +
            'Integration tests should use real database connections.\n' +
            `Test file: ${testPath}`
        );
    }
}
