// Email Service Exports

export { IEmailService, EmailOptions, EmailResult, EmailAttachment, EmailTemplateData, EmailProvider } from './types';
export { EmailService } from './base';
export { EmailServiceFactory, emailService } from './factory';
export { SendGridEmailService } from './providers/sendgrid';
export { NodemailerEmailService } from './providers/nodemailer';
export { MockEmailService } from './providers/mock';
export { TemplateRenderer, templateRenderer } from './template-renderer';
