
import { Router, Request, Response, NextFunction } from 'express';
import userService from '@/services/user.service';
import { authenticate, authorize } from '@/middleware/auth';
import { ApiError } from '@/utils/errors';
import {
    validateBody,
    updateProfileSchema,
    updatePreferencesSchema,
    adminUpdateUserSchema,
    type AdminUpdateUserInput,
} from '@/middleware/validate';
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
router.put('/me', validateBody(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // validateBody keeps only the fields a user may change (name, phone, avatar)
        const user = await userService.updateUser(req.user!.id, req.body);
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
router.put('/me/preferences', validateBody(updatePreferencesSchema), async (req: Request, res: Response, next: NextFunction) => {
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
router.put('/:id', authorize('ADMIN'), validateBody(adminUpdateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const changes = req.body as AdminUpdateUserInput;
        // Don't allow changing own role to avoid lockout, or implement checks logic
        if (id === req.user!.id && changes.role && changes.role !== 'ADMIN') {
            throw new ApiError(400, 'Cannot demote yourself');
        }

        const user = await userService.updateUser(id as string, changes);
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
