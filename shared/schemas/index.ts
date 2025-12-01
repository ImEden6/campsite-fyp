// Zod Validation Schemas for Campsite Management System

import { z } from 'zod';
import { VALIDATION_RULES, REGEX_PATTERNS } from '../constants';

// Base schemas for common validations
const emailSchema = z.string().email().max(VALIDATION_RULES.USER.EMAIL_MAX_LENGTH);
const phoneSchema = z.string().regex(VALIDATION_RULES.USER.PHONE_REGEX).optional();
const passwordSchema = z.string()
  .min(VALIDATION_RULES.USER.PASSWORD_MIN_LENGTH)
  .max(VALIDATION_RULES.USER.PASSWORD_MAX_LENGTH)
  .regex(REGEX_PATTERNS.PASSWORD, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const nameSchema = z.string()
  .min(VALIDATION_RULES.USER.NAME_MIN_LENGTH)
  .max(VALIDATION_RULES.USER.NAME_MAX_LENGTH)
  .trim();

const priceSchema = z.number()
  .min(VALIDATION_RULES.SITE.MIN_PRICE)
  .max(VALIDATION_RULES.SITE.MAX_PRICE);

const positiveNumberSchema = z.number().positive();
const nonNegativeNumberSchema = z.number().nonnegative();

// User schemas
export const userRoleSchema = z.enum(['ADMIN', 'MANAGER', 'STAFF']);

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }),
  language: z.string().min(2).max(5),
  timezone: z.string(),
});

export const createUserSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  password: passwordSchema,
  phone: phoneSchema,
  role: userRoleSchema.optional().default('STAFF'),
  preferences: userPreferencesSchema.optional(),
});

export const updateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema,
  preferences: userPreferencesSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1),
  phone: phoneSchema,
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Site schemas
export const siteTypeSchema = z.enum(['TENT', 'RV', 'CABIN']);
export const siteStatusSchema = z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE']);

export const siteLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  mapPosition: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const siteSizeSchema = z.object({
  length: positiveNumberSchema,
  width: positiveNumberSchema,
  unit: z.enum(['feet', 'meters']),
});

export const createSiteSchema = z.object({
  name: z.string().min(1).max(VALIDATION_RULES.SITE.NAME_MAX_LENGTH),
  type: siteTypeSchema,
  capacity: z.number().min(1).max(VALIDATION_RULES.SITE.MAX_CAPACITY),
  description: z.string().max(VALIDATION_RULES.SITE.DESCRIPTION_MAX_LENGTH).optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  basePrice: priceSchema,
  maxVehicles: z.number().min(0).max(VALIDATION_RULES.SITE.MAX_VEHICLES),
  maxTents: z.number().min(0).max(VALIDATION_RULES.SITE.MAX_TENTS),
  isPetFriendly: z.boolean().default(false),
  hasElectricity: z.boolean().default(false),
  hasWater: z.boolean().default(false),
  hasSewer: z.boolean().default(false),
  hasWifi: z.boolean().default(false),
  size: siteSizeSchema,
  location: siteLocationSchema,
});

export const updateSiteSchema = createSiteSchema.partial().extend({
  status: siteStatusSchema.optional(),
});

export const siteAvailabilitySchema = z.object({
  siteId: z.string().uuid().optional(),
  siteType: siteTypeSchema.optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  guests: z.number().min(1).max(VALIDATION_RULES.BOOKING.MAX_GUESTS).optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Booking schemas
export const bookingStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW']);
export const paymentStatusSchema = z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'FAILED']);

export const vehicleSchema = z.object({
  id: z.string().uuid().optional(),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().regex(REGEX_PATTERNS.LICENSE_PLATE),
  state: z.string().min(2).max(2),
  color: z.string().min(1).max(30),
  type: z.enum(['car', 'truck', 'rv', 'motorcycle', 'trailer']),
});

export const guestInfoSchema = z.object({
  adults: z.number().min(1).max(VALIDATION_RULES.BOOKING.MAX_GUESTS),
  children: z.number().min(0).max(VALIDATION_RULES.BOOKING.MAX_GUESTS),
  pets: z.number().min(0).max(5),
});

export const createBookingSchema = z.object({
  siteId: z.string().uuid(),
  checkInDate: z.string().datetime().or(z.date()),
  checkOutDate: z.string().datetime().or(z.date()),
  guests: guestInfoSchema,
  vehicles: z.array(vehicleSchema).max(VALIDATION_RULES.BOOKING.MAX_VEHICLES),
  notes: z.string().max(1000).optional(),
  specialRequests: z.string().max(1000).optional(),
}).refine((data) => {
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);
  const now = new Date();
  const daysBetween = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return checkIn >= now &&
    checkOut > checkIn &&
    daysBetween >= VALIDATION_RULES.BOOKING.MIN_STAY_DAYS &&
    daysBetween <= VALIDATION_RULES.BOOKING.MAX_STAY_DAYS;
}, {
  message: 'Invalid date range',
  path: ['checkOutDate'],
}).refine((data) => {
  const totalGuests = data.guests.adults + data.guests.children;
  return totalGuests <= VALIDATION_RULES.BOOKING.MAX_GUESTS;
}, {
  message: 'Total guests exceed maximum allowed',
  path: ['guests'],
});

export const updateBookingSchema = z.object({
  checkInDate: z.string().datetime().or(z.date()).optional(),
  checkOutDate: z.string().datetime().or(z.date()).optional(),
  guests: guestInfoSchema.optional(),
  vehicles: z.array(vehicleSchema).max(VALIDATION_RULES.BOOKING.MAX_VEHICLES).optional(),
  notes: z.string().max(1000).optional(),
  specialRequests: z.string().max(1000).optional(),
  status: bookingStatusSchema.optional(),
});

export const bookingSearchSchema = z.object({
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  status: bookingStatusSchema.optional(),
  siteType: siteTypeSchema.optional(),
  userId: z.string().uuid().optional(),
  bookingNumber: z.string().regex(REGEX_PATTERNS.BOOKING_NUMBER).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Payment schemas
export const paymentMethodSchema = z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'CHECK', 'BANK_TRANSFER']);

export const processPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().min(VALIDATION_RULES.PAYMENT.MIN_AMOUNT).max(VALIDATION_RULES.PAYMENT.MAX_AMOUNT),
  method: paymentMethodSchema,
  stripePaymentMethodId: z.string().optional(),
  description: z.string().max(255).optional(),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().min(VALIDATION_RULES.PAYMENT.MIN_AMOUNT).optional(),
  reason: z.string().max(500).optional(),
});

// Equipment schemas
export const equipmentCategorySchema = z.enum(['CAMPING_GEAR', 'RECREATIONAL', 'KITCHEN', 'SAFETY', 'MAINTENANCE']);
export const equipmentStatusSchema = z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE']);

export const createEquipmentSchema = z.object({
  name: z.string().min(1).max(VALIDATION_RULES.EQUIPMENT.NAME_MAX_LENGTH),
  description: z.string().max(VALIDATION_RULES.EQUIPMENT.DESCRIPTION_MAX_LENGTH).optional(),
  category: equipmentCategorySchema,
  quantity: z.number().min(VALIDATION_RULES.EQUIPMENT.MIN_QUANTITY).max(VALIDATION_RULES.EQUIPMENT.MAX_QUANTITY),
  dailyRate: z.number().min(VALIDATION_RULES.EQUIPMENT.MIN_RATE).max(VALIDATION_RULES.EQUIPMENT.MAX_RATE),
  weeklyRate: z.number().min(VALIDATION_RULES.EQUIPMENT.MIN_RATE).max(VALIDATION_RULES.EQUIPMENT.MAX_RATE),
  monthlyRate: z.number().min(VALIDATION_RULES.EQUIPMENT.MIN_RATE).max(VALIDATION_RULES.EQUIPMENT.MAX_RATE),
  deposit: nonNegativeNumberSchema,
  images: z.array(z.string().url()).default([]),
  specifications: z.record(z.any()).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial().extend({
  status: equipmentStatusSchema.optional(),
});

export const equipmentRentalSchema = z.object({
  equipmentId: z.string().uuid(),
  quantity: z.number().min(1),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Communication schemas
export const communicationTypeSchema = z.enum(['EMAIL', 'SMS', 'PHONE', 'NOTE']);

export const createCommunicationSchema = z.object({
  bookingId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  type: communicationTypeSchema,
  subject: z.string().max(255).optional(),
  message: z.string().min(1).max(5000),
  sentTo: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Notification schemas
export const notificationTypeSchema = z.enum([
  'BOOKING_CONFIRMATION',
  'BOOKING_REMINDER',
  'PAYMENT_CONFIRMATION',
  'PAYMENT_FAILED',
  'CHECK_IN_REMINDER',
  'CHECK_OUT_REMINDER',
  'CANCELLATION',
  'SYSTEM_ALERT'
]);

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
});

// Pricing schemas
export const pricingRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  siteTypes: z.array(siteTypeSchema),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  priceModifier: z.number(),
  modifierType: z.enum(['multiplier', 'fixed', 'percentage']),
  minStay: z.number().min(1).optional(),
  maxStay: z.number().min(1).optional(),
  priority: z.number().min(1).max(100),
  isActive: z.boolean().default(true),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Group booking schemas
export const groupBookingSchema = z.object({
  name: z.string().min(1).max(100),
  contactName: nameSchema,
  contactEmail: emailSchema,
  contactPhone: z.string().regex(VALIDATION_RULES.USER.PHONE_REGEX),
  expectedGuests: z.number().min(1).max(1000),
  expectedSites: z.number().min(1).max(100),
  eventDate: z.string().datetime().or(z.date()),
  eventEndDate: z.string().datetime().or(z.date()).optional(),
  specialRate: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

// Settings schemas
export const campsiteSettingsSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  address: z.object({
    street: z.string().min(1).max(100),
    city: z.string().min(1).max(50),
    state: z.string().min(2).max(50),
    zipCode: z.string().regex(REGEX_PATTERNS.ZIP_CODE),
    country: z.string().min(2).max(50),
  }),
  contact: z.object({
    phone: z.string().regex(VALIDATION_RULES.USER.PHONE_REGEX),
    email: emailSchema,
    website: z.string().url().optional(),
  }),
  policies: z.object({
    checkInTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    checkOutTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    quietHours: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
    petPolicy: z.string().max(1000),
    cancellationPolicy: z.string().max(1000),
    refundPolicy: z.string().max(1000),
  }),
  features: z.object({
    hasPool: z.boolean().default(false),
    hasPlayground: z.boolean().default(false),
    hasRestrooms: z.boolean().default(true),
    hasShowers: z.boolean().default(true),
    hasLaundry: z.boolean().default(false),
    hasStore: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
    allowsPets: z.boolean().default(false),
    allowsFires: z.boolean().default(false),
  }),
  timezone: z.string().min(1),
  currency: z.string().length(VALIDATION_RULES.PAYMENT.CURRENCY_CODE_LENGTH),
  taxRate: z.number().min(0).max(1),
  depositPercentage: z.number().min(0).max(100),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  category: z.enum(['site_image', 'equipment_image', 'document', 'avatar']),
  metadata: z.record(z.any()).optional(),
});

// Search and pagination schemas
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  category: z.enum(['users', 'bookings', 'sites', 'equipment']).optional(),
  filters: z.record(z.any()).optional(),
}).merge(paginationSchema);

// Analytics schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  groupBy: z.enum(['day', 'week', 'month', 'year']).default('month'),
  metrics: z.array(z.enum(['revenue', 'bookings', 'occupancy', 'customers'])).default(['revenue']),
  siteTypes: z.array(siteTypeSchema).optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Calendar integration schemas
export const calendarEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  allDay: z.boolean().default(false),
  location: z.string().max(255).optional(),
  attendees: z.array(emailSchema).optional(),
  recurrence: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().min(1).max(100),
    until: z.string().datetime().or(z.date()).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

// Validation utility functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Invalid data format'] };
  }
};

export const validateSchemaAsync = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<{ success: boolean; data?: T; errors?: string[] }> => {
  try {
    const result = await schema.parseAsync(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Invalid data format'] };
  }
};

// Export type inference helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type BookingSearchInput = z.infer<typeof bookingSearchSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type CampsiteSettingsInput = z.infer<typeof campsiteSettingsSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
