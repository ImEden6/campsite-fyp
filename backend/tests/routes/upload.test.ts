// Upload Routes Integration Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import uploadRoutes from '@/routes/upload.routes';
import { errorHandler } from '@/utils/errors';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const app = express();
app.use(express.json());
app.use('/api/v1', uploadRoutes);
app.use(errorHandler);

const prisma = new PrismaClient();

describe('Upload Routes', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
        role: 'CUSTOMER',
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test user
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      }).catch(() => {
        // User might already be deleted
      });
    }
  });

  describe('POST /api/v1/users/:userId/avatar', () => {
    it('should upload avatar successfully', async () => {
      const buffer = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      }).jpeg().toBuffer();

      const response = await request(app)
        .post(`/api/v1/users/${testUserId}/avatar`)
        .attach('avatar', buffer, 'test.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Avatar uploaded successfully');
      expect(response.body.data.url).toBeDefined();
      expect(response.body.data.mimeType).toBe('image/webp');
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${testUserId}/avatar`);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject upload for non-existent user', async () => {
      const buffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 255, b: 0 }
        }
      }).jpeg().toBuffer();

      const response = await request(app)
        .post('/api/v1/users/non-existent-id/avatar')
        .attach('avatar', buffer, 'test.jpg');

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject files larger than 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const response = await request(app)
        .post(`/api/v1/users/${testUserId}/avatar`)
        .attach('avatar', largeBuffer, 'large.jpg');

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error).toBeDefined();
    });

    it('should replace existing avatar', async () => {
      // Upload first avatar
      const buffer1 = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      }).jpeg().toBuffer();

      await request(app)
        .post(`/api/v1/users/${testUserId}/avatar`)
        .attach('avatar', buffer1, 'avatar1.jpg')
        .expect(200);

      // Upload second avatar
      const buffer2 = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 0, b: 255 }
        }
      }).jpeg().toBuffer();

      const response = await request(app)
        .post(`/api/v1/users/${testUserId}/avatar`)
        .attach('avatar', buffer2, 'avatar2.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify user has new avatar
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { avatar: true, avatarKey: true },
      });

      expect(user?.avatar).toBeDefined();
      expect(user?.avatarKey).toBeDefined();
    });
  });

  describe('DELETE /api/v1/users/:userId/avatar', () => {
    it('should delete avatar successfully', async () => {
      // First upload an avatar
      const buffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 0 }
        }
      }).jpeg().toBuffer();

      await request(app)
        .post(`/api/v1/users/${testUserId}/avatar`)
        .attach('avatar', buffer, 'test.jpg')
        .expect(200);

      // Then delete it
      const response = await request(app)
        .delete(`/api/v1/users/${testUserId}/avatar`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Avatar deleted successfully');

      // Verify avatar is removed from user
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { avatar: true, avatarKey: true },
      });

      expect(user?.avatar).toBeNull();
      expect(user?.avatarKey).toBeNull();
    });

    it('should return error when deleting non-existent avatar', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${testUserId}/avatar`);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/v1/users/non-existent-id/avatar');

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
