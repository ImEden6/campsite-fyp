/**
 * Property Validation Utilities
 * Validation functions for module properties with user-friendly error messages
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

// ============================================================================
// NUMERIC VALIDATORS
// ============================================================================

export function validateCapacity(value: number, min = 1, max = 100): ValidationResult {
    if (value < min) {
        return { valid: false, error: `Capacity must be at least ${min}` };
    }
    if (value > max) {
        return { valid: false, error: `Capacity cannot exceed ${max}` };
    }
    return { valid: true };
}

export function validatePrice(value: number): ValidationResult {
    if (value < 0) {
        return { valid: false, error: 'Price cannot be negative' };
    }
    if (value > 10000) {
        return { valid: false, error: 'Price cannot exceed $10,000' };
    }
    return { valid: true };
}

export function validateMultiplier(value: number): ValidationResult {
    if (value < 0.1) {
        return { valid: false, error: 'Multiplier must be at least 0.1' };
    }
    if (value > 10) {
        return { valid: false, error: 'Multiplier cannot exceed 10' };
    }
    return { valid: true };
}

export function validateVoltage(value: number): ValidationResult {
    if (value < 0) {
        return { valid: false, error: 'Voltage cannot be negative' };
    }
    if (value > 480) {
        return { valid: false, error: 'Voltage cannot exceed 480V' };
    }
    return { valid: true };
}

export function validateAmperage(value: number): ValidationResult {
    if (value < 0) {
        return { valid: false, error: 'Amperage cannot be negative' };
    }
    if (value > 200) {
        return { valid: false, error: 'Amperage cannot exceed 200A' };
    }
    return { valid: true };
}

export function validateSpeedLimit(value: number): ValidationResult {
    if (value < 0) {
        return { valid: false, error: 'Speed limit cannot be negative' };
    }
    if (value > 100) {
        return { valid: false, error: 'Speed limit cannot exceed 100 km/h' };
    }
    return { valid: true };
}

export function validateWidth(value: number): ValidationResult {
    if (value < 1) {
        return { valid: false, error: 'Width must be at least 1m' };
    }
    if (value > 50) {
        return { valid: false, error: 'Width cannot exceed 50m' };
    }
    return { valid: true };
}

export function validatePressure(value: number): ValidationResult {
    if (value < 0) {
        return { valid: false, error: 'Pressure cannot be negative' };
    }
    if (value > 200) {
        return { valid: false, error: 'Pressure cannot exceed 200 PSI' };
    }
    return { valid: true };
}

// ============================================================================
// STRING VALIDATORS
// ============================================================================

export function validateName(value: string): ValidationResult {
    if (!value || value.trim().length === 0) {
        return { valid: false, error: 'Name is required' };
    }
    if (value.length > 50) {
        return { valid: false, error: 'Name cannot exceed 50 characters' };
    }
    return { valid: true };
}

export function validateDescription(value: string): ValidationResult {
    if (value.length > 500) {
        return { valid: false, error: 'Description cannot exceed 500 characters' };
    }
    return { valid: true };
}

// ============================================================================
// TIME VALIDATORS
// ============================================================================

export function validateTime(hours: number, minutes: number): ValidationResult {
    if (hours < 0 || hours > 23) {
        return { valid: false, error: 'Hours must be 0-23' };
    }
    if (minutes < 0 || minutes > 59) {
        return { valid: false, error: 'Minutes must be 0-59' };
    }
    return { valid: true };
}

export function parseTimeString(time: string): { hours: number; minutes: number } | null {
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match || !match[1] || !match[2]) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (isNaN(hours) || isNaN(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return { hours, minutes };
}

export function formatTimeString(hours: number, minutes: number): string {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
