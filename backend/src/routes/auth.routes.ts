// Auth Routes

import { Router, Request, Response, NextFunction } from 'express';
import authService from '@/services/auth.service';
import { authenticate } from '@/middleware/auth';
import { authRateLimit, registerRateLimit } from '@/middleware/security';
import { validateBody, loginSchema, registerSchema, refreshTokenSchema, LoginInput, RegisterInput } from '@/middleware/validate';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';

const router = Router();

/**
 * POST /auth/login
 * Login user
 * Middleware order: rate limiter -> validation -> controller
 */
router.post('/login', authRateLimit, validateBody(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as LoginInput;

    const result = await authService.login({ email, password });

    logger.info('User logged in', {
      userId: result.user.id,
      email: result.user.email,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/register
 * Register new user
 * Middleware order: rate limiter -> validation -> controller
 */
router.post('/register', registerRateLimit, validateBody(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body as RegisterInput;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
    });

    logger.info('User registered', {
      userId: result.user.id,
      email: result.user.email,
    });

    res.status(201).json({
      success: true,
      data: result.user,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', validateBody(refreshTokenSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const profile = await authService.getProfile(user.id);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
