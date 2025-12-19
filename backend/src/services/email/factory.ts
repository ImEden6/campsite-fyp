// Email Service Factory

import { IEmailService, EmailProvider } from './types';
import { SendGridEmailService } from './providers/sendgrid';
import { NodemailerEmailService } from './providers/nodemailer';
import { MockEmailService } from './providers/mock';
import { config } from '@/config';
import logger from '@/utils/logger';

export class EmailServiceFactory {
  private static instance: IEmailService | null = null;

  static createEmailService(provider?: EmailProvider): IEmailService {
    // Use cached instance if available
    if (this.instance) {
      return this.instance;
    }

    const selectedProvider = provider || this.getProviderFromConfig();

    logger.info(`Initializing email service with provider: ${selectedProvider}`);

    switch (selectedProvider) {
      case 'sendgrid':
        this.instance = this.createSendGridService();
        break;
      
      case 'smtp':
        this.instance = this.createNodemailerService();
        break;
      
      case 'mock':
        this.instance = this.createMockService();
        break;
      
      default:
        logger.warn(`Unknown email provider: ${selectedProvider}, falling back to mock`);
        this.instance = this.createMockService();
    }

    return this.instance;
  }

  private static getProviderFromConfig(): EmailProvider {
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
    
    // Default to mock in development, smtp in production
    if (!provider) {
      return config.server.nodeEnv === 'development' ? 'mock' : 'smtp';
    }

    return provider as EmailProvider;
  }

  private static createSendGridService(): IEmailService {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || config.email.from;

    if (!apiKey) {
      logger.warn('SENDGRID_API_KEY not configured, falling back to mock service');
      return this.createMockService();
    }

    return new SendGridEmailService(apiKey, fromEmail);
  }

  private static createNodemailerService(): IEmailService {
    return new NodemailerEmailService({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      user: config.email.user,
      password: config.email.password,
      from: config.email.from,
    });
  }

  private static createMockService(): IEmailService {
    return new MockEmailService();
  }

  // Reset instance (useful for testing)
  static resetInstance(): void {
    this.instance = null;
  }
}

// Export singleton instance
export const emailService = EmailServiceFactory.createEmailService();
