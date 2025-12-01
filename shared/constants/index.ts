// Constants for Campsite Management System

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    PROFILE: '/api/auth/profile',
  },

  // Users
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    SEARCH: '/api/users/search',
    ROLES: '/api/users/roles',
  },

  // Sites
  SITES: {
    BASE: '/api/sites',
    BY_ID: (id: string) => `/api/sites/${id}`,
    AVAILABILITY: '/api/sites/availability',
    SEARCH: '/api/sites/search',
    TYPES: '/api/sites/types',
  },

  // Bookings
  BOOKINGS: {
    BASE: '/api/bookings',
    BY_ID: (id: string) => `/api/bookings/${id}`,
    BY_USER: (userId: string) => `/api/bookings/user/${userId}`,
    SEARCH: '/api/bookings/search',
    CHECK_IN: (id: string) => `/api/bookings/${id}/check-in`,
    CHECK_OUT: (id: string) => `/api/bookings/${id}/check-out`,
    CANCEL: (id: string) => `/api/bookings/${id}/cancel`,
    QR_CODE: (id: string) => `/api/bookings/${id}/qr-code`,
  },

  // Payments
  PAYMENTS: {
    BASE: '/api/payments',
    BY_ID: (id: string) => `/api/payments/${id}`,
    BY_BOOKING: (bookingId: string) => `/api/payments/booking/${bookingId}`,
    PROCESS: '/api/payments/process',
    REFUND: (id: string) => `/api/payments/${id}/refund`,
    RECEIPT: (id: string) => `/api/payments/${id}/receipt`,
  },

  // Equipment
  EQUIPMENT: {
    BASE: '/api/equipment',
    BY_ID: (id: string) => `/api/equipment/${id}`,
    RENTALS: '/api/equipment/rentals',
    AVAILABILITY: '/api/equipment/availability',
    CATEGORIES: '/api/equipment/categories',
  },

  ANALYTICS: {
    REVENUE: '/api/analytics/revenue',
    OCCUPANCY: '/api/analytics/occupancy',
    DASHBOARD: '/api/analytics/dashboard',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    BY_USER: (userId: string) => `/api/notifications/user/${userId}`,
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    SEND: '/api/notifications/send',
  },

  // Settings
  SETTINGS: {
    BASE: '/api/settings',
    CAMPSITE: '/api/settings/campsite',
    PRICING: '/api/settings/pricing',
    POLICIES: '/api/settings/policies',
  },

  // File uploads
  FILES: {
    UPLOAD: '/api/files/upload',
    BY_ID: (id: string) => `/api/files/${id}`,
    DELETE: (id: string) => `/api/files/${id}`,
  },

  // Weather
  WEATHER: {
    CURRENT: '/api/weather/current',
    FORECAST: '/api/weather/forecast',
  },

  // Calendar
  CALENDAR: {
    EVENTS: '/api/calendar/events',
    SYNC: '/api/calendar/sync',
  },
};

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Booking events
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_CANCELLED: 'booking:cancelled',
  BOOKING_CHECKED_IN: 'booking:checked_in',
  BOOKING_CHECKED_OUT: 'booking:checked_out',

  // Site events
  SITE_STATUS_CHANGED: 'site:status_changed',
  SITE_AVAILABILITY_CHANGED: 'site:availability_changed',

  // Payment events
  PAYMENT_PROCESSED: 'payment:processed',
  PAYMENT_FAILED: 'payment:failed',
  PAYMENT_REFUNDED: 'payment:refunded',

  // System events
  SYSTEM_MAINTENANCE: 'system:maintenance',
  SYSTEM_NOTIFICATION: 'system:notification',

  // User events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Real-time updates
  REAL_TIME_UPDATE: 'real_time_update',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
};

export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Business Logic
  SITE_NOT_AVAILABLE: 'SITE_NOT_AVAILABLE',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  REFUND_NOT_ALLOWED: 'REFUND_NOT_ALLOWED',
  EQUIPMENT_UNAVAILABLE: 'EQUIPMENT_UNAVAILABLE',

  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Not Found
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  SITE_NOT_FOUND: 'SITE_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  EQUIPMENT_NOT_FOUND: 'EQUIPMENT_NOT_FOUND',
};

export const VALIDATION_RULES = {
  // User validation
  USER: {
    EMAIL_MAX_LENGTH: 255,
    NAME_MAX_LENGTH: 50,
    NAME_MIN_LENGTH: 2,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    PHONE_REGEX: /^\+?[\d\s\-()]+$/,
  },

  // Booking validation
  BOOKING: {
    MIN_STAY_DAYS: 1,
    MAX_STAY_DAYS: 30,
    MAX_GUESTS: 10,
    MAX_VEHICLES: 3,
    ADVANCE_BOOKING_DAYS: 365,
    BOOKING_NUMBER_LENGTH: 10,
  },

  // Site validation
  SITE: {
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 1000,
    MAX_CAPACITY: 20,
    MAX_VEHICLES: 5,
    MAX_TENTS: 5,
    MIN_PRICE: 0,
    MAX_PRICE: 1000,
  },

  // Payment validation
  PAYMENT: {
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 10000,
    CURRENCY_CODE_LENGTH: 3,
  },

  // Equipment validation
  EQUIPMENT: {
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 1000,
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 1000,
    MIN_RATE: 0,
    MAX_RATE: 500,
  },
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  SORT_ORDER: 'desc' as const,
};

export const CACHE_KEYS = {
  // User cache
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_PERMISSIONS: (userId: string) => `user:permissions:${userId}`,

  // Site cache
  SITE_AVAILABILITY: (siteId: string, date: string) => `site:availability:${siteId}:${date}`,
  SITE_PRICING: (siteId: string) => `site:pricing:${siteId}`,
  SITES_BY_TYPE: (type: string) => `sites:type:${type}`,

  // Booking cache
  BOOKING_CALENDAR: (year: number, month: number) => `booking:calendar:${year}:${month}`,
  USER_BOOKINGS: (userId: string) => `user:bookings:${userId}`,

  // Analytics cache
  REVENUE_METRICS: (period: string) => `analytics:revenue:${period}`,
  OCCUPANCY_METRICS: (period: string) => `analytics:occupancy:${period}`,
  DASHBOARD_METRICS: 'analytics:dashboard',

  // Settings cache
  CAMPSITE_SETTINGS: 'settings:campsite',
  PRICING_RULES: 'settings:pricing',

  // Weather cache
  WEATHER_DATA: 'weather:current',
  WEATHER_FORECAST: 'weather:forecast',
};

export const CACHE_TTL = {
  // Short-term cache (5 minutes)
  SHORT: 300,
  // Medium-term cache (1 hour)
  MEDIUM: 3600,
  // Long-term cache (24 hours)
  LONG: 86400,
  // Very long-term cache (1 week)
  VERY_LONG: 604800,
};

export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
  },
  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per windowMs
  },

  // General API endpoints
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
  },

  // File upload endpoints
  UPLOAD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 uploads per windowMs
  },

  // Payment endpoints
  PAYMENT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 payment requests per windowMs
  },
};

export const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMATION: 'booking-confirmation',
  BOOKING_REMINDER: 'booking-reminder',
  PAYMENT_CONFIRMATION: 'payment-confirmation',
  PAYMENT_FAILED: 'payment-failed',
  CHECK_IN_REMINDER: 'check-in-reminder',
  CHECK_OUT_REMINDER: 'check-out-reminder',
  CANCELLATION: 'cancellation',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  EMAIL_VERIFICATION: 'email-verification',
};

export const SMS_TEMPLATES = {
  BOOKING_CONFIRMATION: 'Your booking at {campsite} has been confirmed. Check-in: {checkIn}. Booking #: {bookingNumber}',
  BOOKING_REMINDER: 'Reminder: Your stay at {campsite} starts tomorrow. Check-in: {checkIn}. Booking #: {bookingNumber}',
  PAYMENT_CONFIRMATION: 'Payment of ${amount} for booking #{bookingNumber} has been processed successfully.',
  CHECK_IN_REMINDER: 'Check-in time is {checkIn} today. Your site is {siteName}. Booking #: {bookingNumber}',
  CHECK_OUT_REMINDER: 'Check-out time is {checkOut} today. Thank you for staying with us!',
  CANCELLATION: 'Your booking #{bookingNumber} has been cancelled. Refund details will be sent separately.',
};

export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export const SECURITY_HEADERS = {
  CONTENT_SECURITY_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;",
  X_FRAME_OPTIONS: 'DENY',
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
  PERMISSIONS_POLICY: 'geolocation=(self), microphone=(), camera=()',
};

export const BOOKING_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

export const SITE_TYPES = {
  TENT: 'TENT',
  RV: 'RV',
  CABIN: 'CABIN',
} as const;

export const SITE_STATUSES = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
} as const;

export const EQUIPMENT_CATEGORIES = {
  CAMPING_GEAR: 'CAMPING_GEAR',
  RECREATIONAL: 'RECREATIONAL',
  KITCHEN: 'KITCHEN',
  SAFETY: 'SAFETY',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export const EQUIPMENT_STATUSES = {
  AVAILABLE: 'AVAILABLE',
  RENTED: 'RENTED',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
} as const;

export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  BOOKING_REMINDER: 'BOOKING_REMINDER',
  PAYMENT_CONFIRMATION: 'PAYMENT_CONFIRMATION',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  CHECK_IN_REMINDER: 'CHECK_IN_REMINDER',
  CHECK_OUT_REMINDER: 'CHECK_OUT_REMINDER',
  CANCELLATION: 'CANCELLATION',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
} as const;

export const COMMUNICATION_TYPES = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PHONE: 'PHONE',
  NOTE: 'NOTE',
} as const;

export const PAYMENT_METHODS = {
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  CASH: 'CASH',
  CHECK: 'CHECK',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;

export const DEFAULT_TIMEZONE = 'America/New_York';
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_LANGUAGE = 'en';

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  BOOKING_NUMBER: /^[A-Z0-9]{10}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  CREDIT_CARD: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
  LICENSE_PLATE: /^[A-Z0-9\-\s]{2,10}$/,
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  TIME: 'HH:mm',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
};

export const CURRENCY_FORMATS = {
  USD: {
    symbol: '$',
    decimals: 2,
    separator: ',',
    decimal: '.',
  },
  EUR: {
    symbol: '€',
    decimals: 2,
    separator: '.',
    decimal: ',',
  },
  GBP: {
    symbol: '£',
    decimals: 2,
    separator: ',',
    decimal: '.',
  },
};

export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3',
  BACKGROUND: '#fafafa',
  SURFACE: '#ffffff',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
};
