// API Key Service Implementation

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '@/config';
import logger from '@/utils/logger';
import cacheService from '@/services/cache.service';
import {
  IApiKeyService,
  CreateApiKeyData,
  ApiKey,
  ApiKeyWithPlainKey,
  ApiKeyValidation,
  ApiKeyUsage,
} from './types';

const prisma = new PrismaClient();

export class ApiKeyService implements IApiKeyService {
  private readonly KEY_PREFIX = 'cms_';
  private readonly KEY_LENGTH = 32; // bytes
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly USAGE_WINDOW_HOUR = 3600; // 1 hour in seconds
  private readonly USAGE_WINDOW_DAY = 86400; // 1 day in seconds

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    const randomBytes = crypto.randomBytes(this.KEY_LENGTH);
    const base64Key = randomBytes.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const environment = config.server.nodeEnv === 'production' ? 'live' : 'test';
    return `${this.KEY_PREFIX}${environment}_${base64Key}`;
  }

  /**
   * Hash an API key for storage
   */
  private async hashApiKey(key: string): Promise<string> {
    return bcrypt.hash(key, config.security.bcryptRounds);
  }

  /**
   * Verify an API key against a hash
   */
  private async verifyApiKey(key: string, hash: string): Promise<boolean> {
    return bcrypt.compare(key, hash);
  }

  /**
   * Get cache key for API key validation
   */
  private getCacheKey(keyHash: string): string {
    return `api_key:${keyHash}`;
  }

  /**
   * Get cache key for rate limiting
   */
  private getRateLimitKey(keyId: string, window: 'hour' | 'day'): string {
    const now = new Date();
    if (window === 'hour') {
      const hourKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
      return `api_key:rate_limit:hour:${keyId}:${hourKey}`;
    } else {
      const dayKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
      return `api_key:rate_limit:day:${keyId}:${dayKey}`;
    }
  }

  /**
   * Get cache key for total usage
   */
  private getTotalUsageKey(keyId: string): string {
    return `api_key:usage:total:${keyId}`;
  }

  /**
   * Create a new API key
   */
  async createApiKey(data: CreateApiKeyData): Promise<ApiKeyWithPlainKey> {
    try {
      // Generate plain text key
      const plainKey = this.generateApiKey();
      
      // Hash the key for storage
      const keyHash = await this.hashApiKey(plainKey);

      // Create API key in database
      const apiKey = await prisma.apiKey.create({
        data: {
          name: data.name,
          keyHash,
          permissions: data.permissions,
          rateLimit: data.rateLimit || 1000,
          expiresAt: data.expiresAt || null,
          createdBy: data.createdBy,
        },
      });

      logger.info('API key created', {
        keyId: apiKey.id,
        name: apiKey.name,
        createdBy: data.createdBy,
      });

      return {
        id: apiKey.id,
        name: apiKey.name,
        key: plainKey, // Only returned once
        permissions: apiKey.permissions as string[],
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        isActive: apiKey.isActive,
        createdBy: apiKey.createdBy,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      };
    } catch (error) {
      logger.error('Failed to create API key', error, { name: data.name });
      throw error;
    }
  }

  /**
   * Validate an API key
   */
  async validateApiKey(key: string): Promise<ApiKeyValidation> {
    try {
      // Check if key format is valid
      if (!key.startsWith(this.KEY_PREFIX)) {
        return {
          valid: false,
          error: 'Invalid API key format',
        };
      }

      // Try to find the API key by checking all active keys
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          isActive: true,
        },
      });

      let matchedKey: any = null;
      
      // Check each key hash
      for (const apiKey of apiKeys) {
        const isMatch = await this.verifyApiKey(key, apiKey.keyHash);
        if (isMatch) {
          matchedKey = apiKey;
          break;
        }
      }

      if (!matchedKey) {
        return {
          valid: false,
          error: 'Invalid API key',
        };
      }

      // Check if key is expired
      if (matchedKey.expiresAt && new Date(matchedKey.expiresAt) < new Date()) {
        return {
          valid: false,
          error: 'API key expired',
        };
      }

      // Update last used timestamp (async, don't wait)
      prisma.apiKey.update({
        where: { id: matchedKey.id },
        data: { lastUsedAt: new Date() },
      }).catch((error) => {
        logger.error('Failed to update API key last used timestamp', error);
      });

      // Cache the validation result
      await cacheService.set(
        this.getCacheKey(matchedKey.keyHash),
        {
          keyId: matchedKey.id,
          permissions: matchedKey.permissions,
          rateLimit: matchedKey.rateLimit,
        },
        this.CACHE_TTL
      );

      return {
        valid: true,
        keyId: matchedKey.id,
        permissions: matchedKey.permissions as string[],
        rateLimit: matchedKey.rateLimit,
      };
    } catch (error) {
      logger.error('API key validation error', error);
      return {
        valid: false,
        error: 'Validation error',
      };
    }
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    try {
      const apiKey = await prisma.apiKey.update({
        where: { id: keyId },
        data: { isActive: false },
      });

      // Clear cache
      await cacheService.delete(this.getCacheKey(apiKey.keyHash));

      logger.info('API key revoked', {
        keyId,
        name: apiKey.name,
      });
    } catch (error) {
      logger.error('Failed to revoke API key', error, { keyId });
      throw error;
    }
  }

  /**
   * Rotate an API key (create new key, revoke old one)
   */
  async rotateApiKey(keyId: string): Promise<ApiKeyWithPlainKey> {
    try {
      // Get existing key
      const existingKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });

      if (!existingKey) {
        throw new Error('API key not found');
      }

      // Generate new key
      const plainKey = this.generateApiKey();
      const keyHash = await this.hashApiKey(plainKey);

      // Update the key
      const updatedKey = await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          keyHash,
          lastUsedAt: null,
          updatedAt: new Date(),
        },
      });

      // Clear old cache
      await cacheService.delete(this.getCacheKey(existingKey.keyHash));

      logger.info('API key rotated', {
        keyId,
        name: updatedKey.name,
      });

      return {
        id: updatedKey.id,
        name: updatedKey.name,
        key: plainKey, // Return new plain key
        permissions: updatedKey.permissions as string[],
        rateLimit: updatedKey.rateLimit,
        expiresAt: updatedKey.expiresAt,
        lastUsedAt: updatedKey.lastUsedAt,
        isActive: updatedKey.isActive,
        createdBy: updatedKey.createdBy,
        createdAt: updatedKey.createdAt,
        updatedAt: updatedKey.updatedAt,
      };
    } catch (error) {
      logger.error('Failed to rotate API key', error, { keyId });
      throw error;
    }
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyUsage(keyId: string): Promise<ApiKeyUsage> {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });

      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Get usage from cache
      const totalRequests = await cacheService.get<number>(this.getTotalUsageKey(keyId)) || 0;
      const requestsThisHour = await cacheService.get<number>(this.getRateLimitKey(keyId, 'hour')) || 0;
      const requestsToday = await cacheService.get<number>(this.getRateLimitKey(keyId, 'day')) || 0;

      return {
        keyId: apiKey.id,
        name: apiKey.name,
        totalRequests,
        requestsToday,
        requestsThisHour,
        lastUsedAt: apiKey.lastUsedAt,
        rateLimit: apiKey.rateLimit,
        rateLimitRemaining: Math.max(0, apiKey.rateLimit - requestsThisHour),
      };
    } catch (error) {
      logger.error('Failed to get API key usage', error, { keyId });
      throw error;
    }
  }

  /**
   * List API keys
   */
  async listApiKeys(createdBy?: string): Promise<ApiKey[]> {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: createdBy ? { createdBy } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      return apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        permissions: key.permissions as string[],
        rateLimit: key.rateLimit,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        isActive: key.isActive,
        createdBy: key.createdBy,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      }));
    } catch (error) {
      logger.error('Failed to list API keys', error);
      throw error;
    }
  }

  /**
   * Get API key by ID
   */
  async getApiKeyById(keyId: string): Promise<ApiKey | null> {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });

      if (!apiKey) {
        return null;
      }

      return {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions as string[],
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        isActive: apiKey.isActive,
        createdBy: apiKey.createdBy,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      };
    } catch (error) {
      logger.error('Failed to get API key', error, { keyId });
      throw error;
    }
  }

  /**
   * Increment usage counter for rate limiting
   */
  async incrementUsage(keyId: string): Promise<void> {
    try {
      // Increment hourly counter
      const hourKey = this.getRateLimitKey(keyId, 'hour');
      await cacheService.increment(hourKey, 1);
      await cacheService.expire(hourKey, this.USAGE_WINDOW_HOUR);

      // Increment daily counter
      const dayKey = this.getRateLimitKey(keyId, 'day');
      await cacheService.increment(dayKey, 1);
      await cacheService.expire(dayKey, this.USAGE_WINDOW_DAY);

      // Increment total counter
      const totalKey = this.getTotalUsageKey(keyId);
      await cacheService.increment(totalKey, 1);
    } catch (error) {
      logger.error('Failed to increment API key usage', error, { keyId });
    }
  }

  /**
   * Check rate limit for an API key
   */
  async checkRateLimit(keyId: string, rateLimit: number): Promise<boolean> {
    try {
      const hourKey = this.getRateLimitKey(keyId, 'hour');
      const currentUsage = await cacheService.get<number>(hourKey) || 0;
      
      return currentUsage < rateLimit;
    } catch (error) {
      logger.error('Failed to check rate limit', error, { keyId });
      return true; // Allow on error
    }
  }
}

// Export singleton instance
export default new ApiKeyService();
