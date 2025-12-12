/**
 * Security Tests
 * Tests for security utilities and authentication
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeInput,
  isSafeUrl,
  sanitizeUrl,
  containsXssPattern,
  decodeJwt,
  isTokenExpired,
  checkPasswordStrength,
  maskSensitiveData,
  RateLimiter,
  validateFile,
} from '@/utils/security';

describe('Security Utilities', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should escape special characters', () => {
      // Note: < and > are stripped as HTML tags first, so test with characters that remain
      const input = '&"\'/';
      const result = sanitizeInput(input);
      expect(result).toBe('&amp;&quot;&#x27;&#x2F;');
    });

    it('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
    });
  });

  describe('isSafeUrl', () => {
    it('should allow safe URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('http://example.com')).toBe(true);
      expect(isSafeUrl('/relative/path')).toBe(true);
      expect(isSafeUrl('mailto:test@example.com')).toBe(true);
    });

    it('should block dangerous URLs', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isSafeUrl('JavaScript:alert(1)')).toBe(false);
      expect(isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should return safe URLs unchanged', () => {
      const url = 'https://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should return empty string for dangerous URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>')).toBe('');
    });
  });

  describe('containsXssPattern', () => {
    it('should detect script tags', () => {
      expect(containsXssPattern('<script>alert(1)</script>')).toBe(true);
      expect(containsXssPattern('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(containsXssPattern('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsXssPattern('onclick=alert(1)')).toBe(true);
      expect(containsXssPattern('onload=alert(1)')).toBe(true);
    });

    it('should detect dangerous tags', () => {
      expect(containsXssPattern('<iframe src="evil.com"></iframe>')).toBe(true);
      expect(containsXssPattern('<object data="evil.swf"></object>')).toBe(true);
      expect(containsXssPattern('<embed src="evil.swf">')).toBe(true);
    });

    it('should not flag safe content', () => {
      expect(containsXssPattern('Hello World')).toBe(false);
      expect(containsXssPattern('This is a normal sentence.')).toBe(false);
    });
  });

  describe('decodeJwt', () => {
    it('should decode valid JWT', () => {
      // Sample JWT with payload: { sub: "1234567890", name: "John Doe", iat: 1516239022 }
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const decoded = decodeJwt(token);

      expect(decoded).toBeDefined();
      expect(decoded!.sub).toBe('1234567890');
      expect(decoded!.name).toBe('John Doe');
    });

    it('should return null for invalid JWT', () => {
      expect(decodeJwt('invalid.token')).toBeNull();
      expect(decodeJwt('')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should detect expired token', () => {
      // Create token with past expiration
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = btoa(JSON.stringify({ exp: pastExp }));
      const token = `header.${payload}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should detect valid token', () => {
      // Create token with future expiration
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = btoa(JSON.stringify({ exp: futureExp }));
      const token = `header.${payload}.signature`;

      expect(isTokenExpired(token)).toBe(false);
    });
  });

  describe('checkPasswordStrength', () => {
    it('should rate strong passwords highly', () => {
      const result = checkPasswordStrength('MyStr0ng!Pass');
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.isStrong).toBe(true);
    });

    it('should rate weak passwords poorly', () => {
      const result = checkPasswordStrength('weak');
      expect(result.score).toBeLessThan(3);
      expect(result.isStrong).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should detect common passwords', () => {
      const result = checkPasswordStrength('password123');
      expect(result.feedback.some(f => f.includes('common'))).toBe(true);
    });

    it('should provide feedback for improvements', () => {
      const result = checkPasswordStrength('short');
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask password fields', () => {
      const data = { username: 'john', password: 'secret123' };
      const masked = maskSensitiveData(data);

      expect(masked.username).toBe('john');
      expect(masked.password).toBe('***REDACTED***');
    });

    it('should mask token fields', () => {
      const data = { accessToken: 'abc123', refreshToken: 'xyz789' };
      const masked = maskSensitiveData(data);

      expect(masked.accessToken).toBe('***REDACTED***');
      expect(masked.refreshToken).toBe('***REDACTED***');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
          },
        },
      };
      const masked = maskSensitiveData(data);

      expect(masked.user.name).toBe('John');
      expect(masked.user.credentials.password).toBe('***REDACTED***');
    });

    it('should handle arrays', () => {
      const data = [
        { name: 'User1', password: 'pass1' },
        { name: 'User2', password: 'pass2' },
      ];
      const masked = maskSensitiveData(data);

      expect(masked[0]!.name).toBe('User1');
      expect(masked[0]!.password).toBe('***REDACTED***');
      expect(masked[1]!.password).toBe('***REDACTED***');
    });

    it('should mask custom sensitive keys', () => {
      const data = { customSecret: 'value' };
      const masked = maskSensitiveData(data, ['customSecret']);

      expect(masked.customSecret).toBe('***REDACTED***');
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(3, 1000); // 3 attempts per second
    });

    it('should allow requests within limit', () => {
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');

      expect(rateLimiter.isAllowed('test')).toBe(false);
    });

    it('should track different keys separately', () => {
      rateLimiter.isAllowed('key1');
      rateLimiter.isAllowed('key1');
      rateLimiter.isAllowed('key1');

      expect(rateLimiter.isAllowed('key1')).toBe(false);
      expect(rateLimiter.isAllowed('key2')).toBe(true);
    });

    it('should reset attempts for a key', () => {
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');

      rateLimiter.reset('test');

      expect(rateLimiter.isAllowed('test')).toBe(true);
    });

    it('should return remaining attempts', () => {
      expect(rateLimiter.getRemainingAttempts('test')).toBe(3);

      rateLimiter.isAllowed('test');
      expect(rateLimiter.getRemainingAttempts('test')).toBe(2);

      rateLimiter.isAllowed('test');
      expect(rateLimiter.getRemainingAttempts('test')).toBe(1);
    });
  });

  describe('validateFile', () => {
    const createMockFile = (name: string, size: number, type: string): File => {
      // Create actual content to match the desired size
      const content = new Array(size).fill('a').join('');
      return new File([content], name, { type });
    };

    it('should validate file size', () => {
      const smallFile = createMockFile('test.jpg', 1024, 'image/jpeg');
      const largeFile = createMockFile('large.jpg', 20 * 1024 * 1024, 'image/jpeg');

      expect(validateFile(smallFile, { maxSize: 10 * 1024 * 1024 }).valid).toBe(true);
      expect(validateFile(largeFile, { maxSize: 10 * 1024 * 1024 }).valid).toBe(false);
    });

    it('should validate MIME type', () => {
      const imageFile = createMockFile('test.jpg', 1024, 'image/jpeg');
      const pdfFile = createMockFile('test.pdf', 1024, 'application/pdf');

      const result1 = validateFile(imageFile, { allowedTypes: ['image/jpeg', 'image/png'] });
      const result2 = validateFile(pdfFile, { allowedTypes: ['image/jpeg', 'image/png'] });

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(false);
    });

    it('should validate file extension', () => {
      const jpgFile = createMockFile('test.jpg', 1024, 'image/jpeg');
      const exeFile = createMockFile('test.exe', 1024, 'application/x-msdownload');

      const result1 = validateFile(jpgFile, { allowedExtensions: ['jpg', 'png'] });
      const result2 = validateFile(exeFile, { allowedExtensions: ['jpg', 'png'] });

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(false);
    });
  });
});
