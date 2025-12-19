/**
 * In-Memory Redis Mock
 * 
 * Provides an in-memory map-based Redis mock with minimal TTL simulation.
 * 
 * Features:
 * - Map-based storage (not protocol-level)
 * - TTL behavior simulation
 * - Hooks to assert key usage and expiration intent
 * - Reset capability for test isolation
 */

import { vi, type Mock } from 'vitest';

// =============================================================================
// TYPES
// =============================================================================

interface StoredValue {
    value: string;
    expiresAt: number | null; // Unix timestamp or null for no expiry
}

interface TTLAssertion {
    key: string;
    ttl: number | null;
    setAt: number;
}

export interface MockRedisClient {
    // String commands
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    setex: ReturnType<typeof vi.fn>;
    setnx: ReturnType<typeof vi.fn>;
    mget: ReturnType<typeof vi.fn>;
    mset: ReturnType<typeof vi.fn>;
    incr: ReturnType<typeof vi.fn>;
    incrby: ReturnType<typeof vi.fn>;
    decr: ReturnType<typeof vi.fn>;
    decrby: ReturnType<typeof vi.fn>;

    // Key commands
    del: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
    expireat: ReturnType<typeof vi.fn>;
    ttl: ReturnType<typeof vi.fn>;
    pttl: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
    scan: ReturnType<typeof vi.fn>;

    // Hash commands
    hget: ReturnType<typeof vi.fn>;
    hset: ReturnType<typeof vi.fn>;
    hmget: ReturnType<typeof vi.fn>;
    hmset: ReturnType<typeof vi.fn>;
    hgetall: ReturnType<typeof vi.fn>;
    hdel: ReturnType<typeof vi.fn>;
    hexists: ReturnType<typeof vi.fn>;
    hincrby: ReturnType<typeof vi.fn>;

    // List commands
    lpush: ReturnType<typeof vi.fn>;
    rpush: ReturnType<typeof vi.fn>;
    lpop: ReturnType<typeof vi.fn>;
    rpop: ReturnType<typeof vi.fn>;
    lrange: ReturnType<typeof vi.fn>;
    llen: ReturnType<typeof vi.fn>;

    // Set commands
    sadd: ReturnType<typeof vi.fn>;
    srem: ReturnType<typeof vi.fn>;
    smembers: ReturnType<typeof vi.fn>;
    sismember: ReturnType<typeof vi.fn>;
    scard: ReturnType<typeof vi.fn>;

    // Connection commands
    ping: ReturnType<typeof vi.fn>;
    quit: ReturnType<typeof vi.fn>;

    // Pub/Sub (stubs only)
    publish: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;

    // Transaction commands (stubs)
    multi: ReturnType<typeof vi.fn>;
    exec: ReturnType<typeof vi.fn>;

    // Assertions
    _getStore: () => Map<string, StoredValue>;
    _getTTLAssertions: () => TTLAssertion[];
    _simulateExpiry: () => void;
}

// =============================================================================
// MOCK FACTORY
// =============================================================================

/**
 * Creates a fresh mock Redis client instance.
 * Call this in beforeEach for test isolation.
 */
export function createMockRedisClient(): MockRedisClient {
    const store = new Map<string, StoredValue>();
    const hashStore = new Map<string, Map<string, string>>();
    const listStore = new Map<string, string[]>();
    const setStore = new Map<string, Set<string>>();
    const ttlAssertions: TTLAssertion[] = [];
    const counters = new Map<string, number>();

    const now = () => Date.now();

    const isExpired = (entry: StoredValue): boolean => {
        if (entry.expiresAt === null) return false;
        return now() > entry.expiresAt;
    };

    const getValid = (key: string): string | null => {
        const entry = store.get(key);
        if (!entry) return null;
        if (isExpired(entry)) {
            store.delete(key);
            return null;
        }
        return entry.value;
    };

    const mockClient: MockRedisClient = {
        // String commands
        get: vi.fn(async (key: string) => getValid(key)),

        set: vi.fn(async (key: string, value: string, options?: { EX?: number; PX?: number; NX?: boolean; XX?: boolean }) => {
            const exists = store.has(key);
            if (options?.NX && exists) return null;
            if (options?.XX && !exists) return null;

            let expiresAt: number | null = null;
            if (options?.EX) {
                expiresAt = now() + options.EX * 1000;
                ttlAssertions.push({ key, ttl: options.EX, setAt: now() });
            } else if (options?.PX) {
                expiresAt = now() + options.PX;
                ttlAssertions.push({ key, ttl: options.PX / 1000, setAt: now() });
            }

            store.set(key, { value, expiresAt });
            return 'OK';
        }),

        setex: vi.fn(async (key: string, seconds: number, value: string) => {
            const expiresAt = now() + seconds * 1000;
            store.set(key, { value, expiresAt });
            ttlAssertions.push({ key, ttl: seconds, setAt: now() });
            return 'OK';
        }),

        setnx: vi.fn(async (key: string, value: string) => {
            if (store.has(key)) return 0;
            store.set(key, { value, expiresAt: null });
            return 1;
        }),

        mget: vi.fn(async (...keys: string[]) => keys.map((key) => getValid(key))),

        mset: vi.fn(async (...keyValues: string[]) => {
            for (let i = 0; i < keyValues.length; i += 2) {
                store.set(keyValues[i], { value: keyValues[i + 1], expiresAt: null });
            }
            return 'OK';
        }),

        incr: vi.fn(async (key: string) => {
            const current = counters.get(key) ?? 0;
            const newValue = current + 1;
            counters.set(key, newValue);
            store.set(key, { value: String(newValue), expiresAt: null });
            return newValue;
        }),

        incrby: vi.fn(async (key: string, increment: number) => {
            const current = counters.get(key) ?? 0;
            const newValue = current + increment;
            counters.set(key, newValue);
            store.set(key, { value: String(newValue), expiresAt: null });
            return newValue;
        }),

        decr: vi.fn(async (key: string) => {
            const current = counters.get(key) ?? 0;
            const newValue = current - 1;
            counters.set(key, newValue);
            store.set(key, { value: String(newValue), expiresAt: null });
            return newValue;
        }),

        decrby: vi.fn(async (key: string, decrement: number) => {
            const current = counters.get(key) ?? 0;
            const newValue = current - decrement;
            counters.set(key, newValue);
            store.set(key, { value: String(newValue), expiresAt: null });
            return newValue;
        }),

        // Key commands
        del: vi.fn(async (...keys: string[]) => {
            let deleted = 0;
            for (const key of keys) {
                if (store.delete(key)) deleted++;
                hashStore.delete(key);
                listStore.delete(key);
                setStore.delete(key);
                counters.delete(key);
            }
            return deleted;
        }),

        exists: vi.fn(async (...keys: string[]) => {
            return keys.filter((key) => getValid(key) !== null).length;
        }),

        expire: vi.fn(async (key: string, seconds: number) => {
            const entry = store.get(key);
            if (!entry) return 0;
            entry.expiresAt = now() + seconds * 1000;
            ttlAssertions.push({ key, ttl: seconds, setAt: now() });
            return 1;
        }),

        expireat: vi.fn(async (key: string, timestamp: number) => {
            const entry = store.get(key);
            if (!entry) return 0;
            entry.expiresAt = timestamp * 1000;
            return 1;
        }),

        ttl: vi.fn(async (key: string) => {
            const entry = store.get(key);
            if (!entry) return -2;
            if (entry.expiresAt === null) return -1;
            const remaining = Math.ceil((entry.expiresAt - now()) / 1000);
            return remaining > 0 ? remaining : -2;
        }),

        pttl: vi.fn(async (key: string) => {
            const entry = store.get(key);
            if (!entry) return -2;
            if (entry.expiresAt === null) return -1;
            const remaining = entry.expiresAt - now();
            return remaining > 0 ? remaining : -2;
        }),

        keys: vi.fn(async (pattern: string) => {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
            return Array.from(store.keys()).filter((key) => regex.test(key) && getValid(key) !== null);
        }),

        scan: vi.fn(async (cursor: number, ...args: any[]) => {
            // Simplified scan - returns all keys in one batch
            const allKeys = Array.from(store.keys()).filter((key) => getValid(key) !== null);
            return ['0', allKeys];
        }),

        // Hash commands
        hget: vi.fn(async (key: string, field: string) => {
            return hashStore.get(key)?.get(field) ?? null;
        }),

        hset: vi.fn(async (key: string, field: string, value: string) => {
            if (!hashStore.has(key)) hashStore.set(key, new Map());
            const isNew = !hashStore.get(key)!.has(field);
            hashStore.get(key)!.set(field, value);
            return isNew ? 1 : 0;
        }),

        hmget: vi.fn(async (key: string, ...fields: string[]) => {
            const hash = hashStore.get(key);
            return fields.map((field) => hash?.get(field) ?? null);
        }),

        hmset: vi.fn(async (key: string, ...fieldValues: string[]) => {
            if (!hashStore.has(key)) hashStore.set(key, new Map());
            const hash = hashStore.get(key)!;
            for (let i = 0; i < fieldValues.length; i += 2) {
                hash.set(fieldValues[i], fieldValues[i + 1]);
            }
            return 'OK';
        }),

        hgetall: vi.fn(async (key: string) => {
            const hash = hashStore.get(key);
            if (!hash) return {};
            return Object.fromEntries(hash);
        }),

        hdel: vi.fn(async (key: string, ...fields: string[]) => {
            const hash = hashStore.get(key);
            if (!hash) return 0;
            let deleted = 0;
            for (const field of fields) {
                if (hash.delete(field)) deleted++;
            }
            return deleted;
        }),

        hexists: vi.fn(async (key: string, field: string) => {
            return hashStore.get(key)?.has(field) ? 1 : 0;
        }),

        hincrby: vi.fn(async (key: string, field: string, increment: number) => {
            if (!hashStore.has(key)) hashStore.set(key, new Map());
            const hash = hashStore.get(key)!;
            const current = parseInt(hash.get(field) || '0', 10);
            const newValue = current + increment;
            hash.set(field, String(newValue));
            return newValue;
        }),

        // List commands
        lpush: vi.fn(async (key: string, ...values: string[]) => {
            if (!listStore.has(key)) listStore.set(key, []);
            const list = listStore.get(key)!;
            list.unshift(...values.reverse());
            return list.length;
        }),

        rpush: vi.fn(async (key: string, ...values: string[]) => {
            if (!listStore.has(key)) listStore.set(key, []);
            const list = listStore.get(key)!;
            list.push(...values);
            return list.length;
        }),

        lpop: vi.fn(async (key: string) => {
            return listStore.get(key)?.shift() ?? null;
        }),

        rpop: vi.fn(async (key: string) => {
            return listStore.get(key)?.pop() ?? null;
        }),

        lrange: vi.fn(async (key: string, start: number, stop: number) => {
            const list = listStore.get(key) ?? [];
            const end = stop < 0 ? list.length + stop + 1 : stop + 1;
            return list.slice(start, end);
        }),

        llen: vi.fn(async (key: string) => {
            return listStore.get(key)?.length ?? 0;
        }),

        // Set commands
        sadd: vi.fn(async (key: string, ...members: string[]) => {
            if (!setStore.has(key)) setStore.set(key, new Set());
            const set = setStore.get(key)!;
            let added = 0;
            for (const member of members) {
                if (!set.has(member)) {
                    set.add(member);
                    added++;
                }
            }
            return added;
        }),

        srem: vi.fn(async (key: string, ...members: string[]) => {
            const set = setStore.get(key);
            if (!set) return 0;
            let removed = 0;
            for (const member of members) {
                if (set.delete(member)) removed++;
            }
            return removed;
        }),

        smembers: vi.fn(async (key: string) => {
            return Array.from(setStore.get(key) ?? []);
        }),

        sismember: vi.fn(async (key: string, member: string) => {
            return setStore.get(key)?.has(member) ? 1 : 0;
        }),

        scard: vi.fn(async (key: string) => {
            return setStore.get(key)?.size ?? 0;
        }),

        // Connection commands
        ping: vi.fn(async () => 'PONG'),
        quit: vi.fn(async () => 'OK'),

        // Pub/Sub stubs
        publish: vi.fn(async () => 0),
        subscribe: vi.fn(async () => { }),
        unsubscribe: vi.fn(async () => { }),

        // Transaction stubs
        multi: vi.fn(() => mockClient),
        exec: vi.fn(async () => []),

        // Assertion helpers
        _getStore: () => store,
        _getTTLAssertions: () => [...ttlAssertions],
        _simulateExpiry: () => {
            for (const [key, entry] of store) {
                if (isExpired(entry)) {
                    store.delete(key);
                }
            }
        },
    };

    return mockClient;
}

// =============================================================================
// SINGLETON FOR GLOBAL MOCK
// =============================================================================

let globalMockClient: MockRedisClient | null = null;

/**
 * Gets the global mock client, creating one if needed.
 */
export function getMockRedisClient(): MockRedisClient {
    if (!globalMockClient) {
        globalMockClient = createMockRedisClient();
    }
    return globalMockClient;
}

/**
 * Resets all state on the global mock client.
 * Called by setup.ts afterEach hook.
 */
export function resetRedisMock(): void {
    if (!globalMockClient) return;

    // Clear all stores
    globalMockClient._getStore().clear();
    globalMockClient._getTTLAssertions().length = 0;

    // Reset all method mocks
    Object.entries(globalMockClient).forEach(([key, value]) => {
        if (typeof value === 'function' && 'mockClear' in value) {
            (value as Mock).mockClear();
        }
    });
}

/**
 * Destroys the global mock client.
 */
export function destroyMockRedisClient(): void {
    globalMockClient = null;
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Asserts that a key was set with a specific TTL.
 */
export function assertKeyHasTTL(
    client: MockRedisClient,
    key: string,
    expectedTTL: number,
    tolerance = 1
): void {
    const assertions = client._getTTLAssertions();
    const found = assertions.find(
        (a) => a.key === key && Math.abs((a.ttl ?? 0) - expectedTTL) <= tolerance
    );

    if (!found) {
        const actual = assertions.filter((a) => a.key === key);
        throw new Error(
            `Expected key "${key}" to have TTL ${expectedTTL}s, but got: ${actual.length === 0
                ? 'no TTL set'
                : actual.map((a) => `${a.ttl}s`).join(', ')
            }`
        );
    }
}

/**
 * Asserts that a key was accessed (via get).
 */
export function assertKeyAccessed(client: MockRedisClient, key: string): void {
    const calls = client.get.mock.calls;
    const found = calls.some((call) => call[0] === key);

    if (!found) {
        throw new Error(
            `Expected key "${key}" to be accessed via get(), but it was not.\n` +
            `Accessed keys: ${calls.map((c) => c[0]).join(', ') || '(none)'}`
        );
    }
}
