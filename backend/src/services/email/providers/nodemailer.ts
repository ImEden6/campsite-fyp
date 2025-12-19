// Nodemailer Email Service Provider (SMTP)

import nodemailer from 'nodemailer';
import { EmailService } from '../base';
import { EmailOptions, EmailResult } from '../types';
import logger from '@/utils/logger';

export interface NodemailerConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export class NodemailerEmailService extends EmailService {
  protected providerName = 'Nodemailer';
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(config: NodemailerConfig) {
    super();
    this.fromEmail = config.from;
    
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const mailOptions = {
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logEmailAttempt(options, true);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      
      logger.error('Nodemailer email failed', {
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

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Nodemailer connection verified');
      return true;
    } catch (error) {
      logger.error('Nodemailer connection failed', error);
      return false;
    }
  }
}
