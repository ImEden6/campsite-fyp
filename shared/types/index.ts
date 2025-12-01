// Core Types for Campsite Management System

// ============================================================================
// Utility Types
// ============================================================================

/**
 * ISO 8601 date string format for API responses
 * @example "2024-01-15T10:30:00.000Z"
 */
export type DateString = string;

/**
 * Utility type for creating new entities (omits auto-generated fields)
 */
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Utility type for updating entities (partial with required id)
 */
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> & { id: string };

/**
 * Normalized entity storage for efficient lookups
 */
export type NormalizedEntities<T extends { id: string }> = Record<string, T>;

/**
 * State structure for normalized entities
 */
export type EntityState<T extends { id: string }> = {
  byId: NormalizedEntities<T>;
  allIds: string[];
};

// ============================================================================
// Enums
// ============================================================================

// User and Authentication Types
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export enum VehicleType {
  CAR = 'car',
  TRUCK = 'truck',
  RV = 'rv',
  MOTORCYCLE = 'motorcycle',
  TRAILER = 'trailer'
}

export enum MeasurementUnit {
  FEET = 'feet',
  METERS = 'meters'
}

export enum GroupBookingStatus {
  INQUIRY = 'inquiry',
  QUOTED = 'quoted',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

export interface User {
  readonly id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  avatar?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: Theme;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================================
// Site and Accommodation Types
// ============================================================================

export enum SiteType {
  TENT = 'TENT',
  RV = 'RV',
  CABIN = 'CABIN'
}

export enum SiteStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export interface Site {
  readonly id: string;
  name: string;
  type: SiteType;
  status: SiteStatus;
  capacity: number;
  description?: string;
  amenities: string[];
  images: string[];
  /** Base price per night in the campsite's currency */
  basePrice: number;
  maxVehicles: number;
  maxTents: number;
  isPetFriendly: boolean;
  hasElectricity: boolean;
  hasWater: boolean;
  hasSewer: boolean;
  hasWifi: boolean;
  size: {
    length: number;
    width: number;
    unit: MeasurementUnit;
  };
  location: {
    latitude: number;
    longitude: number;
    mapPosition: { x: number; y: number };
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================================
// Booking and Reservation Types
// ============================================================================

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

/**
 * Booking represents a reservation for a campsite
 * Financial calculation: totalAmount = baseAmount + taxAmount - discountAmount
 * Payment tracking: paidAmount should not exceed totalAmount
 */
export interface Booking {
  readonly id: string;
  /** Unique human-readable booking reference number */
  readonly bookingNumber: string;
  userId: string;
  siteId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guests: {
    adults: number;
    children: number;
    pets: number;
  };
  vehicles: Vehicle[];
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  /** Total amount including tax, after discounts */
  totalAmount: number;
  /** Amount paid so far (should be <= totalAmount) */
  paidAmount: number;
  /** Initial deposit amount required */
  depositAmount: number;
  /** Tax amount included in totalAmount */
  taxAmount: number;
  /** Discount amount applied to reduce totalAmount */
  discountAmount: number;
  notes?: string;
  specialRequests?: string;
  /** Actual check-in timestamp (null until checked in) */
  checkInTime?: Date;
  /** Actual check-out timestamp (null until checked out) */
  checkOutTime?: Date;
  qrCode?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Relations
  user?: User;
  site?: Site;
  payments?: Payment[];
  equipmentRentals?: EquipmentRental[];
  communications?: Communication[];
}

export interface Vehicle {
  readonly id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  state: string;
  color: string;
  type: VehicleType;
}

// ============================================================================
// Payment Types
// ============================================================================

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH',
  CHECK = 'CHECK',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export interface Payment {
  readonly id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  /** Stripe payment intent ID (for card payments) */
  stripePaymentId?: string;
  /** Stripe refund ID (for refunded payments) */
  stripeRefundId?: string;
  /** Internal transaction reference ID */
  transactionId?: string;
  description?: string;
  receiptUrl?: string;
  processedAt?: Date;
  refundedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================================
// Equipment and Inventory Types
// ============================================================================

export enum EquipmentCategory {
  CAMPING_GEAR = 'CAMPING_GEAR',
  RECREATIONAL = 'RECREATIONAL',
  KITCHEN = 'KITCHEN',
  SAFETY = 'SAFETY',
  MAINTENANCE = 'MAINTENANCE'
}

export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

/**
 * Equipment specifications type for better type safety
 */
export interface EquipmentSpecifications {
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  material?: string;
  capacity?: number;
  [key: string]: unknown;
}

export interface Equipment {
  readonly id: string;
  name: string;
  description?: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  quantity: number;
  availableQuantity: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  deposit: number;
  images: string[];
  specifications?: EquipmentSpecifications;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface EquipmentRental {
  readonly id: string;
  bookingId: string;
  equipmentId: string;
  quantity: number;
  dailyRate: number;
  totalAmount: number;
  depositAmount: number;
  startDate: Date;
  endDate: Date;
  returnedAt?: Date;
  condition?: string;
  notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Relations
  equipment?: Equipment;
  booking?: Booking;
}

// ============================================================================
// Communication Types
// ============================================================================

export enum CommunicationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PHONE = 'PHONE',
  NOTE = 'NOTE'
}

/**
 * Communication metadata for additional context
 */
export interface CommunicationMetadata {
  emailId?: string;
  smsId?: string;
  deliveryStatus?: 'sent' | 'delivered' | 'failed' | 'bounced';
  [key: string]: unknown;
}

export interface Communication {
  readonly id: string;
  bookingId?: string;
  userId?: string;
  type: CommunicationType;
  subject?: string;
  message: string;
  sentBy: string;
  sentTo?: string;
  sentAt: Date;
  readAt?: Date;
  metadata?: CommunicationMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================================
// Pricing Types
// ============================================================================

/**
 * Pricing rule for dynamic pricing based on dates, site types, and other factors
 * - multiplier: multiply base price by priceModifier (e.g., 1.5 = 150% of base price)
 * - fixed: add/subtract priceModifier amount (e.g., +50 or -20)
 * - percentage: adjust base price by percentage (e.g., 20 = +20%, -15 = -15%)
 * Higher priority rules are applied first
 */
export interface PricingRule {
  readonly id: string;
  name: string;
  description?: string;
  siteTypes: SiteType[];
  startDate: Date;
  endDate: Date;
  /** Days of week (0-6, Sunday to Saturday) when rule applies */
  daysOfWeek: number[];
  /** Modifier value - interpretation depends on modifierType */
  priceModifier: number;
  /** How to apply the priceModifier to the base price */
  modifierType: 'multiplier' | 'fixed' | 'percentage';
  /** Minimum stay duration in nights for rule to apply */
  minStay?: number;
  /** Maximum stay duration in nights for rule to apply */
  maxStay?: number;
  /** Priority for rule application (higher = applied first) */
  priority: number;
  isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================================
// Group Booking Types
// ============================================================================

export interface GroupBooking {
  readonly id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  expectedGuests: number;
  expectedSites: number;
  eventDate: Date;
  eventEndDate?: Date;
  specialRate?: number;
  notes?: string;
  status: GroupBookingStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Relations
  bookings?: Booking[];
}

// ============================================================================
// Analytics and Reporting Types
// ============================================================================

export interface RevenueMetrics {
  totalRevenue: number;
  bookingRevenue: number;
  equipmentRevenue: number;
  averageBookingValue: number;
  revenueByMonth: { month: string; revenue: number }[];
  revenueByType: { type: string; revenue: number }[];
}

export interface OccupancyMetrics {
  totalSites: number;
  occupiedSites: number;
  occupancyRate: number;
  averageStayDuration: number;
  occupancyByMonth: { month: string; occupancy: number }[];
  occupancyByType: { type: SiteType; occupancy: number }[];
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  averageCustomerValue: number;
  customersByMonth: { month: string; customers: number }[];
}

// Notification Types
export enum NotificationType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CHECK_IN_REMINDER = 'CHECK_IN_REMINDER',
  CHECK_OUT_REMINDER = 'CHECK_OUT_REMINDER',
  CANCELLATION = 'CANCELLATION',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export interface Notification {
  readonly id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Additional contextual data for the notification */
  data?: Record<string, unknown>;
  isRead: boolean;
  sentAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface CampsiteSettings {
  readonly id: string;
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  policies: {
    checkInTime: string;
    checkOutTime: string;
    quietHours: { start: string; end: string };
    petPolicy: string;
    cancellationPolicy: string;
    refundPolicy: string;
  };
  features: {
    hasPool: boolean;
    hasPlayground: boolean;
    hasRestrooms: boolean;
    hasShowers: boolean;
    hasLaundry: boolean;
    hasStore: boolean;
    hasWifi: boolean;
    allowsPets: boolean;
    allowsFires: boolean;
  };
  timezone: string;
  currency: string;
  /** Tax rate as a decimal (e.g., 0.08 for 8%) */
  taxRate: number;
  /** Deposit percentage required (e.g., 20 for 20%) */
  depositPercentage: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Socket.io Event Types
export interface SocketEvents {
  // Booking events
  'booking:created': Booking;
  'booking:updated': Booking;
  'booking:cancelled': { bookingId: string };
  'booking:checked_in': Booking;
  'booking:checked_out': Booking;

  // Site events
  'site:status_changed': { siteId: string; status: SiteStatus };
  'site:availability_changed': { siteId: string; available: boolean };

  // Payment events
  'payment:processed': Payment;
  'payment:failed': { bookingId: string; error: string };
  'payment:refunded': Payment;

  // System events
  'system:maintenance': { message: string };
  'system:notification': Notification;

  // User events
  'user:online': { userId: string };
  'user:offline': { userId: string };
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
  timestamp: Date;
}

export interface FileUpload {
  readonly id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  readonly uploadedAt: Date;
}

// ============================================================================
// Weather Integration Types
// ============================================================================

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  condition: string;
  icon: string;
  forecast: WeatherForecast[];
  updatedAt: Date;
}

export interface WeatherForecast {
  date: Date;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
}

// ============================================================================
// Calendar Integration Types
// ============================================================================

/**
 * Calendar event metadata for additional context
 */
export interface CalendarEventMetadata {
  color?: string;
  reminder?: number; // minutes before event
  conferenceUrl?: string;
  [key: string]: unknown;
}

export interface CalendarEvent {
  readonly id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  attendees?: string[];
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: Date;
  };
  metadata?: CalendarEventMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================================
// API Response Entity Types (with DateString for serialization)
// ============================================================================

/**
 * API response versions of entities where Date fields are converted to DateString
 * Use these types for API responses to ensure proper serialization
 */

export type ApiUser = Omit<User, 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
  createdAt: DateString;
  updatedAt: DateString;
  lastLoginAt?: DateString;
};

export type ApiSite = Omit<Site, 'createdAt' | 'updatedAt'> & {
  createdAt: DateString;
  updatedAt: DateString;
};

export type ApiBooking = Omit<Booking, 'checkInDate' | 'checkOutDate' | 'checkInTime' | 'checkOutTime' | 'createdAt' | 'updatedAt' | 'user' | 'site' | 'payments' | 'equipmentRentals' | 'communications'> & {
  checkInDate: DateString;
  checkOutDate: DateString;
  checkInTime?: DateString;
  checkOutTime?: DateString;
  createdAt: DateString;
  updatedAt: DateString;
  user?: ApiUser;
  site?: ApiSite;
  payments?: ApiPayment[];
  equipmentRentals?: ApiEquipmentRental[];
  communications?: ApiCommunication[];
};

export type ApiPayment = Omit<Payment, 'processedAt' | 'refundedAt' | 'createdAt' | 'updatedAt'> & {
  processedAt?: DateString;
  refundedAt?: DateString;
  createdAt: DateString;
  updatedAt: DateString;
};

export type ApiEquipment = Omit<Equipment, 'createdAt' | 'updatedAt'> & {
  createdAt: DateString;
  updatedAt: DateString;
};

export type ApiEquipmentRental = Omit<EquipmentRental, 'startDate' | 'endDate' | 'returnedAt' | 'createdAt' | 'updatedAt' | 'equipment' | 'booking'> & {
  startDate: DateString;
  endDate: DateString;
  returnedAt?: DateString;
  createdAt: DateString;
  updatedAt: DateString;
  equipment?: ApiEquipment;
  booking?: ApiBooking;
};

export type ApiCommunication = Omit<Communication, 'sentAt' | 'readAt' | 'createdAt' | 'updatedAt'> & {
  sentAt: DateString;
  readAt?: DateString;
  createdAt: DateString;
  updatedAt: DateString;
};

export type ApiPricingRule = Omit<PricingRule, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> & {
  startDate: DateString;
  endDate: DateString;
  createdAt: DateString;
  updatedAt: DateString;
};

export type ApiGroupBooking = Omit<GroupBooking, 'eventDate' | 'eventEndDate' | 'createdAt' | 'updatedAt' | 'bookings'> & {
  eventDate: DateString;
  eventEndDate?: DateString;
  createdAt: DateString;
  updatedAt: DateString;
  bookings?: ApiBooking[];
};

export type ApiNotification = Omit<Notification, 'sentAt' | 'createdAt' | 'updatedAt'> & {
  sentAt?: DateString;
  createdAt: DateString;
  updatedAt: DateString;
};

export type ApiCampsiteSettings = Omit<CampsiteSettings, 'createdAt' | 'updatedAt'> & {
  createdAt: DateString;
  updatedAt: DateString;
};

export type ApiFileUpload = Omit<FileUpload, 'uploadedAt'> & {
  uploadedAt: DateString;
};

export type ApiWeatherData = Omit<WeatherData, 'updatedAt' | 'forecast'> & {
  updatedAt: DateString;
  forecast: ApiWeatherForecast[];
};

export type ApiWeatherForecast = Omit<WeatherForecast, 'date'> & {
  date: DateString;
};

export type ApiCalendarEvent = Omit<CalendarEvent, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'recurrence'> & {
  startDate: DateString;
  endDate: DateString;
  createdAt: DateString;
  updatedAt: DateString;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: DateString;
  };
};

// ============================================================================
// Error Tracking Export
// ============================================================================

// Export error tracking types
export * from './error-tracking';

