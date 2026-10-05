// API Key Service Tests
//
// Uses a small in-memory stand-in for the database and cache, but the real service code and
// real bcrypt hashing, so a key created by the service really validates (or not) end to end.

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { store, counters } = vi.hoisted(() => ({
  store: { rows: new Map<string, Record<string, any>>(), nextId: 1 },
  counters: new Map<string, number>(),
}));

vi.mock('@/database', () => ({
  default: {
    apiKey: {
      create: vi.fn(async ({ data }: { data: Record<string, any> }) => {
        const now = new Date();
        const row = {
          id: `key-${store.nextId++}`,
          isActive: true,
          lastUsedAt: null,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        store.rows.set(row.id, row);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => store.rows.get(where.id) ?? null),
      findMany: vi.fn(async ({ where }: { where?: { isActive?: boolean; createdBy?: string } } = {}) =>
        [...store.rows.values()].filter(
          (row) =>
            (where?.isActive === undefined || row.isActive === where.isActive) &&
            (where?.createdBy === undefined || row.createdBy === where.createdBy)
        )
      ),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, any> }) => {
        const row = store.rows.get(where.id);
        if (!row) throw new Error('Record to update not found');
        Object.assign(row, data);
        return row;
      }),
    },
  },
}));

vi.mock('@/services/cache.service', () => ({
  default: {
    get: vi.fn(async (key: string) => counters.get(key) ?? null),
    set: vi.fn(async () => true),
    delete: vi.fn(async () => true),
    increment: vi.fn(async (key: string, by: number) => {
      counters.set(key, (counters.get(key) ?? 0) + by);
      return counters.get(key);
    }),
    expire: vi.fn(async () => true),
  },
}));

import { ApiKeyService } from '@/services/api-key/service';
import prisma from '@/database';

describe('API Key Service', () => {
  let service: ApiKeyService;

  const create = (overrides: Record<string, unknown> = {}) =>
    service.createApiKey({ name: 'Test Key', permissions: ['read:bookings'], createdBy: 'user-123', ...overrides });

  beforeEach(() => {
    service = new ApiKeyService();
    store.rows.clear();
    store.nextId = 1;
    counters.clear();
  });

  describe('createApiKey', () => {
    it('returns the plain key once and stores only its hash', async () => {
      const key = await create({ permissions: ['read:bookings', 'write:bookings'], rateLimit: 500 });

      expect(key.key).toMatch(/^cms_(test|live)_/);
      expect(key).toMatchObject({ name: 'Test Key', permissions: ['read:bookings', 'write:bookings'], rateLimit: 500, isActive: true });

      const stored = store.rows.get(key.id)!;
      expect(stored.keyHash).toBeDefined();
      expect(stored.keyHash).not.toContain(key.key);
      expect(JSON.stringify(stored)).not.toContain(key.key);
    });

    it('defaults the rate limit to 1000 an hour', async () => {
      expect((await create()).rateLimit).toBe(1000);
    });

    it('keeps an expiry date', async () => {
      const expiresAt = new Date('2099-12-31');
      expect((await create({ expiresAt })).expiresAt).toEqual(expiresAt);
    });

    it('gives every key a different secret', async () => {
      expect((await create()).key).not.toBe((await create()).key);
    });
  });

  describe('validateApiKey', () => {
    it('accepts a key the service created, with its permissions and rate limit', async () => {
      const created = await create({ permissions: ['read:sites'], rateLimit: 42 });

      expect(await service.validateApiKey(created.key)).toEqual({
        valid: true,
        keyId: created.id,
        permissions: ['read:sites'],
        rateLimit: 42,
      });
    });

    it('finds the right key among several', async () => {
      await create({ name: 'First' });
      const second = await create({ name: 'Second' });
      await create({ name: 'Third' });

      expect(await service.validateApiKey(second.key)).toMatchObject({ valid: true, keyId: second.id });
    });

    it('rejects a key with the wrong prefix without touching the database', async () => {
      const result = await service.validateApiKey('not_a_valid_key');

      expect(result).toEqual({ valid: false, error: 'Invalid API key format' });
      expect(prisma.apiKey.findMany).not.toHaveBeenCalled();
    });

    it('rejects a well-formed key that was never issued', async () => {
      await create();

      expect(await service.validateApiKey('cms_test_never-issued-secret')).toEqual({ valid: false, error: 'Invalid API key' });
    });

    it('rejects an expired key', async () => {
      const created = await create({ expiresAt: new Date(Date.now() - 60_000) });

      expect(await service.validateApiKey(created.key)).toEqual({ valid: false, error: 'API key expired' });
    });

    it('accepts a key that has not expired yet', async () => {
      const created = await create({ expiresAt: new Date(Date.now() + 3_600_000) });

      expect((await service.validateApiKey(created.key)).valid).toBe(true);
    });

    it('rejects a revoked key', async () => {
      const created = await create();
      await service.revokeApiKey(created.id);

      expect((await service.validateApiKey(created.key)).valid).toBe(false);
    });

    it('records when a key was last used', async () => {
      const created = await create();

      await service.validateApiKey(created.key);
      await vi.waitFor(() => expect(store.rows.get(created.id)!.lastUsedAt).toBeInstanceOf(Date));
    });
  });

  describe('revokeApiKey', () => {
    it('deactivates the key', async () => {
      const created = await create();

      await expect(service.revokeApiKey(created.id)).resolves.toBeUndefined();
      expect(store.rows.get(created.id)!.isActive).toBe(false);
    });

    it('fails for a key that does not exist', async () => {
      await expect(service.revokeApiKey('missing')).rejects.toThrow();
    });
  });

  describe('rotateApiKey', () => {
    it('issues a new secret and stops the old one working', async () => {
      const created = await create();

      const rotated = await service.rotateApiKey(created.id);

      expect(rotated.id).toBe(created.id);
      expect(rotated.key).toMatch(/^cms_(test|live)_/);
      expect(rotated.key).not.toBe(created.key);
      expect((await service.validateApiKey(rotated.key)).valid).toBe(true);
      expect((await service.validateApiKey(created.key)).valid).toBe(false);
    });

    it('fails for a key that does not exist', async () => {
      await expect(service.rotateApiKey('missing')).rejects.toThrow('API key not found');
    });
  });

  describe('listApiKeys / getApiKeyById', () => {
    it('lists keys without exposing hashes or secrets, optionally for one creator', async () => {
      await create({ createdBy: 'alice' });
      await create({ createdBy: 'alice' });
      await create({ createdBy: 'bob' });

      const all = await service.listApiKeys();
      const alices = await service.listApiKeys('alice');

      expect(all).toHaveLength(3);
      expect(alices).toHaveLength(2);
      expect(alices.every((k) => k.createdBy === 'alice')).toBe(true);
      expect(JSON.stringify(all)).not.toMatch(/keyHash|cms_test_/);
    });

    it('returns one key by id, or null', async () => {
      const created = await create();

      expect(await service.getApiKeyById(created.id)).toMatchObject({ id: created.id, name: 'Test Key' });
      expect(await service.getApiKeyById('missing')).toBeNull();
    });
  });

  describe('usage and rate limiting', () => {
    it('counts requests for a key', async () => {
      const created = await create({ rateLimit: 100 });

      await service.incrementUsage(created.id);
      await service.incrementUsage(created.id);
      await service.incrementUsage(created.id);
      const usage = await service.getApiKeyUsage(created.id);

      expect(usage).toMatchObject({
        keyId: created.id,
        name: 'Test Key',
        totalRequests: 3,
        requestsThisHour: 3,
        requestsToday: 3,
        rateLimit: 100,
        rateLimitRemaining: 97,
      });
    });

    it('reports no usage for a key that has not been used', async () => {
      const created = await create();

      expect(await service.getApiKeyUsage(created.id)).toMatchObject({ totalRequests: 0, requestsThisHour: 0, rateLimitRemaining: 1000 });
    });

    it('never reports a negative remaining allowance', async () => {
      const created = await create({ rateLimit: 2 });
      for (let i = 0; i < 5; i++) await service.incrementUsage(created.id);

      expect((await service.getApiKeyUsage(created.id)).rateLimitRemaining).toBe(0);
    });

    it('fails to report usage for a key that does not exist', async () => {
      await expect(service.getApiKeyUsage('missing')).rejects.toThrow('API key not found');
    });

    it('allows requests under the hourly limit and blocks them at the limit', async () => {
      const created = await create();

      expect(await service.checkRateLimit(created.id, 2)).toBe(true);
      await service.incrementUsage(created.id);
      expect(await service.checkRateLimit(created.id, 2)).toBe(true);
      await service.incrementUsage(created.id);
      expect(await service.checkRateLimit(created.id, 2)).toBe(false);
    });
  });
});
