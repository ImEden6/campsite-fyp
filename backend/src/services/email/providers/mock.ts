// Mock Email Service Provider (for development/testing)

import { EmailService } from '../base';
import { EmailOptions, EmailResult } from '../types';
import logger from '@/utils/logger';

export class MockEmailService extends EmailService {
  protected providerName = 'Mock';
  private sentEmails: Array<{ options: EmailOptions; timestamp: Date }> = [];

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    // Simulate email sending
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store sent email for testing/debugging
    this.sentEmails.push({
      options,
      timestamp: new Date(),
    });

    logger.info('Mock email sent', {
      to: options.to,
      subject: options.subject,
      messageId,
    });

    this.logEmailAttempt(options, true);

    // Log email content for development
    console.log('\n=== MOCK EMAIL ===');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html?.substring(0, 200) + '...');
    console.log('Text:', options.text);
    console.log('==================\n');

    return {
      success: true,
      messageId,
    };
  }

  // Helper methods for testing
  getSentEmails(): Array<{ options: EmailOptions; timestamp: Date }> {
    return this.sentEmails;
  }

  getLastSentEmail(): { options: EmailOptions; timestamp: Date } | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  clearSentEmails(): void {
    this.sentEmails = [];
  }

  getSentEmailsCount(): number {
    return this.sentEmails.length;
  }
}
