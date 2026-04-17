// API Key Service Tests

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { ApiKeyService } from '@/services/api-key/service';

vi.mock('@/database', () => ({
  default: {
    apiKey: {
      create: vi.fn().mockImplementation((args) => Promise.resolve({ 
        id: 'mock-api-key-id', 
        key: 'cms_test_abc123xyz',
        ...args.data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockImplementation((args) => {
        if (args.where.id === 'non-existent-key') {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          id: args.where.id,
          name: 'Test Key',
          key: 'cms_test_abc123',
          permissions: ['read:bookings'],
          rateLimit: 1000,
          isActive: true,
          createdBy: 'user-123',
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      update: vi.fn().mockImplementation((args) => Promise.resolve({ 
        id: args.where.id, 
        ...args.data,
        updatedAt: new Date(),
      })),
      delete: vi.fn().mockResolvedValue({ id: 'mock-id' }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-123', role: 'ADMIN' }),
    },
  },
}));

vi.mock('@/services/cache.service', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true),
  },
}));

describe('API Key Service', () => {
  let apiKeyService: ApiKeyService;

  beforeEach(() => {
    apiKeyService = new ApiKeyService();
    vi.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('should create an API key with valid data', async () => {
      const apiKey = await apiKeyService.createApiKey({
        name: 'Test API Key',
        permissions: ['read:bookings', 'write:bookings'],
        rateLimit: 1000,
        createdBy: 'user-123',
      });

      expect(apiKey).toBeDefined();
      expect(apiKey.id).toBeDefined();
      expect(apiKey.key).toBeDefined();
      expect(apiKey.key).toMatch(/^cms_(test|live)_/);
      expect(apiKey.name).toBe('Test API Key');
      expect(apiKey.permissions).toEqual(['read:bookings', 'write:bookings']);
      expect(apiKey.rateLimit).toBe(1000);
      expect(apiKey.isActive).toBe(true);
    });

    it('should create an API key with default rate limit', async () => {
      const apiKey = await apiKeyService.createApiKey({
        name: 'Default Rate Limit Key',
        permissions: ['read:sites'],
        createdBy: 'user-123',
      });

      expect(apiKey.rateLimit).toBe(1000);
    });

    it('should create an API key with expiration date', async () => {
      const expiresAt = new Date('2025-12-31');
      const apiKey = await apiKeyService.createApiKey({
        name: 'Expiring Key',
        permissions: ['read:sites'],
        expiresAt,
        createdBy: 'user-123',
      });

      expect(apiKey.expiresAt).toEqual(expiresAt);
    });
  });

  describe('validateApiKey', () => {
    it('should validate a valid API key', async () => {
      const result = await apiKeyService.validateApiKey('cms_test_abc123');

      expect(result.valid).toBe(true);
      expect(result.apiKey).toBeDefined();
    });

    it('should reject an invalid API key', async () => {
      const result = await apiKeyService.validateApiKey('invalid-key');

      expect(result.valid).toBe(false);
      expect(result.apiKey).toBeNull();
    });

    it('should reject an API key with invalid format', async () => {
      const result = await apiKeyService.validateApiKey('not_a_valid_key');

      expect(result.valid).toBe(false);
    });

    it('should reject an expired API key', async () => {
      const result = await apiKeyService.validateApiKey('expired-key');

      expect(result.valid).toBe(false);
    });

    it('should reject a revoked API key', async () => {
      const result = await apiKeyService.validateApiKey('revoked-key');

      expect(result.valid).toBe(false);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const result = await apiKeyService.revokeApiKey('key-123');

      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);
    });
  });

  describe('rotateApiKey', () => {
    it('should rotate an API key', async () => {
      const result = await apiKeyService.rotateApiKey('key-123');

      expect(result).toBeDefined();
      expect(result.key).toMatch(/^cms_(test|live)_/);
    });
  });

  describe('getApiKeyUsage', () => {
    it('should return usage statistics for an API key', async () => {
      const usage = await apiKeyService.getApiKeyUsage('key-123');

      expect(usage).toBeDefined();
      expect(usage.totalRequests).toBeDefined();
      expect(usage.lastRequestAt).toBeDefined();
    });
  });

  describe('listApiKeys', () => {
    it('should list all API keys', async () => {
      const keys = await apiKeyService.listApiKeys({ createdBy: 'user-123' });

      expect(keys).toBeDefined();
      expect(Array.isArray(keys)).toBe(true);
    });

    it('should list API keys by creator', async () => {
      const keys = await apiKeyService.listApiKeys({ createdBy: 'user-123' });

      expect(keys).toBeDefined();
    });
  });

  describe('rate limiting', () => {
    it('should check rate limit correctly', async () => {
      const result = await apiKeyService.checkRateLimit('key-123', 50);

      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
    });

    it('should increment usage counter', async () => {
      await apiKeyService.incrementUsage('key-123');
      const usage = await apiKeyService.getApiKeyUsage('key-123');

      expect(usage.totalRequests).toBeGreaterThan(0);
    });
  });
});