/**
 * Validation Service
 * Implements IValidationService using existing validation utilities
 */

import type { IValidationService } from '../core/services';
import type { AnyModule, Position, Size, ModuleType, CampsiteMap } from '@/types';
import {
  validateModule as validateModuleUtil,
  validatePosition as validatePositionUtil,
  validateSize as validateSizeUtil,
  validateRotation as validateRotationUtil,
  validatePropertyValue as validatePropertyValueUtil,
  clampToBoundaries as clampToBoundariesUtil,
  enforceMinimumSize as enforceMinimumSizeUtil,
  type ValidationResult,
} from '@/utils/validationUtils';

export class ValidationService implements IValidationService {
  validateModule(
    module: AnyModule,
    mapBounds?: CampsiteMap['bounds']
  ): ValidationResult {
    return validateModuleUtil(module, mapBounds);
  }

  validatePosition(
    position: Position,
    size: Size,
    bounds?: CampsiteMap['bounds']
  ): ValidationResult {
    return validatePositionUtil(position, size, bounds);
  }

  validateSize(size: Size): ValidationResult {
    return validateSizeUtil(size);
  }

  validateRotation(rotation: number): ValidationResult {
    return validateRotationUtil(rotation);
  }

  validatePropertyValue(
    property: string,
    value: unknown,
    moduleType: ModuleType
  ): ValidationResult {
    return validatePropertyValueUtil(property, value, moduleType);
  }

  clampToBoundaries(
    position: Position,
    size: Size,
    bounds: CampsiteMap['bounds']
  ): Position {
    return clampToBoundariesUtil(position, size, bounds);
  }

  enforceMinimumSize(size: Size): Size {
    return enforceMinimumSizeUtil(size);
  }
}

