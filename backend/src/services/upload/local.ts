// Local Upload Service Implementation

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { IUploadService, UploadResult, ImageProcessingOptions } from './types';
import { config } from '@/config';
import logger from '@/utils/logger';
import { ValidationError } from '@/utils/errors';

export class LocalUploadService implements IUploadService {
  private uploadDir: string;
  private staticPath: string;

  constructor() {
    this.uploadDir = path.resolve(config.upload.path);
    this.staticPath = config.upload.staticPath;
    this.ensureUploadDirectory();
  }

  // Ensure upload directory exists
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info('Upload directory created', { path: this.uploadDir });
    }
  }

  // Generate unique filename
  private generateFilename(originalName: string, userId: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `avatar_${userId}_${timestamp}_${random}${ext}`;
  }

  // Validate file
  private validateFile(file: Express.Multer.File): void {
    // Check file size (5MB limit for avatars)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new ValidationError([{
        field: 'avatar',
        message: 'File size exceeds 5MB limit',
        code: 'FILE_TOO_LARGE',
      }]);
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError([{
        field: 'avatar',
        message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
        code: 'INVALID_FILE_TYPE',
      }]);
    }

    // Validate magic numbers (file signature)
    this.validateMagicNumbers(file.buffer);
  }

  // Validate file magic numbers to prevent file type spoofing
  private validateMagicNumbers(buffer: Buffer): void {
    const magicNumbers = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF
    };

    const isValid = Object.values(magicNumbers).some(signature => {
      return signature.every((byte, index) => buffer[index] === byte);
    });

    if (!isValid) {
      throw new ValidationError([{
        field: 'avatar',
        message: 'File content does not match file type',
        code: 'INVALID_FILE_CONTENT',
      }]);
    }
  }

  // Process image (resize and optimize)
  private async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<Buffer> {
    const {
      width = 512,
      height = 512,
      format = 'webp',
      quality = 85,
    } = options;

    try {
      return await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .toFormat(format, { quality })
        .toBuffer();
    } catch (error) {
      logger.error('Image processing failed', error);
      throw new ValidationError([{
        field: 'avatar',
        message: 'Failed to process image',
        code: 'IMAGE_PROCESSING_FAILED',
      }]);
    }
  }

  // Upload avatar
  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Process image
      const processedBuffer = await this.processImage(file.buffer);

      // Generate filename with .webp extension
      const filename = this.generateFilename(file.originalname, userId).replace(/\.[^.]+$/, '.webp');
      const filePath = path.join(this.uploadDir, filename);

      // Save file
      await fs.writeFile(filePath, processedBuffer);

      // Generate URL
      const url = `${this.staticPath}/${filename}`;

      logger.info('Avatar uploaded successfully', {
        userId,
        filename,
        size: processedBuffer.length,
      });

      return {
        url,
        key: filename,
        size: processedBuffer.length,
        mimeType: 'image/webp',
      };
    } catch (error) {
      logger.error('Avatar upload failed', { userId, error });
      throw error;
    }
  }

  // Delete avatar
  async deleteAvatar(key: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, key);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist, nothing to delete
        logger.warn('Avatar file not found for deletion', { key });
        return;
      }

      // Delete file
      await fs.unlink(filePath);

      logger.info('Avatar deleted successfully', { key });
    } catch (error) {
      logger.error('Avatar deletion failed', { key, error });
      throw error;
    }
  }

  // Get file URL
  getFileUrl(key: string): string {
    return `${this.staticPath}/${key}`;
  }
}

export default new LocalUploadService();
