// Email Service Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockEmailService } from '@/services/email/providers/mock';
import { EmailServiceFactory } from '@/services/email/factory';
import { templateRenderer } from '@/services/email/template-renderer';

describe('Email Service', () => {
  describe('MockEmailService', () => {
    let mockService: MockEmailService;

    beforeEach(() => {
      mockService = new MockEmailService();
      mockService.clearSentEmails();
    });

    it('should send verification email successfully', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';
      const firstName = 'John';

      await mockService.sendVerificationEmail(email, token, firstName);

      const sentEmails = mockService.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.options.to).toBe(email);
      expect(sentEmails[0]!.options.subject).toBe('Verify Your Email Address');
    });

    it('should send password reset email successfully', async () => {
      const email = 'test@example.com';
      const token = 'reset-token-456';
      const firstName = 'Jane';

      await mockService.sendPasswordResetEmail(email, token, firstName);

      const sentEmails = mockService.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.options.to).toBe(email);
      expect(sentEmails[0]!.options.subject).toBe('Reset Your Password');
    });

    it('should send custom email successfully', async () => {
      const result = await mockService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockService.getSentEmailsCount()).toBe(1);
    });

    it('should track multiple sent emails', async () => {
      await mockService.sendEmail({
        to: 'user1@example.com',
        subject: 'Email 1',
        html: '<p>Content 1</p>',
      });

      await mockService.sendEmail({
        to: 'user2@example.com',
        subject: 'Email 2',
        html: '<p>Content 2</p>',
      });

      expect(mockService.getSentEmailsCount()).toBe(2);
      
      const lastEmail = mockService.getLastSentEmail();
      expect(lastEmail?.options.to).toBe('user2@example.com');
    });

    it('should clear sent emails', async () => {
      await mockService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockService.getSentEmailsCount()).toBe(1);
      
      mockService.clearSentEmails();
      
      expect(mockService.getSentEmailsCount()).toBe(0);
    });
  });

  describe('EmailServiceFactory', () => {
    beforeEach(() => {
      EmailServiceFactory.resetInstance();
    });

    it('should create email service based on environment', () => {
      const service = EmailServiceFactory.createEmailService('mock');
      expect(service).toBeDefined();
    });

    it('should return cached instance on subsequent calls', () => {
      const service1 = EmailServiceFactory.createEmailService('mock');
      const service2 = EmailServiceFactory.createEmailService('mock');
      expect(service1).toBe(service2);
    });

    it('should create mock service when explicitly requested', () => {
      EmailServiceFactory.resetInstance();
      const service = EmailServiceFactory.createEmailService('mock');
      
      expect(service).toBeInstanceOf(MockEmailService);
    });
  });

  describe('Template Renderer', () => {
    it('should register custom helpers', () => {
      expect(() => templateRenderer.registerHelpers()).not.toThrow();
    });

    it('should clear template cache', () => {
      expect(() => templateRenderer.clearCache()).not.toThrow();
    });
  });
});
