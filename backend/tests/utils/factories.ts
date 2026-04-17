/**
 * Test Data Factories
 * 
 * Pure data builders for test entities.
 * - No side effects
 * - Override via partials
 * - One factory per entity
 */

import {
    UserRole,
    SiteType,
    SiteStatus,
    BookingStatus,
    PaymentStatus,
    PaymentMethod,
    VehicleType,
    EquipmentCategory,
    EquipmentItemStatus as EquipmentStatus,
    GuestType,
    CommunicationType,
    NotificationType,
    GroupBookingStatus,
} from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Partial type for factory overrides.
 * Unlike DeepPartial, this preserves Date and array types.
 */
type PartialFactory<T> = {
    [P in keyof T]?: T[P] extends Date
    ? Date
    : T[P] extends (infer U)[]
    ? U[]
    : T[P] extends object | null
    ? T[P]
    : T[P];
};

// =============================================================================
// UTILITIES
// =============================================================================

let idCounter = 0;

function generateId(prefix = 'test'): string {
    idCounter++;
    return `${prefix}_${Date.now()}_${idCounter}`;
}

function generateEmail(name = 'user'): string {
    return `${name.toLowerCase().replace(/\s/g, '.')}_${Date.now()}@test.local`;
}

function generateBookingNumber(): string {
    return `BK${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function futureDate(daysFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
}

function pastDate(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
}

// Export utilities for test use
export { generateId, generateEmail, generateBookingNumber, futureDate, pastDate };

// =============================================================================
// USER FACTORIES
// =============================================================================

export interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: UserRole;
    password: string;
    isActive: boolean;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    avatar: string | null;
    avatarKey: string | null;
    lastLoginAt: Date | null;
    emailVerifiedAt: Date | null;
    phoneVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export function createUser(overrides: PartialFactory<UserData> = {}): UserData {
    const now = new Date();
    return {
        id: generateId('user'),
        email: generateEmail('test'),
        firstName: 'Test',
        lastName: 'User',
        phone: null,
        role: UserRole.CUSTOMER,
        password: '$2a$04$test.hash.for.testing.only', // Pre-hashed for tests
        isActive: true,
        isEmailVerified: false,
        isPhoneVerified: false,
        avatar: null,
        avatarKey: null,
        lastLoginAt: null,
        emailVerifiedAt: null,
        phoneVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

export function createAdmin(overrides: PartialFactory<UserData> = {}): UserData {
    return createUser({
        role: UserRole.ADMIN,
        firstName: 'Admin',
        isEmailVerified: true,
        ...overrides,
    });
}

export function createManager(overrides: PartialFactory<UserData> = {}): UserData {
    return createUser({
        role: UserRole.MANAGER,
        firstName: 'Manager',
        isEmailVerified: true,
        ...overrides,
    });
}

export function createStaff(overrides: PartialFactory<UserData> = {}): UserData {
    return createUser({
        role: UserRole.STAFF,
        firstName: 'Staff',
        isEmailVerified: true,
        ...overrides,
    });
}

export function createCustomer(overrides: PartialFactory<UserData> = {}): UserData {
    return createUser({
        role: UserRole.CUSTOMER,
        firstName: 'Customer',
        ...overrides,
    });
}

// =============================================================================
// SITE FACTORIES
// =============================================================================

export interface SiteData {
    id: string;
    name: string;
    type: SiteType;
    status: SiteStatus;
    capacity: number;
    description: string | null;
    amenities: string[];
    images: string[];
    basePrice: number;
    maxVehicles: number;
    maxTents: number;
    isPetFriendly: boolean;
    hasElectricity: boolean;
    hasWater: boolean;
    hasSewer: boolean;
    hasWifi: boolean;
    sizeLength: number;
    sizeWidth: number;
    sizeUnit: string;
    latitude: number;
    longitude: number;
    mapPositionX: number;
    mapPositionY: number;
    createdAt: Date;
    updatedAt: Date;
}

export function createSite(overrides: PartialFactory<SiteData> = {}): SiteData {
    const now = new Date();
    return {
        id: generateId('site'),
        name: `Site ${idCounter}`,
        type: SiteType.TENT,
        status: SiteStatus.AVAILABLE,
        capacity: 4,
        description: 'A comfortable campsite',
        amenities: ['fire_pit', 'picnic_table'],
        images: [],
        basePrice: 50.00,
        maxVehicles: 2,
        maxTents: 1,
        isPetFriendly: false,
        hasElectricity: false,
        hasWater: false,
        hasSewer: false,
        hasWifi: false,
        sizeLength: 30,
        sizeWidth: 20,
        sizeUnit: 'feet',
        latitude: 40.7128,
        longitude: -74.0060,
        mapPositionX: 100,
        mapPositionY: 100,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

export function createRVSite(overrides: PartialFactory<SiteData> = {}): SiteData {
    return createSite({
        type: SiteType.RV,
        hasElectricity: true,
        hasWater: true,
        hasSewer: true,
        basePrice: 75.00,
        capacity: 6,
        sizeLength: 50,
        sizeWidth: 15,
        ...overrides,
    });
}

export function createCabin(overrides: PartialFactory<SiteData> = {}): SiteData {
    return createSite({
        type: SiteType.CABIN,
        hasElectricity: true,
        hasWater: true,
        hasWifi: true,
        basePrice: 150.00,
        capacity: 8,
        ...overrides,
    });
}

// =============================================================================
// BOOKING FACTORIES
// =============================================================================

export interface BookingData {
    id: string;
    bookingNumber: string;
    userId: string;
    siteId: string;
    checkInDate: Date;
    checkOutDate: Date;
    adultGuests: number;
    childGuests: number;
    petGuests: number;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    paidAmount: number;
    depositAmount: number;
    taxAmount: number;
    discountAmount: number;
    notes: string | null;
    specialRequests: string | null;
    checkInTime: Date | null;
    checkOutTime: Date | null;
    qrCode: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export function createBooking(overrides: PartialFactory<BookingData> = {}): BookingData {
    const now = new Date();
    const checkIn = futureDate(7);
    const checkOut = futureDate(10);

    return {
        id: generateId('booking'),
        bookingNumber: generateBookingNumber(),
        userId: generateId('user'),
        siteId: generateId('site'),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adultGuests: 2,
        childGuests: 0,
        petGuests: 0,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 150.00,
        paidAmount: 0,
        depositAmount: 37.50,
        taxAmount: 12.00,
        discountAmount: 0,
        notes: null,
        specialRequests: null,
        checkInTime: null,
        checkOutTime: null,
        qrCode: null,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

export function createConfirmedBooking(overrides: PartialFactory<BookingData> = {}): BookingData {
    return createBooking({
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        paidAmount: 150.00,
        ...overrides,
    });
}

export function createCheckedInBooking(overrides: PartialFactory<BookingData> = {}): BookingData {
    return createBooking({
        status: BookingStatus.CHECKED_IN,
        paymentStatus: PaymentStatus.PAID,
        paidAmount: 150.00,
        checkInTime: new Date(),
        checkInDate: pastDate(1),
        checkOutDate: futureDate(2),
        ...overrides,
    });
}

// =============================================================================
// PAYMENT FACTORIES
// =============================================================================

export interface PaymentData {
    id: string;
    bookingId: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    stripePaymentId: string | null;
    stripeRefundId: string | null;
    transactionId: string | null;
    description: string | null;
    receiptUrl: string | null;
    processedAt: Date | null;
    refundedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export function createPayment(overrides: PartialFactory<PaymentData> = {}): PaymentData {
    const now = new Date();
    return {
        id: generateId('payment'),
        bookingId: generateId('booking'),
        userId: generateId('user'),
        amount: 150.00,
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        stripePaymentId: null,
        stripeRefundId: null,
        transactionId: null,
        description: 'Booking payment',
        receiptUrl: null,
        processedAt: null,
        refundedAt: null,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

export function createCompletedPayment(overrides: PartialFactory<PaymentData> = {}): PaymentData {
    return createPayment({
        status: PaymentStatus.PAID,
        stripePaymentId: `pi_test_${generateId()}`,
        processedAt: new Date(),
        ...overrides,
    });
}

// =============================================================================
// EQUIPMENT FACTORIES
// =============================================================================

export interface EquipmentData {
    id: string;
    name: string;
    description: string | null;
    category: EquipmentCategory;
    status: EquipmentStatus;
    quantity: number;
    availableQuantity: number;
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    deposit: number;
    images: string[];
    specifications: object | null;
    createdAt: Date;
    updatedAt: Date;
}

export function createEquipment(overrides: PartialFactory<EquipmentData> = {}): EquipmentData {
    const now = new Date();
    return {
        id: generateId('equipment'),
        name: 'Camping Tent',
        description: 'A 4-person dome tent',
        category: EquipmentCategory.CAMPING_GEAR,
        status: EquipmentStatus.AVAILABLE,
        quantity: 5,
        availableQuantity: 5,
        dailyRate: 15.00,
        weeklyRate: 90.00,
        monthlyRate: 300.00,
        deposit: 50.00,
        images: [],
        specifications: null,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

// =============================================================================
// GUEST FACTORIES
// =============================================================================

export interface GuestData {
    id: string;
    bookingId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    type: GuestType;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export function createGuest(overrides: PartialFactory<GuestData> = {}): GuestData {
    const now = new Date();
    return {
        id: generateId('guest'),
        bookingId: generateId('booking'),
        firstName: 'Guest',
        lastName: 'User',
        email: null,
        phone: null,
        type: GuestType.ADULT,
        isPrimary: false,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

export function createPrimaryGuest(overrides: PartialFactory<GuestData> = {}): GuestData {
    return createGuest({
        isPrimary: true,
        email: generateEmail('guest'),
        ...overrides,
    });
}

// =============================================================================
// VEHICLE FACTORIES
// =============================================================================

export interface VehicleData {
    id: string;
    bookingId: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    state: string;
    color: string;
    type: VehicleType;
    createdAt: Date;
    updatedAt: Date;
}

export function createVehicle(overrides: PartialFactory<VehicleData> = {}): VehicleData {
    const now = new Date();
    return {
        id: generateId('vehicle'),
        bookingId: generateId('booking'),
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: `ABC${Math.floor(Math.random() * 9999)}`,
        state: 'CA',
        color: 'Silver',
        type: VehicleType.CAR,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

// =============================================================================
// RESET
// =============================================================================

/**
 * Resets the ID counter. Call in beforeEach for deterministic IDs.
 */
export function resetFactories(): void {
    idCounter = 0;
}
