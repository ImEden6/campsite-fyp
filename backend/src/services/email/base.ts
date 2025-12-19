// Abstract Email Service Base Class

import { IEmailService, EmailOptions, EmailResult } from './types';
import { templateRenderer } from './template-renderer';
import logger from '@/utils/logger';

export abstract class EmailService implements IEmailService {
  protected abstract providerName: string;

  abstract sendEmail(options: EmailOptions): Promise<EmailResult>;

  async sendVerificationEmail(email: string, token: string, firstName?: string): Promise<void> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      
      const html = await templateRenderer.renderVerificationEmail(
        email,
        firstName || 'User',
        verificationUrl
      );
      
      const result = await this.sendEmail({
        to: email,
        subject: 'Verify Your Email Address',
        html,
        text: `Please verify your email by visiting: ${verificationUrl}`,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification email');
      }

      logger.info(`Verification email sent via ${this.providerName}`, { 
        email, 
        messageId: result.messageId 
      });
    } catch (error) {
      logger.error(`Failed to send verification email via ${this.providerName}`, { 
        email, 
        error 
      });
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string, firstName?: string): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      const html = await templateRenderer.renderPasswordResetEmail(
        email,
        firstName || 'User',
        resetUrl
      );
      
      const result = await this.sendEmail({
        to: email,
        subject: 'Reset Your Password',
        html,
        text: `Reset your password by visiting: ${resetUrl}`,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send password reset email');
      }

      logger.info(`Password reset email sent via ${this.providerName}`, { 
        email, 
        messageId: result.messageId 
      });
    } catch (error) {
      logger.error(`Failed to send password reset email via ${this.providerName}`, { 
        email, 
        error 
      });
      throw error;
    }
  }

  protected logEmailAttempt(options: EmailOptions, success: boolean, error?: string): void {
    logger.info(`Email attempt via ${this.providerName}`, {
      to: options.to,
      subject: options.subject,
      success,
      error,
    });
  }
}
