/**
 * Validation Utilities
 * Provides validation functions for module properties, transforms, and clipboard data
 */

import type { Position, Size, AnyModule, ModuleType, CampsiteMap } from '@/types';

// ============================================================================
// VALIDATION ERROR TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALIDATION_CONSTANTS = {
  MIN_SIZE: { width: 20, height: 20 },
  MAX_SIZE: { width: 10000, height: 10000 },
  MIN_ROTATION: 0,
  MAX_ROTATION: 360,
  MIN_Z_INDEX: 0,
  MAX_Z_INDEX: 1000,
  MAX_NAME_LENGTH: 100,
  MIN_CAPACITY: 0,
  MAX_CAPACITY: 1000,
  MIN_PRICE: 0,
  MAX_PRICE: 100000,
} as const;

// ============================================================================
// SIZE VALIDATION
// ============================================================================

/**
 * Validate size constraints (minimum 20x20 pixels)
 */
export function validateSize(size: Size): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof size.width !== 'number' || isNaN(size.width)) {
    errors.push({
      field: 'size.width',
      message: 'Width must be a valid number',
      code: 'INVALID_WIDTH_TYPE',
    });
  } else if (size.width < VALIDATION_CONSTANTS.MIN_SIZE.width) {
    errors.push({
      field: 'size.width',
      message: `Width must be at least ${VALIDATION_CONSTANTS.MIN_SIZE.width} pixels`,
      code: 'WIDTH_TOO_SMALL',
    });
  } else if (size.width > VALIDATION_CONSTANTS.MAX_SIZE.width) {
    errors.push({
      field: 'size.width',
      message: `Width must be less than ${VALIDATION_CONSTANTS.MAX_SIZE.width} pixels`,
      code: 'WIDTH_TOO_LARGE',
    });
  }

  if (typeof size.height !== 'number' || isNaN(size.height)) {
    errors.push({
      field: 'size.height',
      message: 'Height must be a valid number',
      code: 'INVALID_HEIGHT_TYPE',
    });
  } else if (size.height < VALIDATION_CONSTANTS.MIN_SIZE.height) {
    errors.push({
      field: 'size.height',
      message: `Height must be at least ${VALIDATION_CONSTANTS.MIN_SIZE.height} pixels`,
      code: 'HEIGHT_TOO_SMALL',
    });
  } else if (size.height > VALIDATION_CONSTANTS.MAX_SIZE.height) {
    errors.push({
      field: 'size.height',
      message: `Height must be less than ${VALIDATION_CONSTANTS.MAX_SIZE.height} pixels`,
      code: 'HEIGHT_TOO_LARGE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Enforce minimum size constraints
 */
export function enforceMinimumSize(size: Size): Size {
  return {
    width: Math.max(size.width, VALIDATION_CONSTANTS.MIN_SIZE.width),
    height: Math.max(size.height, VALIDATION_CONSTANTS.MIN_SIZE.height),
  };
}

// ============================================================================
// POSITION VALIDATION
// ============================================================================

/**
 * Validate position coordinates
 */
export function validatePosition(position: Position): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof position.x !== 'number' || isNaN(position.x)) {
    errors.push({
      field: 'position.x',
      message: 'X coordinate must be a valid number',
      code: 'INVALID_X_TYPE',
    });
  }

  if (typeof position.y !== 'number' || isNaN(position.y)) {
    errors.push({
      field: 'position.y',
      message: 'Y coordinate must be a valid number',
      code: 'INVALID_Y_TYPE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate position is within map boundaries
 */
export function validateBoundaryConstraints(
  position: Position,
  size: Size,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): ValidationResult {
  const errors: ValidationError[] = [];

  if (position.x < bounds.minX) {
    errors.push({
      field: 'position.x',
      message: `X position must be at least ${bounds.minX}`,
      code: 'X_OUT_OF_BOUNDS_MIN',
    });
  }

  if (position.y < bounds.minY) {
    errors.push({
      field: 'position.y',
      message: `Y position must be at least ${bounds.minY}`,
      code: 'Y_OUT_OF_BOUNDS_MIN',
    });
  }

  if (position.x + size.width > bounds.maxX) {
    errors.push({
      field: 'position.x',
      message: `Module extends beyond right boundary (max: ${bounds.maxX})`,
      code: 'X_OUT_OF_BOUNDS_MAX',
    });
  }

  if (position.y + size.height > bounds.maxY) {
    errors.push({
      field: 'position.y',
      message: `Module extends beyond bottom boundary (max: ${bounds.maxY})`,
      code: 'Y_OUT_OF_BOUNDS_MAX',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Clamp position within boundaries
 */
export function clampToBoundaries(
  position: Position,
  size: Size,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): Position {
  return {
    x: Math.max(bounds.minX, Math.min(position.x, bounds.maxX - size.width)),
    y: Math.max(bounds.minY, Math.min(position.y, bounds.maxY - size.height)),
  };
}

// ============================================================================
// ROTATION VALIDATION
// ============================================================================

/**
 * Validate rotation angle
 */
export function validateRotation(rotation: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof rotation !== 'number' || isNaN(rotation)) {
    errors.push({
      field: 'rotation',
      message: 'Rotation must be a valid number',
      code: 'INVALID_ROTATION_TYPE',
    });
  } else if (rotation < VALIDATION_CONSTANTS.MIN_ROTATION || rotation > VALIDATION_CONSTANTS.MAX_ROTATION) {
    errors.push({
      field: 'rotation',
      message: `Rotation must be between ${VALIDATION_CONSTANTS.MIN_ROTATION} and ${VALIDATION_CONSTANTS.MAX_ROTATION} degrees`,
      code: 'ROTATION_OUT_OF_RANGE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize rotation to 0-360 range
 */
export function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

// ============================================================================
// Z-INDEX VALIDATION
// ============================================================================

/**
 * Validate z-index
 */
export function validateZIndex(zIndex: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof zIndex !== 'number' || isNaN(zIndex)) {
    errors.push({
      field: 'zIndex',
      message: 'Z-Index must be a valid number',
      code: 'INVALID_ZINDEX_TYPE',
    });
  } else if (zIndex < VALIDATION_CONSTANTS.MIN_Z_INDEX) {
    errors.push({
      field: 'zIndex',
      message: `Z-Index must be at least ${VALIDATION_CONSTANTS.MIN_Z_INDEX}`,
      code: 'ZINDEX_TOO_SMALL',
    });
  } else if (zIndex > VALIDATION_CONSTANTS.MAX_Z_INDEX) {
    errors.push({
      field: 'zIndex',
      message: `Z-Index must be less than ${VALIDATION_CONSTANTS.MAX_Z_INDEX}`,
      code: 'ZINDEX_TOO_LARGE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// METADATA VALIDATION
// ============================================================================

/**
 * Validate module name
 */
export function validateName(name: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name must be a string',
      code: 'INVALID_NAME_TYPE',
    });
  } else if (name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Name cannot be empty',
      code: 'NAME_EMPTY',
    });
  } else if (name.length > VALIDATION_CONSTANTS.MAX_NAME_LENGTH) {
    errors.push({
      field: 'name',
      message: `Name must be less than ${VALIDATION_CONSTANTS.MAX_NAME_LENGTH} characters`,
      code: 'NAME_TOO_LONG',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate capacity
 */
export function validateCapacity(capacity: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof capacity !== 'number' || isNaN(capacity)) {
    errors.push({
      field: 'capacity',
      message: 'Capacity must be a valid number',
      code: 'INVALID_CAPACITY_TYPE',
    });
  } else if (!Number.isInteger(capacity)) {
    errors.push({
      field: 'capacity',
      message: 'Capacity must be a whole number',
      code: 'CAPACITY_NOT_INTEGER',
    });
  } else if (capacity < VALIDATION_CONSTANTS.MIN_CAPACITY) {
    errors.push({
      field: 'capacity',
      message: `Capacity must be at least ${VALIDATION_CONSTANTS.MIN_CAPACITY}`,
      code: 'CAPACITY_TOO_SMALL',
    });
  } else if (capacity > VALIDATION_CONSTANTS.MAX_CAPACITY) {
    errors.push({
      field: 'capacity',
      message: `Capacity must be less than ${VALIDATION_CONSTANTS.MAX_CAPACITY}`,
      code: 'CAPACITY_TOO_LARGE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate price
 */
export function validatePrice(price: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof price !== 'number' || isNaN(price)) {
    errors.push({
      field: 'price',
      message: 'Price must be a valid number',
      code: 'INVALID_PRICE_TYPE',
    });
  } else if (price < VALIDATION_CONSTANTS.MIN_PRICE) {
    errors.push({
      field: 'price',
      message: `Price must be at least ${VALIDATION_CONSTANTS.MIN_PRICE}`,
      code: 'PRICE_TOO_SMALL',
    });
  } else if (price > VALIDATION_CONSTANTS.MAX_PRICE) {
    errors.push({
      field: 'price',
      message: `Price must be less than ${VALIDATION_CONSTANTS.MAX_PRICE}`,
      code: 'PRICE_TOO_LARGE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// MODULE VALIDATION
// ============================================================================

/**
 * Validate complete module data
 */
export function validateModule(module: AnyModule, mapBounds?: CampsiteMap['bounds']): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate position
  const positionResult = validatePosition(module.position);
  errors.push(...positionResult.errors);

  // Validate size
  const sizeResult = validateSize(module.size);
  errors.push(...sizeResult.errors);

  // Validate rotation
  const rotationResult = validateRotation(module.rotation);
  errors.push(...rotationResult.errors);

  // Validate z-index
  const zIndexResult = validateZIndex(module.zIndex);
  errors.push(...zIndexResult.errors);

  // Validate boundary constraints if map bounds provided
  if (mapBounds) {
    const boundaryResult = validateBoundaryConstraints(module.position, module.size, mapBounds);
    errors.push(...boundaryResult.errors);
  }

  // Validate metadata name if present
  if (module.metadata && 'name' in module.metadata && typeof module.metadata.name === 'string') {
    const nameResult = validateName(module.metadata.name);
    errors.push(...nameResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// CLIPBOARD VALIDATION
// ============================================================================

const isObjectLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isPositionLike = (value: unknown): value is Position =>
  isObjectLike(value) && 'x' in value && 'y' in value;

const isSizeLike = (value: unknown): value is Size =>
  isObjectLike(value) && 'width' in value && 'height' in value;

/**
 * Validate clipboard data structure
 */
export function validateClipboardData(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(data)) {
    errors.push({
      field: 'clipboard',
      message: 'Clipboard data must be an array',
      code: 'INVALID_CLIPBOARD_TYPE',
    });
    return { isValid: false, errors };
  }

  if (data.length === 0) {
    errors.push({
      field: 'clipboard',
      message: 'Clipboard is empty',
      code: 'CLIPBOARD_EMPTY',
    });
    return { isValid: false, errors };
  }

  // Validate each module in clipboard
  data.forEach((moduleCandidate, index) => {
    if (!isObjectLike(moduleCandidate)) {
      errors.push({
        field: `clipboard[${index}]`,
        message: 'Invalid module data',
        code: 'INVALID_MODULE_DATA',
      });
      return;
    }

    const requiredFields: Array<keyof AnyModule | 'metadata'> = [
      'id',
      'type',
      'position',
      'size',
      'rotation',
      'zIndex',
      'metadata',
    ];

    requiredFields.forEach((field) => {
      if (!(field in moduleCandidate)) {
        errors.push({
          field: `clipboard[${index}].${String(field)}`,
          message: `Missing required field: ${String(field)}`,
          code: 'MISSING_REQUIRED_FIELD',
        });
      }
    });

    if ('position' in moduleCandidate && 'size' in moduleCandidate) {
      const positionValue = moduleCandidate.position;
      const sizeValue = moduleCandidate.size;

      if (isPositionLike(positionValue) && isSizeLike(sizeValue)) {
        const moduleResult = validateModule(moduleCandidate as unknown as AnyModule);
        errors.push(
          ...moduleResult.errors.map((err) => ({
            ...err,
            field: `clipboard[${index}].${err.field}`,
          }))
        );
      } else {
        errors.push({
          field: `clipboard[${index}]`,
          message: 'Module has invalid position or size data',
          code: 'INVALID_MODULE_DATA',
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize clipboard data by removing invalid modules
 */
export function sanitizeClipboardData(data: unknown[]): AnyModule[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.reduce<AnyModule[]>((validModules, moduleCandidate) => {
    if (isObjectLike(moduleCandidate)) {
      const module = moduleCandidate as unknown as AnyModule;
      if (validateModule(module).isValid) {
        validModules.push(module);
      }
    }
    return validModules;
  }, []);
}

// ============================================================================
// PROPERTY VALUE VALIDATION
// ============================================================================

/**
 * Validate property value based on property name and type
 */
export function validatePropertyValue(
  property: string,
  value: unknown,
  _moduleType?: ModuleType
): ValidationResult {
  switch (property) {
    case 'position':
      if (!isPositionLike(value)) {
        return {
          isValid: false,
          errors: [{
            field: property,
            message: 'Position must include numeric x and y coordinates',
            code: 'INVALID_POSITION_TYPE',
          }],
        };
      }
      return validatePosition(value);
    
    case 'size':
      if (!isSizeLike(value)) {
        return {
          isValid: false,
          errors: [{
            field: property,
            message: 'Size must include numeric width and height',
            code: 'INVALID_SIZE_TYPE',
          }],
        };
      }
      return validateSize(value);
    
    case 'rotation':
      return validateRotation(value as number);
    
    case 'zIndex':
      return validateZIndex(value as number);
    
    case 'name':
      return validateName(value as string);
    
    case 'capacity':
      return validateCapacity(value as number);
    
    case 'basePrice':
    case 'price':
      return validatePrice(value as number);
    
    case 'locked':
    case 'visible':
    case 'accessible':
    case 'potable':
    case 'weatherproof':
      if (typeof value !== 'boolean') {
        return {
          isValid: false,
          errors: [{
            field: property,
            message: `${property} must be a boolean`,
            code: 'INVALID_BOOLEAN_TYPE',
          }],
        };
      }
      return { isValid: true, errors: [] };
    
    default:
      // For unknown properties, just check if value is not null/undefined
      if (value === null || value === undefined) {
        return {
          isValid: false,
          errors: [{
            field: property,
            message: `${property} is required`,
            code: 'VALUE_REQUIRED',
          }],
        };
      }
      return { isValid: true, errors: [] };
  }
}

// ============================================================================
// ERROR RECOVERY
// ============================================================================

/**
 * Attempt to recover from invalid module state
 */
export function recoverModuleState(module: AnyModule, mapBounds?: CampsiteMap['bounds']): AnyModule {
  const recovered = { ...module };

  // Enforce minimum size
  recovered.size = enforceMinimumSize(recovered.size);

  // Normalize rotation
  recovered.rotation = normalizeRotation(recovered.rotation);

  // Clamp z-index
  recovered.zIndex = Math.max(
    VALIDATION_CONSTANTS.MIN_Z_INDEX,
    Math.min(recovered.zIndex, VALIDATION_CONSTANTS.MAX_Z_INDEX)
  );

  // Clamp position to boundaries if provided
  if (mapBounds) {
    recovered.position = clampToBoundaries(recovered.position, recovered.size, mapBounds);
  }

  return recovered;
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Convert validation errors to user-friendly messages
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    const firstError = errors[0];
    return firstError ? firstError.message : '';
  }
  
  return `Multiple errors:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
}

/**
 * Get user-friendly error message for a specific error code
 */
export function getUserFriendlyMessage(code: string): string {
  const messages: Record<string, string> = {
    WIDTH_TOO_SMALL: 'The module is too small. Minimum width is 20 pixels.',
    HEIGHT_TOO_SMALL: 'The module is too small. Minimum height is 20 pixels.',
    WIDTH_TOO_LARGE: 'The module is too large. Please reduce the width.',
    HEIGHT_TOO_LARGE: 'The module is too large. Please reduce the height.',
    X_OUT_OF_BOUNDS_MIN: 'The module is outside the map boundaries on the left.',
    Y_OUT_OF_BOUNDS_MIN: 'The module is outside the map boundaries on the top.',
    X_OUT_OF_BOUNDS_MAX: 'The module is outside the map boundaries on the right.',
    Y_OUT_OF_BOUNDS_MAX: 'The module is outside the map boundaries on the bottom.',
    ROTATION_OUT_OF_RANGE: 'Rotation must be between 0 and 360 degrees.',
    NAME_EMPTY: 'Please enter a name for this module.',
    NAME_TOO_LONG: 'The name is too long. Please use fewer characters.',
    CAPACITY_NOT_INTEGER: 'Capacity must be a whole number.',
    CAPACITY_TOO_SMALL: 'Capacity must be at least 0.',
    PRICE_TOO_SMALL: 'Price must be at least 0.',
    CLIPBOARD_EMPTY: 'Nothing to paste. Please copy a module first.',
    INVALID_MODULE_DATA: 'The clipboard contains invalid data.',
  };

  return messages[code] || 'An error occurred. Please check your input.';
}
