// SendGrid Email Service Provider

import sgMail from '@sendgrid/mail';
import type { MailDataRequired } from '@sendgrid/mail';
import { EmailService } from '../base';
import { EmailOptions, EmailResult } from '../types';
import logger from '@/utils/logger';
import { getErrorMessage } from '@/utils/errors';

// The part of a SendGrid failure that carries the useful message
interface SendGridError {
  response?: { body?: { errors?: Array<{ message?: string }> } };
}

export class SendGridEmailService extends EmailService {
  protected providerName = 'SendGrid';
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    super();
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    sgMail.setApiKey(this.apiKey);
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const msg = {
        to: options.to,
        from: options.from || this.fromEmail,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          type: att.contentType,
        })),
      };

      const response = await sgMail.send(msg as MailDataRequired);
      const messageId = response[0]?.headers?.['x-message-id'] || undefined;

      this.logEmailAttempt(options, true);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const errorMessage = (error as SendGridError)?.response?.body?.errors?.[0]?.message || getErrorMessage(error);
      
      logger.error('SendGrid email failed', {
        error: errorMessage,
        to: options.to,
        subject: options.subject,
      });

      this.logEmailAttempt(options, false, errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
