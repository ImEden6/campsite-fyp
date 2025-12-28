/**
 * Booking Form Types
 * Shared type definitions for booking form components
 */

import { Calendar, Users, Car, Package, DollarSign } from 'lucide-react';
import type { Vehicle } from '@/types';

// ============================================================================
// GUEST DETAIL TYPE
// ============================================================================

/**
 * Individual guest information
 * Matches the structure used by GuestDetailsInput component
 */
export interface GuestDetail {
    firstName: string;
    lastName: string;
    isChild: boolean;
    age?: number;
}

// ============================================================================
// CORE FORM DATA
// ============================================================================

/**
 * Equipment reservation entry
 */
export interface EquipmentReservation {
    equipmentId: string;
    quantity: number;
}

/**
 * Core booking form data shared by all booking forms
 */
export interface BookingFormData {
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    children: number;
    pets: number;
    guestDetails: GuestDetail[];
    vehicles: Omit<Vehicle, 'id'>[];
    equipmentReservations: EquipmentReservation[];
    specialRequests: string;
}

/**
 * Form validation errors keyed by field name
 */
export interface BookingFormErrors {
    [key: string]: string;
}

/**
 * Primary guest information (from auth or guest checkout)
 */
export interface PrimaryGuestInfo {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
}

// ============================================================================
// MULTI-STEP FORM TYPES
// ============================================================================

/**
 * Type-safe step number to prevent invalid step access
 */
export type BookingFormStep = 1 | 2 | 3 | 4 | 5;

/**
 * Configuration for a booking form step
 */
export interface BookingStepConfig {
    num: BookingFormStep;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

/**
 * Default booking step configuration
 */
export const BOOKING_STEPS: BookingStepConfig[] = [
    { num: 1, label: 'Dates', icon: Calendar },
    { num: 2, label: 'Guests', icon: Users },
    { num: 3, label: 'Vehicles', icon: Car },
    { num: 4, label: 'Equipment', icon: Package },
    { num: 5, label: 'Review', icon: DollarSign },
];

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create initial form data with optional overrides
 */
export const createInitialFormData = (
    overrides?: Partial<BookingFormData>
): BookingFormData => ({
    checkInDate: '',
    checkOutDate: '',
    adults: 2,
    children: 0,
    pets: 0,
    guestDetails: [],
    vehicles: [],
    equipmentReservations: [],
    specialRequests: '',
    ...overrides,
});

/**
 * Type guard to check if a number is a valid BookingFormStep
 */
export const isValidStep = (step: number): step is BookingFormStep => {
    return step >= 1 && step <= 5 && Number.isInteger(step);
};
