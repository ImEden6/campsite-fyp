// Authentication Service

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import logger from '@/utils/logger';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError, 
  NotFoundError,
  BusinessLogicError 
} from '@/utils/errors';
import { CacheService } from './cache.service';
import { emailService } from './email';

type User = any; // Will be properly typed by Prisma
type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';

const prisma = new PrismaClient();
const cacheService = new CacheService();

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  // Generate JWT tokens
  private generateTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as string,
    } as jwt.SignOptions);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpirationTime(config.jwt.expiresIn),
    };
  }

  // Get token expiration time in seconds
  private getTokenExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match || !match[1]) return 86400; // Default to 24 hours

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 86400;
    }
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  // Verify password
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate verification token
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Store refresh token
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + this.getTokenExpirationTime(config.jwt.refreshExpiresIn) * 1000);
    
    await prisma.userSession.create({
      data: {
        userId,
        token: crypto.randomBytes(32).toString('hex'),
        refreshToken,
        expiresAt,
      },
    });
  }

  // Validate refresh token
  private async validateRefreshToken(refreshToken: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      
      const session = await prisma.userSession.findFirst({
        where: {
          refreshToken,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: true,
        },
      });

      if (!session || !session.user.isActive) {
        return null;
      }

      return session.user;
    } catch (error) {
      logger.error('Refresh token validation failed', error);
      return null;
    }
  }

  // Register new user
  async register(userData: RegisterData): Promise<{ user: User; message: string }> {
    const { email, password, firstName, lastName, phone, role = 'CUSTOMER' as UserRole } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Validate password strength
    if (password.length < config.security.passwordMinLength) {
      throw new ValidationError([{
        field: 'password',
        message: `Password must be at least ${config.security.passwordMinLength} characters long`,
        code: 'PASSWORD_TOO_SHORT',
      }]);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Generate email verification token
    const verificationToken = this.generateVerificationToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role,
        isActive: true,
        isEmailVerified: config.development.skipEmailVerification,
      },
    });

    // Create user preferences
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        theme: 'light',
        language: 'en',
        timezone: 'America/New_York',
      },
    });

    // Send verification email if not skipped
    if (!config.development.skipEmailVerification) {
      await cacheService.set(
        `email_verification:${verificationToken}`,
        user.id,
        3600 // 1 hour
      );

      try {
        await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
      } catch (emailError) {
        // Log error but don't block registration
        logger.error('Failed to send verification email', { 
          email: user.email, 
          error: emailError 
        });
        // User can still resend verification email later
      }
    }

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      message: config.development.skipEmailVerification 
        ? 'Registration successful' 
        : 'Registration successful. Please check your email to verify your account.',
    };
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    // Check email verification
    if (!user.isEmailVerified && !config.development.skipEmailVerification) {
      throw new AuthenticationError('Please verify your email address');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.authSuccess(user.id);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.validateRefreshToken(refreshToken);

    if (!user) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Store new refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Remove old refresh token
    await prisma.userSession.deleteMany({
      where: { refreshToken },
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  // Logout user
  async logout(refreshToken: string): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { refreshToken },
    });

    logger.info('User logged out successfully');
  }

  // Logout from all devices
  async logoutAll(userId: string): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { userId },
    });

    logger.info('User logged out from all devices', { userId });
  }

  // Verify email
  async verifyEmail(token: string): Promise<{ message: string }> {
    const userId = await cacheService.get<string>(`email_verification:${token}`);

    if (!userId) {
      throw new AuthenticationError('Invalid or expired verification token');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new BusinessLogicError('Email already verified');
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Remove verification token from cache
    await cacheService.delete(`email_verification:${token}`);

    logger.info('Email verified successfully', { userId });

    return { message: 'Email verified successfully' };
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new BusinessLogicError('Email already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken();

    // Store token in cache
    await cacheService.set(
      `email_verification:${verificationToken}`,
      user.id,
      3600 // 1 hour
    );

    try {
      // Send verification email
      await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
      logger.info('Verification email resent', { userId: user.id });
    } catch (emailError) {
      // Log error but return success message to avoid revealing email issues
      logger.error('Failed to resend verification email', { 
        email: user.email, 
        error: emailError 
      });
    }

    return { message: 'Verification email sent' };
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = this.generateVerificationToken();

    // Store token in cache
    await cacheService.set(
      `password_reset:${resetToken}`,
      user.id,
      3600 // 1 hour
    );

    try {
      // Send reset email
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);
      logger.info('Password reset requested', { userId: user.id });
    } catch (emailError) {
      // Log error but don't reveal email issues for security
      logger.error('Failed to send password reset email', { 
        email: user.email, 
        error: emailError 
      });
    }

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const { token, newPassword } = data;

    const userId = await cacheService.get<string>(`password_reset:${token}`);

    if (!userId) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate password strength
    if (newPassword.length < config.security.passwordMinLength) {
      throw new ValidationError([{
        field: 'newPassword',
        message: `Password must be at least ${config.security.passwordMinLength} characters long`,
        code: 'PASSWORD_TOO_SHORT',
      }]);
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Remove reset token from cache
    await cacheService.delete(`password_reset:${token}`);

    // Logout user from all devices
    await this.logoutAll(userId);

    logger.info('Password reset successfully', { userId });

    return { message: 'Password reset successfully' };
  }

  // Change password
  async changePassword(userId: string, data: ChangePasswordData): Promise<{ message: string }> {
    const { currentPassword, newPassword } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password strength
    if (newPassword.length < config.security.passwordMinLength) {
      throw new ValidationError([{
        field: 'newPassword',
        message: `Password must be at least ${config.security.passwordMinLength} characters long`,
        code: 'PASSWORD_TOO_SHORT',
      }]);
    }

    // Check if new password is different from current
    const isSamePassword = await this.verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      throw new ValidationError([{
        field: 'newPassword',
        message: 'New password must be different from current password',
        code: 'PASSWORD_SAME_AS_CURRENT',
      }]);
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Logout user from all other devices
    await this.logoutAll(userId);

    logger.info('Password changed successfully', { userId });

    return { message: 'Password changed successfully' };
  }

  // Get user profile
  async getProfile(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.sanitizeUser(user);
  }

  // Update user profile
  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    const { firstName, lastName, phone } = updateData;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
      },
      include: {
        preferences: true,
      },
    });

    logger.info('User profile updated', { userId });

    return this.sanitizeUser(user);
  }

  // Update user avatar
  async updateAvatar(userId: string, avatarUrl: string, avatarKey: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: avatarUrl,
        avatarKey,
      },
      include: {
        preferences: true,
      },
    });

    logger.info('User avatar updated', { userId });

    return this.sanitizeUser(user);
  }

  // Delete user avatar
  async deleteAvatar(userId: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: null,
        avatarKey: null,
      },
      include: {
        preferences: true,
      },
    });

    logger.info('User avatar deleted', { userId });

    return this.sanitizeUser(user);
  }

  // Delete user account
  async deleteAccount(userId: string, password: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Password is incorrect');
    }

    // Check if user has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      },
    });

    if (activeBookings > 0) {
      throw new BusinessLogicError('Cannot delete account with active bookings');
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`,
      },
    });

    // Logout from all devices
    await this.logoutAll(userId);

    logger.info('User account deleted', { userId });

    return { message: 'Account deleted successfully' };
  }

  // Sanitize user object (remove sensitive data)
  private sanitizeUser(user: any): User {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Validate user session
  async validateSession(userId: string): Promise<boolean> {
    const activeSession = await prisma.userSession.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    return !!activeSession;
  }

  // Get user sessions
  async getUserSessions(userId: string): Promise<any[]> {
    return prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export default new AuthService();
