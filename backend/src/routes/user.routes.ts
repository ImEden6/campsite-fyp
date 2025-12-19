
import { Router, Request, Response, NextFunction } from 'express';
import userService from '@/services/user.service';
import { authenticate, authorize } from '@/middleware/auth';
import { ApiError } from '@/utils/errors';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /users/me
 * Get current user profile
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserById(req.user!.id);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Remove sensitive data
        const { password, ...safeUser } = user;

        res.json({
            success: true,
            data: safeUser,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /users/me
 * Update current user profile
 */
router.put('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Whitelist allowed fields for self-update
        const allowedFields = ['firstName', 'lastName', 'phone', 'avatar'];
        const updateData: any = {};

        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        const user = await userService.updateUser(req.user!.id, updateData);
        const { password, ...safeUser } = user;

        res.json({
            success: true,
            data: safeUser,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /users/me/preferences
 * Update current user preferences
 */
router.put('/me/preferences', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const preferences = await userService.updateUserPreferences(req.user!.id, req.body);

        res.json({
            success: true,
            data: preferences,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /users
 * List all users (Admin/Manager only)
 */
router.get('/', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role, search } = req.query;

        const users = await userService.getAllUsers({
            role: role ? (role as string).toUpperCase() as UserRole : undefined,
            search: search as string,
        });

        const safeUsers = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });

        res.json({
            success: true,
            data: safeUsers,
            count: safeUsers.length,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /users/:id
 * Get specific user (Admin/Manager only)
 */
router.get('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id as string);

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const { password, ...safeUser } = user;

        res.json({
            success: true,
            data: safeUser,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /users/:id
 * Update specific user (Admin only)
 */
router.put('/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        // Don't allow changing own role to avoid lockout, or implement checks logic
        if (id === req.user!.id && req.body.role && req.body.role !== 'ADMIN') {
            throw new ApiError(400, 'Cannot demote yourself');
        }

        const user = await userService.updateUser(id as string, req.body);
        const { password, ...safeUser } = user;

        res.json({
            success: true,
            data: safeUser,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /users/:id
 * Delete specific user (Admin only)
 */
router.delete('/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (id === req.user!.id) {
            throw new ApiError(400, 'Cannot delete yourself');
        }

        await userService.deleteUser(id as string);

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
