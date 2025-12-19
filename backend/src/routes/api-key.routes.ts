// API Key Management Routes

import { Router, Request, Response, NextFunction } from 'express';
import { apiKeyService } from '@/services/api-key';
import { authenticate, authorize } from '@/middleware/auth';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

/**
 * POST /admin/api-keys
 * Create a new API key
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, permissions, rateLimit, expiresAt } = req.body;

    // Validate required fields
    if (!name || !permissions) {
      throw new ApiError(400, 'Name and permissions are required');
    }

    if (!Array.isArray(permissions)) {
      throw new ApiError(400, 'Permissions must be an array');
    }

    // Validate expiration date if provided
    let expirationDate: Date | undefined;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime())) {
        throw new ApiError(400, 'Invalid expiration date');
      }
      if (expirationDate <= new Date()) {
        throw new ApiError(400, 'Expiration date must be in the future');
      }
    }

    // Create API key
    const apiKey = await apiKeyService.createApiKey({
      name,
      permissions,
      rateLimit: rateLimit || 1000,
      expiresAt: expirationDate,
      createdBy: req.user!.id,
    });

    logger.info('API key created via endpoint', {
      keyId: apiKey.id,
      name: apiKey.name,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: apiKey,
      message: 'API key created successfully. Save the key securely - it will not be shown again.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/api-keys
 * List all API keys
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Managers can only see their own keys, admins can see all
    const createdBy = req.user!.role === 'MANAGER' ? req.user!.id : undefined;
    
    const apiKeys = await apiKeyService.listApiKeys(createdBy);

    res.json({
      success: true,
      data: apiKeys,
      count: apiKeys.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/api-keys/:id
 * Get a specific API key
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const apiKey = await apiKeyService.getApiKeyById(id!);

    if (!apiKey) {
      throw new ApiError(404, 'API key not found');
    }

    // Managers can only view their own keys
    if (req.user!.role === 'MANAGER' && apiKey.createdBy !== req.user!.id) {
      throw new ApiError(403, 'Access denied');
    }

    res.json({
      success: true,
      data: apiKey,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /admin/api-keys/:id
 * Revoke an API key
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if key exists
    const apiKey = await apiKeyService.getApiKeyById(id!);

    if (!apiKey) {
      throw new ApiError(404, 'API key not found');
    }

    // Managers can only revoke their own keys
    if (req.user!.role === 'MANAGER' && apiKey.createdBy !== req.user!.id) {
      throw new ApiError(403, 'Access denied');
    }

    await apiKeyService.revokeApiKey(id!);

    logger.info('API key revoked via endpoint', {
      keyId: id,
      name: apiKey.name,
      revokedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/api-keys/:id/rotate
 * Rotate an API key (generate new key)
 */
router.post('/:id/rotate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if key exists
    const existingKey = await apiKeyService.getApiKeyById(id!);

    if (!existingKey) {
      throw new ApiError(404, 'API key not found');
    }

    // Managers can only rotate their own keys
    if (req.user!.role === 'MANAGER' && existingKey.createdBy !== req.user!.id) {
      throw new ApiError(403, 'Access denied');
    }

    const apiKey = await apiKeyService.rotateApiKey(id!);

    logger.info('API key rotated via endpoint', {
      keyId: id,
      name: apiKey.name,
      rotatedBy: req.user!.id,
    });

    res.json({
      success: true,
      data: apiKey,
      message: 'API key rotated successfully. Save the new key securely - it will not be shown again.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/api-keys/:id/usage
 * Get usage statistics for an API key
 */
router.get('/:id/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if key exists
    const apiKey = await apiKeyService.getApiKeyById(id!);

    if (!apiKey) {
      throw new ApiError(404, 'API key not found');
    }

    // Managers can only view usage for their own keys
    if (req.user!.role === 'MANAGER' && apiKey.createdBy !== req.user!.id) {
      throw new ApiError(403, 'Access denied');
    }

    const usage = await apiKeyService.getApiKeyUsage(id!);

    res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
