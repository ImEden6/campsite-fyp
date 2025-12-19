// Upload Service Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalUploadService } from '@/services/upload/local';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

describe('Upload Service', () => {
  describe('LocalUploadService', () => {
    let uploadService: LocalUploadService;
    const testUploadDir = './test-uploads';

    beforeEach(() => {
      uploadService = new LocalUploadService();
    });

    afterEach(async () => {
      // Clean up test files
      try {
        const files = await fs.readdir(testUploadDir);
        for (const file of files) {
          await fs.unlink(path.join(testUploadDir, file));
        }
        await fs.rmdir(testUploadDir);
      } catch (error) {
        // Directory might not exist
      }
    });

    describe('File Validation', () => {
      it('should reject files larger than 5MB', async () => {
        const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
        const file = {
          buffer: largeBuffer,
          originalname: 'large.jpg',
          mimetype: 'image/jpeg',
          size: largeBuffer.length,
        } as Express.Multer.File;

        await expect(uploadService.uploadAvatar(file, 'user123')).rejects.toThrow();
      });

      it('should reject invalid file types', async () => {
        const buffer = Buffer.from('test');
        const file = {
          buffer,
          originalname: 'test.txt',
          mimetype: 'text/plain',
          size: buffer.length,
        } as Express.Multer.File;

        await expect(uploadService.uploadAvatar(file, 'user123')).rejects.toThrow();
      });

      it('should accept valid JPEG files', async () => {
        // Create a valid JPEG buffer
        const buffer = await sharp({
          create: {
            width: 100,
            height: 100,
            channels: 3,
            background: { r: 255, g: 0, b: 0 }
          }
        }).jpeg().toBuffer();

        const file = {
          buffer,
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        const result = await uploadService.uploadAvatar(file, 'user123');
        
        expect(result).toBeDefined();
        expect(result.url).toContain('/uploads/');
        expect(result.key).toContain('avatar_user123');
        expect(result.mimeType).toBe('image/webp');
      });

      it('should accept valid PNG files', async () => {
        const buffer = await sharp({
          create: {
            width: 100,
            height: 100,
            channels: 4,
            background: { r: 0, g: 255, b: 0, alpha: 1 }
          }
        }).png().toBuffer();

        const file = {
          buffer,
          originalname: 'test.png',
          mimetype: 'image/png',
          size: buffer.length,
        } as Express.Multer.File;

        const result = await uploadService.uploadAvatar(file, 'user456');
        
        expect(result).toBeDefined();
        expect(result.key).toContain('avatar_user456');
      });
    });

    describe('Image Processing', () => {
      it('should resize images to 512x512', async () => {
        const buffer = await sharp({
          create: {
            width: 1000,
            height: 1000,
            channels: 3,
            background: { r: 0, g: 0, b: 255 }
          }
        }).jpeg().toBuffer();

        const file = {
          buffer,
          originalname: 'large.jpg',
          mimetype: 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        const result = await uploadService.uploadAvatar(file, 'user789');
        
        expect(result).toBeDefined();
        expect(result.mimeType).toBe('image/webp');
      });

      it('should convert images to WebP format', async () => {
        const buffer = await sharp({
          create: {
            width: 200,
            height: 200,
            channels: 3,
            background: { r: 128, g: 128, b: 128 }
          }
        }).jpeg().toBuffer();

        const file = {
          buffer,
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        const result = await uploadService.uploadAvatar(file, 'user999');
        
        expect(result.mimeType).toBe('image/webp');
        expect(result.key).toMatch(/\.webp$/);
      });
    });

    describe('File Operations', () => {
      it('should generate unique filenames', async () => {
        const buffer = await sharp({
          create: {
            width: 100,
            height: 100,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        }).jpeg().toBuffer();

        const file = {
          buffer,
          originalname: 'avatar.jpg',
          mimetype: 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        const result1 = await uploadService.uploadAvatar(file, 'user1');
        const result2 = await uploadService.uploadAvatar(file, 'user1');
        
        expect(result1.key).not.toBe(result2.key);
      });

      it('should delete avatar files', async () => {
        const buffer = await sharp({
          create: {
            width: 100,
            height: 100,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        }).jpeg().toBuffer();

        const file = {
          buffer,
          originalname: 'avatar.jpg',
          mimetype: 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        const result = await uploadService.uploadAvatar(file, 'user123');
        
        // Delete should not throw
        await expect(uploadService.deleteAvatar(result.key)).resolves.not.toThrow();
      });

      it('should handle deletion of non-existent files gracefully', async () => {
        await expect(uploadService.deleteAvatar('non-existent.jpg')).resolves.not.toThrow();
      });

      it('should generate correct file URLs', () => {
        const url = uploadService.getFileUrl('avatar_user123_123456.webp');
        expect(url).toBe('/uploads/avatar_user123_123456.webp');
      });
    });
  });
});
