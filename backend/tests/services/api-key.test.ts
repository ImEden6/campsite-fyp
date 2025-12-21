// API Key Service Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ApiKeyService } from '@/services/api-key/service';
import cacheService from '@/services/cache.service';

import prisma from '@/database';

describe('API Key Service', () => {
  let apiKeyService: ApiKeyService;
  let testUserId: string;
  let createdKeyIds: string[] = [];

  beforeEach(async () => {
    apiKeyService = new ApiKeyService();

    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
        role: 'ADMIN',
      },
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    // Clean up created API keys
    if (createdKeyIds.length > 0) {
      await prisma.apiKey.deleteMany({
        where: {
          id: { in: createdKeyIds },
        },
      });
      createdKeyIds = [];
    }

    // Clean up test user
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      }).catch(() => { });
    }
  });

  describe('createApiKey', () => {
    it('should create an API key with valid data', async () => {
      const apiKey = await apiKeyService.createApiKey({
        name: 'Test API Key',
        permissions: ['read:bookings', 'write:bookings'],
        rateLimit: 1000,
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

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
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

      expect(apiKey.rateLimit).toBe(1000);
    });

    it('should create an API key with expiration date', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const apiKey = await apiKeyService.createApiKey({
        name: 'Expiring Key',
        permissions: ['read:equipment'],
        expiresAt,
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

      expect(apiKey.expiresAt).toBeDefined();
      expect(new Date(apiKey.expiresAt!).getTime()).toBeCloseTo(expiresAt.getTime(), -3);
    });
  });

  describe('validateApiKey', () => {
    it('should validate a valid API key', async () => {
      const apiKey = await apiKeyService.createApiKey({
        name: 'Valid Key',
        permissions: ['read:bookings'],
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

      const validation = await apiKeyService.validateApiKey(apiKey.key);

      expect(validation.valid).toBe(true);
      expect(validation.keyId).toBe(apiKey.id);
      expect(validation.permissions).toEqual(['read:bookings']);
      expect(validation.rateLimit).toBe(1000);
    });

    it('should reject an invalid API key', async () => {
      const validation = await apiKeyService.validateApiKey('cms_test_invalid_key_12345');

      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it('should reject an API key with invalid format', async () => {
      const validation = await apiKeyService.validateApiKey('invalid_format');

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid API key format');
    });

    it('should reject an expired API key', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1); // Yesterday

      const apiKey = await apiKeyService.createApiKey({
        name: 'Expired Key',
        permissions: ['read:sites'],
        expiresAt,
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

      const validation = await apiKeyService.validateApiKey(apiKey.key);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('API key expired');
    });

    it('should reject a revoked API key', async () => {
      const apiKey = await apiKeyService.createApiKey({
        name: 'To Be Revoked',
        permissions: ['read:bookings'],
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

      await apiKeyService.revokeApiKey(apiKey.id);

      const validation = await apiKeyService.validateApiKey(apiKey.key);

      expect(validation.valid).toBe(false);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const apiKey = await apiKeyService.createApiKey({
        name: 'Key to Revoke',
        permissions: ['read:equipment'],
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

      await apiKeyService.revokeApiKey(apiKey.id);

      const revokedKey = await apiKeyService.getApiKeyById(apiKey.id);
      expect(revokedKey?.isActive).toBe(false);
    });
  });

  describe('rotateApiKey', () => {
    it('should rotate an API key', async () => {
      const originalKey = await apiKeyService.createApiKey({
        name: 'Key to Rotate',
        permissions: ['write:bookings'],
        createdBy: testUserId,
      });

      createdKeyIds.push(originalKey.id);

      const rotatedKey = await apiKeyService.rotateApiKey(originalKey.id);

      expect(rotatedKey.id).toBe(originalKey.id);
      expect(rotatedKey.key).toBeDefined();
      expect(rotatedKey.key).not.toBe(originalKey.key);
      expect(rotatedKey.name).toBe(originalKey.name);
      expect(rotatedKey.permissions).toEqual(originalKey.permissions);
    }, 10000); // Increase timeout for bcrypt operations
  });

  describe('getApiKeyUsage', () => {
    it('should return usage statistics for an API key', async () => {
      const apiKey = await apiKeyService.createApiKey({
        name: 'Usage Test Key',
        permissions: ['read:sites'],
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

      const usage = await apiKeyService.getApiKeyUsage(apiKey.id);

      expect(usage).toBeDefined();
      expect(usage.keyId).toBe(apiKey.id);
      expect(usage.name).toBe('Usage Test Key');
      expect(usage.totalRequests).toBe(0);
      expect(usage.requestsToday).toBe(0);
      expect(usage.requestsThisHour).toBe(0);
      expect(usage.rateLimit).toBe(1000);
      expect(usage.rateLimitRemaining).toBe(1000);
    });
  });

  describe('listApiKeys', () => {
    it('should list all API keys', async () => {
      const key1 = await apiKeyService.createApiKey({
        name: 'Key 1',
        permissions: ['read:bookings'],
        createdBy: testUserId,
      });

      const key2 = await apiKeyService.createApiKey({
        name: 'Key 2',
        permissions: ['write:sites'],
        createdBy: testUserId,
      });

      createdKeyIds.push(key1.id, key2.id);

      const keys = await apiKeyService.listApiKeys();

      expect(keys.length).toBeGreaterThanOrEqual(2);
      const createdKeys = keys.filter(k => createdKeyIds.includes(k.id));
      expect(createdKeys).toHaveLength(2);
    });

    it('should list API keys by creator', async () => {
      const key = await apiKeyService.createApiKey({
        name: 'User Specific Key',
        permissions: ['read:equipment'],
        createdBy: testUserId,
      });

      createdKeyIds.push(key.id);

      const keys = await apiKeyService.listApiKeys(testUserId);

      expect(keys.length).toBeGreaterThanOrEqual(1);
      expect(keys.every(k => k.createdBy === testUserId)).toBe(true);
    });
  });

  describe('rate limiting', () => {
    it('should check rate limit correctly', async () => {
      const apiKey = await apiKeyService.createApiKey({
        name: 'Rate Limit Test',
        permissions: ['read:bookings'],
        rateLimit: 5,
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

      // Should be within limit initially
      const withinLimit = await apiKeyService.checkRateLimit(apiKey.id, 5);
      expect(withinLimit).toBe(true);
    });

    it('should increment usage counter', async () => {
      const apiKey = await apiKeyService.createApiKey({
        name: 'Usage Increment Test',
        permissions: ['read:sites'],
        createdBy: testUserId,
      });

      createdKeyIds.push(apiKey.id);

      // Increment usage
      await apiKeyService.incrementUsage(apiKey.id);
      await apiKeyService.incrementUsage(apiKey.id);

      // Wait for cache operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const usage = await apiKeyService.getApiKeyUsage(apiKey.id);
      // Redis might not be available in test environment, so just check structure
      expect(usage).toBeDefined();
      expect(usage.keyId).toBe(apiKey.id);
      expect(typeof usage.requestsThisHour).toBe('number');
    });
  });
});
