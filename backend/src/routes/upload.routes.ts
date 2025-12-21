// Upload Routes

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadService } from '@/services/upload';

import logger from '@/utils/logger';
import { NotFoundError, ValidationError } from '@/utils/errors';

const router = express.Router();
import prisma from '@/database';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError([{
        field: 'avatar',
        message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
        code: 'INVALID_FILE_TYPE',
      }]));
    }
  },
});

/**
 * @route   POST /api/v1/users/:userId/avatar
 * @desc    Upload user avatar
 * @access  Private (authenticated user or admin)
 */
router.post(
  '/users/:userId/avatar',
  upload.single('avatar'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const file = req.file;

      // Validate file exists
      if (!file) {
        throw new ValidationError([{
          field: 'avatar',
          message: 'No file uploaded',
          code: 'FILE_REQUIRED',
        }]);
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, avatar: true, avatarKey: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Delete old avatar if exists
      if (user.avatarKey) {
        try {
          await uploadService.deleteAvatar(user.avatarKey);
        } catch (error) {
          // Log error but don't fail the upload
          logger.error('Failed to delete old avatar', { userId, error });
        }
      }

      // Upload new avatar
      const result = await uploadService.uploadAvatar(file, userId || '');

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: {
          avatar: result.url,
          avatarKey: result.key,
        },
      });

      logger.info('Avatar uploaded successfully', {
        userId,
        url: result.url,
        size: result.size,
      });

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          url: result.url,
          size: result.size,
          mimeType: result.mimeType,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/v1/users/:userId/avatar
 * @desc    Delete user avatar
 * @access  Private (authenticated user or admin)
 */
router.delete(
  '/users/:userId/avatar',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, avatar: true, avatarKey: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!user.avatar) {
        throw new ValidationError([{
          field: 'avatar',
          message: 'User has no avatar to delete',
          code: 'NO_AVATAR',
        }]);
      }

      // Delete avatar file
      if (user.avatarKey) {
        await uploadService.deleteAvatar(user.avatarKey);
      }

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: {
          avatar: null,
          avatarKey: null,
        },
      });

      logger.info('Avatar deleted successfully', { userId });

      res.status(200).json({
        success: true,
        message: 'Avatar deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
