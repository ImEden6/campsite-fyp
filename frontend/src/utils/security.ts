/**
 * Security Utilities
 * Helper functions for security-related operations
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Note: React automatically escapes content, but this provides additional protection
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove any HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate that a URL is safe (not javascript: or data: protocol)
 */
export const isSafeUrl = (url: string): boolean => {
  if (!url) return false;
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Sanitize URL for safe usage
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  if (!isSafeUrl(url)) {
    console.warn('Potentially unsafe URL blocked:', url);
    return '';
  }
  
  return url;
};

/**
 * Check if a string contains potential XSS patterns
 */
export const containsXssPattern = (input: string): boolean => {
  if (!input) return false;
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Decode JWT token (client-side only, for expiration checking)
 * WARNING: Never trust client-side JWT validation for security
 */
interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const parsed = JSON.parse(jsonPayload) as unknown;
    return isRecord(parsed) ? (parsed as JwtPayload) : null;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * WARNING: This is for UX only, server must validate tokens
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJwt(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  // Add 30 second buffer to refresh before actual expiration
  return currentTime >= expirationTime - 30000;
};

/**
 * Generate a random CSRF token
 */
export const generateCsrfToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Store CSRF token in session storage
 */
export const storeCsrfToken = (token: string): void => {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
    console.error('Failed to store CSRF token:', error);
  }
};

/**
 * Get CSRF token from session storage
 */
export const getCsrfToken = (): string | null => {
  try {
    return sessionStorage.getItem('csrf_token');
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

/**
 * Clear CSRF token from session storage
 */
export const clearCsrfToken = (): void => {
  try {
    sessionStorage.removeItem('csrf_token');
  } catch (error) {
    console.error('Failed to clear CSRF token:', error);
  }
};

/**
 * Validate password strength
 */
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;
  
  if (!password) {
    return { score: 0, feedback: ['Password is required'], isStrong: false };
  }
  
  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password should be at least 8 characters');
  }
  
  if (password.length >= 12) {
    score++;
  }
  
  // Complexity checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Use both uppercase and lowercase letters');
  }
  
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Include at least one number');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Include at least one special character');
  }
  
  // Common password check
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }
  
  // Normalize score to 0-4
  score = Math.min(4, Math.max(0, score));
  
  const isStrong = score >= 3 && feedback.length === 0;
  
  if (isStrong) {
    feedback.push('Strong password');
  }
  
  return { score, feedback, isStrong };
};

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = <T>(data: T, sensitiveKeys: string[] = []): T => {
  const defaultSensitiveKeys = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'cvv',
  ];
  
  const normalizedSensitiveKeys = [...defaultSensitiveKeys, ...sensitiveKeys].map((key) =>
    key.toLowerCase()
  );

  const maskValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => maskValue(item));
    }

    if (!isRecord(value)) {
      return value;
    }

    const masked: Record<string, unknown> = {};

    for (const [key, rawValue] of Object.entries(value)) {
      const keyLower = key.toLowerCase();
      const isSensitive = normalizedSensitiveKeys.some((sensitiveKey) =>
        keyLower.includes(sensitiveKey)
      );

      if (isSensitive && typeof rawValue === 'string') {
        masked[key] = '***REDACTED***';
      } else if (Array.isArray(rawValue)) {
        masked[key] = rawValue.map((item) => maskValue(item));
      } else if (isRecord(rawValue)) {
        masked[key] = maskValue(rawValue);
      } else {
        masked[key] = rawValue;
      }
    }

    return masked;
  };

  return maskValue(data) as T;
};

/**
 * Rate limiting helper for client-side actions
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  /**
   * Check if action is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  /**
   * Reset attempts for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  /**
   * Get remaining attempts
   */
  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }
  
  /**
   * Get time until next attempt is allowed
   */
  getTimeUntilReset(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    if (attempts.length === 0) {
      return 0;
    }
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + this.windowMs;
    
    return Math.max(0, resetTime - now);
  }
}

/**
 * Secure random string generator
 */
export const generateSecureRandomString = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if running in secure context (HTTPS)
 */
export const isSecureContext = (): boolean => {
  return window.isSecureContext || window.location.protocol === 'https:';
};

/**
 * Validate file upload security
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[];
}

export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;
  
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    };
  }
  
  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }
  
  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension .${extension} is not allowed`,
      };
    }
  }
  
  return { valid: true };
};
