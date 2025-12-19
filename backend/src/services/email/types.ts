// Email Service Types and Interfaces

export interface IEmailService {
  sendVerificationEmail(email: string, token: string, firstName?: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string, firstName?: string): Promise<void>;
  sendEmail(options: EmailOptions): Promise<EmailResult>;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailTemplateData {
  [key: string]: any;
}

export type EmailProvider = 'sendgrid' | 'smtp' | 'mock';
