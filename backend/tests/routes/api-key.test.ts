// API Key Routes Integration Tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import apiKeyRoutes from '@/routes/api-key.routes';
import { errorHandler } from '@/utils/errors';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config';

const app = express();
app.use(express.json());
app.use('/api/v1/admin/api-keys', apiKeyRoutes);
app.use(errorHandler);

const prisma = new PrismaClient();

describe('API Key Routes', () => {
  let adminToken: string;
  let managerToken: string;
  let adminUserId: string;
  let managerUserId: string;
  let createdKeyIds: string[] = [];

  beforeEach(async () => {
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@example.com`,
        firstName: 'Admin',
        lastName: 'User',
        password: 'hashedpassword',
        role: 'ADMIN',
      },
    });
    adminUserId = adminUser.id;

    // Create manager user
    const managerUser = await prisma.user.create({
      data: {
        email: `manager-${Date.now()}@example.com`,
        firstName: 'Manager',
        lastName: 'User',
        password: 'hashedpassword',
        role: 'MANAGER',
      },
    });
    managerUserId = managerUser.id;

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUserId, email: adminUser.email, role: 'ADMIN' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    managerToken = jwt.sign(
      { userId: managerUserId, email: managerUser.email, role: 'MANAGER' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Clean up created API keys
    if (createdKeyIds.length > 0) {
      await prisma.apiKey.deleteMany({
        where: { id: { in: createdKeyIds } },
      });
      createdKeyIds = [];
    }

    // Clean up test users
    if (adminUserId) {
      await prisma.user.delete({ where: { id: adminUserId } }).catch(() => {});
    }
    if (managerUserId) {
      await prisma.user.delete({ where: { id: managerUserId } }).catch(() => {});
    }
  });

  describe('POST /api/v1/admin/api-keys', () => {
    it('should create an API key with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test API Key',
          permissions: ['read:bookings', 'write:bookings'],
          rateLimit: 1000,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.key).toBeDefined();
      expect(response.body.data.key).toMatch(/^cms_(test|live)_/);
      expect(response.body.data.name).toBe('Test API Key');

      createdKeyIds.push(response.body.data.id);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/admin/api-keys')
        .send({
          name: 'Test Key',
          permissions: ['read:bookings'],
        });

      expect(response.status).toBe(401);
    });

    it('should reject request with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Key',
          // Missing permissions
        });

      expect(response.status).toBe(400);
    });

    it('should reject request with invalid permissions format', async () => {
      const response = await request(app)
        .post('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Key',
          permissions: 'not-an-array',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/api-keys', () => {
    it('should list all API keys for admin', async () => {
      // Create a test key
      const createResponse = await request(app)
        .post('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'List Test Key',
          permissions: ['read:sites'],
        });

      createdKeyIds.push(createResponse.body.data.id);

      const response = await request(app)
        .get('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it('should list only own keys for manager', async () => {
      // Create key as manager
      const createResponse = await request(app)
        .post('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Manager Key',
          permissions: ['read:equipment'],
        });

      createdKeyIds.push(createResponse.body.data.id);

      const response = await request(app)
        .get('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((key: any) => key.createdBy === managerUserId)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/api-keys/:id', () => {
    it('should get a specific API key', async () => {
      const createResponse = await request(app)
        .post('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Get Test Key',
          permissions: ['read:bookings'],
        });

      const keyId = createResponse.body.data.id;
      createdKeyIds.push(keyId);

      const response = await request(app)
        .get(`/api/v1/admin/api-keys/${keyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(keyId);
      expect(response.body.data.name).toBe('Get Test Key');
    });

    it('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .get('/api/v1/admin/api-keys/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/admin/api-keys/:id', () => {
    it('should revoke an API key', async () => {
      const createResponse = await request(app)
        .post('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Key to Revoke',
          permissions: ['read:sites'],
        });

      const keyId = createResponse.body.data.id;
      createdKeyIds.push(keyId);

      const response = await request(app)
        .delete(`/api/v1/admin/api-keys/${keyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify key is revoked
      const getResponse = await request(app)
        .get(`/api/v1/admin/api-keys/${keyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.body.data.isActive).toBe(false);
    });

    it('should return 404 when revoking non-existent key', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/api-keys/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/admin/api-keys/:id/rotate', () => {
    it('should rotate an API key', async () => {
      const createResponse = await request(app)
        .post('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Key to Rotate',
          permissions: ['write:bookings'],
        });

      const keyId = createResponse.body.data.id;
      const originalKey = createResponse.body.data.key;
      createdKeyIds.push(keyId);

      const response = await request(app)
        .post(`/api/v1/admin/api-keys/${keyId}/rotate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBeDefined();
      expect(response.body.data.key).not.toBe(originalKey);
      expect(response.body.data.id).toBe(keyId);
    });

    it('should return 404 when rotating non-existent key', async () => {
      const response = await request(app)
        .post('/api/v1/admin/api-keys/non-existent-id/rotate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/admin/api-keys/:id/usage', () => {
    it('should get usage statistics for an API key', async () => {
      const createResponse = await request(app)
        .post('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Usage Test Key',
          permissions: ['read:equipment'],
        });

      const keyId = createResponse.body.data.id;
      createdKeyIds.push(keyId);

      const response = await request(app)
        .get(`/api/v1/admin/api-keys/${keyId}/usage`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.keyId).toBe(keyId);
      expect(response.body.data.totalRequests).toBeDefined();
      expect(response.body.data.rateLimit).toBeDefined();
    });

    it('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .get('/api/v1/admin/api-keys/non-existent-id/usage')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
