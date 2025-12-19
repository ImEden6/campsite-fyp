// Configuration Management for Campsite Management System

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Environment validation
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Warn about optional but recommended env vars in production
if (process.env.NODE_ENV === 'production') {
  const recommendedEnvVars = ['REDIS_URL', 'EMAIL_USER', 'EMAIL_PASSWORD', 'STRIPE_SECRET_KEY'];
  const missingRecommended = recommendedEnvVars.filter(varName => !process.env[varName]);
  if (missingRecommended.length > 0) {
    console.warn(`Warning: Missing recommended environment variables for production: ${missingRecommended.join(', ')}`);
  }
}

// Configuration object
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000', 10),
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256' as const,
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
  },

  // Email configuration
  email: {
    provider: (process.env.EMAIL_PROVIDER?.toLowerCase() as 'sendgrid' | 'smtp' | 'mock') ||
      (process.env.NODE_ENV === 'development' ? 'mock' : 'smtp'),
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'noreply@campsite.com',
    password: process.env.EMAIL_PASSWORD || 'password',
    from: process.env.EMAIL_FROM || 'noreply@campsite.com',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@campsite.com',
    },
    templates: {
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email`,
      resetPasswordUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
    },
  },

  // SMS configuration
  sms: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    apiVersion: '2023-10-16' as const,
  },

  // File upload configuration
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ],
    staticPath: '/uploads',
  },

  // Weather API configuration
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
    apiUrl: process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
    units: 'imperial' as const,
    updateInterval: parseInt(process.env.WEATHER_UPDATE_INTERVAL || '600000', 10), // 10 minutes
  },

  // Google OAuth configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '/auth/google/callback',
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'fallback-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.COOKIE_SECURE === 'true',
      httpOnly: true,
      maxAge: parseInt(process.env.COOKIE_MAX_AGE || '86400000', 10), // 24 hours
      sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
    },
  },

  // Security configuration
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760', 10), // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
  },

  // Background jobs configuration
  jobs: {
    bullRedisUrl: process.env.BULL_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
    defaultJobOptions: {
      removeOnComplete: parseInt(process.env.JOBS_REMOVE_ON_COMPLETE || '100', 10),
      removeOnFail: parseInt(process.env.JOBS_REMOVE_ON_FAIL || '50', 10),
      attempts: parseInt(process.env.JOBS_ATTEMPTS || '3', 10),
      backoff: {
        type: 'exponential' as const,
        delay: parseInt(process.env.JOBS_BACKOFF_DELAY || '2000', 10),
      },
    },
  },

  // Monitoring configuration
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      enabled: process.env.SENTRY_ENABLED !== 'false',
    },
  },

  // Feature flags
  features: {
    enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
    enableWeather: process.env.ENABLE_WEATHER !== 'false',
    enableCalendarSync: process.env.ENABLE_CALENDAR_SYNC !== 'false',
    enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false',
    enableSocketIO: process.env.ENABLE_SOCKET_IO !== 'false',
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
    // Disable caching and rate limiting in test env to avoid flakiness
    enableCaching: process.env.NODE_ENV !== 'test' && process.env.ENABLE_CACHING !== 'false',
    enableRateLimiting: process.env.NODE_ENV !== 'test' && process.env.ENABLE_RATE_LIMITING !== 'false',
  },

  // Caching configuration
  cache: {
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10), // 1 hour
    userProfileTtl: parseInt(process.env.CACHE_USER_PROFILE_TTL || '1800', 10), // 30 minutes
    siteAvailabilityTtl: parseInt(process.env.CACHE_SITE_AVAILABILITY_TTL || '300', 10), // 5 minutes
    analyticsDataTtl: parseInt(process.env.CACHE_ANALYTICS_DATA_TTL || '900', 10), // 15 minutes
  },

  // Pagination configuration
  pagination: {
    defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20', 10),
    maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10),
  },

  // Business rules configuration
  business: {
    maxAdvanceBookingDays: parseInt(process.env.MAX_ADVANCE_BOOKING_DAYS || '365', 10),
    maxBookingDuration: parseInt(process.env.MAX_BOOKING_DURATION || '30', 10),
    minBookingDuration: parseInt(process.env.MIN_BOOKING_DURATION || '1', 10),
    defaultDepositPercentage: parseFloat(process.env.DEFAULT_DEPOSIT_PERCENTAGE || '25.0'),
    defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '0.08'),
    cancellationCutoffHours: parseInt(process.env.CANCELLATION_CUTOFF_HOURS || '24', 10),
  },

  // Notification settings
  notifications: {
    bookingReminderHours: parseInt(process.env.BOOKING_REMINDER_HOURS || '24', 10),
    checkInReminderHours: parseInt(process.env.CHECK_IN_REMINDER_HOURS || '2', 10),
    checkOutReminderHours: parseInt(process.env.CHECK_OUT_REMINDER_HOURS || '1', 10),
    paymentReminderHours: parseInt(process.env.PAYMENT_REMINDER_HOURS || '48', 10),
  },

  // API versioning
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: process.env.API_PREFIX || '/api',
  },

  // Development settings
  development: {
    enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === 'true',
    enableSeeding: process.env.ENABLE_SEEDING !== 'false',
    enableMockData: process.env.ENABLE_MOCK_DATA === 'true',
    skipEmailVerification: process.env.SKIP_EMAIL_VERIFICATION === 'true',
  },
};

// Environment-specific overrides
if (config.server.nodeEnv === 'production') {
  // Production overrides
  config.session.cookie.secure = true;
  config.logging.level = 'warn';
  config.development.enableDebugRoutes = false;
  config.development.enableSeeding = false;
  config.development.enableMockData = false;
  config.development.skipEmailVerification = false;
} else if (config.server.nodeEnv === 'test') {
  // Test overrides
  config.logging.level = 'error';
  config.development.enableSeeding = false;
  config.development.skipEmailVerification = true;
}

// Validation helper
export const validateConfig = (): void => {
  const errors: string[] = [];

  // Validate server configuration
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Invalid server port');
  }

  // Validate JWT configuration
  if (config.jwt.secret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long');
  }

  // Validate email configuration
  if (config.email.port < 1 || config.email.port > 65535) {
    errors.push('Invalid email port');
  }

  // Validate file upload configuration
  if (config.upload.maxFileSize < 1) {
    errors.push('Invalid max file size');
  }

  // Validate business rules
  if (config.business.maxAdvanceBookingDays < 1) {
    errors.push('Invalid max advance booking days');
  }

  if (config.business.maxBookingDuration < config.business.minBookingDuration) {
    errors.push('Max booking duration must be greater than min booking duration');
  }

  if (config.business.defaultDepositPercentage < 0 || config.business.defaultDepositPercentage > 100) {
    errors.push('Default deposit percentage must be between 0 and 100');
  }

  if (config.business.defaultTaxRate < 0 || config.business.defaultTaxRate > 1) {
    errors.push('Default tax rate must be between 0 and 1');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
};

// Export individual configuration sections for convenience
export const {
  server: serverConfig,
  database: databaseConfig,
  jwt: jwtConfig,
  redis: redisConfig,
  email: emailConfig,
  sms: smsConfig,
  stripe: stripeConfig,
  upload: uploadConfig,
  weather: weatherConfig,
  google: googleConfig,
  session: sessionConfig,
  security: securityConfig,
  logging: loggingConfig,
  jobs: jobsConfig,
  monitoring: monitoringConfig,
  features: featureFlags,
  cache: cacheConfig,
  pagination: paginationConfig,
  business: businessConfig,
  notifications: notificationsConfig,
  api: apiConfig,
  development: developmentConfig,
} = config;

// Validate configuration on module load
validateConfig();

export default config;
