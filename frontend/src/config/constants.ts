/**
 * Application Constants
 * Centralized constants used throughout the application
 */

// API Configuration
export const API_TIMEOUT = 10000; // 10 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// WebSocket Configuration
export const WS_RECONNECT_ATTEMPTS = 5;
export const WS_RECONNECT_DELAY = 1000; // 1 second
export const WS_MAX_RECONNECT_DELAY = 30000; // 30 seconds

// React Query Configuration
export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const QUERY_CACHE_TIME = 10 * 60 * 1000; // 10 minutes
export const QUERY_RETRY_ATTEMPTS = 3;

// Authentication
export const TOKEN_STORAGE_KEY = 'campsite_auth_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'campsite_refresh_token';
export const USER_STORAGE_KEY = 'campsite_user';
export const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';
export const DATE_INPUT_FORMAT = 'yyyy-MM-dd';

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGES_PER_SITE = 10;

// Booking
export const MIN_BOOKING_DAYS = 1;
export const MAX_BOOKING_DAYS = 30;
export const BOOKING_ADVANCE_DAYS = 365; // Can book up to 1 year in advance
export const CHECK_IN_TIME = '14:00';
export const CHECK_OUT_TIME = '11:00';

// Site Types
export const SITE_TYPES = {
  TENT: 'TENT',
  RV: 'RV',
  CABIN: 'CABIN',
} as const;

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  BOOKING: 'BOOKING',
  PAYMENT: 'PAYMENT',
  SYSTEM: 'SYSTEM',
  REMINDER: 'REMINDER',
} as const;

// Toast Duration
export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 7000,
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const;

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 50,
  STICKY: 60,
  FIXED: 70,
  MODAL_BACKDROP: 80,
  MODAL: 90,
  POPOVER: 100,
  TOOLTIP: 110,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: TOKEN_STORAGE_KEY,
  REFRESH_TOKEN: REFRESH_TOKEN_STORAGE_KEY,
  USER: USER_STORAGE_KEY,
  THEME: 'campsite_theme',
  SIDEBAR_COLLAPSED: 'campsite_sidebar_collapsed',
  LANGUAGE: 'campsite_language',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  BOOKINGS: '/bookings',
  BOOK_SITE: '/book',
  MANAGE_BOOKINGS: '/manage/bookings',
  CHECK_IN: '/manage/check-in',
  CHECK_OUT: '/manage/check-out',
  CALENDAR: '/manage/calendar',
  ADMIN_DASHBOARD: '/admin/dashboard',
  SITES: '/admin/sites',
  MAP_EDITOR: '/admin/map-editor',
  USERS: '/admin/users',
  EQUIPMENT: '/admin/equipment',
  ANALYTICS: '/admin/analytics',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  NOT_FOUND: '/404',
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_CANCELLED: 'booking:cancelled',
  PAYMENT_PROCESSED: 'payment:processed',
  SITE_STATUS_CHANGED: 'site:status_changed',
  NOTIFICATION: 'notification',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
} as const;
