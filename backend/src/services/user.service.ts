
import { User, UserRole } from '@prisma/client';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';
import bcrypt from 'bcryptjs';

import prisma from '@/database';

export class UserService {
    /**
     * Get all users (with optional filtering)
     */
    async getAllUsers(filters?: { role?: UserRole; search?: string }): Promise<User[]> {
        const { role, search } = filters || {};

        return prisma.user.findMany({
            where: {
                ...(role && { role }),
                ...(search && {
                    OR: [
                        { email: { contains: search, mode: 'insensitive' } },
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                    ],
                }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
            include: {
                preferences: true,
            }
        });
    }

    /**
     * Update user profile
     */
    async updateUser(id: string, data: Partial<User>): Promise<User> {
        try {
            // If updating password, hash it
            if (data.password) {
                data.password = await bcrypt.hash(data.password, 12);
            }

            const user = await prisma.user.update({
                where: { id },
                data,
            });
            logger.info(`User updated: ${id}`);
            return user;
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new ApiError(404, 'User not found');
            }
            if (error.code === 'P2002') {
                throw new ApiError(409, 'Email already in use');
            }
            throw error;
        }
    }

    /**
     * Delete user
     */
    async deleteUser(id: string): Promise<void> {
        try {
            await prisma.user.delete({
                where: { id },
            });
            logger.info(`User deleted: ${id}`);
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new ApiError(404, 'User not found');
            }
            throw error;
        }
    }

    /**
     * Update user preferences
     */
    async updateUserPreferences(userId: string, preferences: any): Promise<any> {
        return prisma.userPreferences.upsert({
            where: { userId },
            update: preferences,
            create: {
                userId,
                ...preferences,
            },
        });
    }
}

export default new UserService();
