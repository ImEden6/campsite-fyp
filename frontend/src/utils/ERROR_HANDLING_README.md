# Error Handling and Validation Documentation

This document describes the comprehensive error handling and validation system implemented for the Konva map editor.

## Overview

The error handling and validation system provides:
- **Minimum size validation** (20x20 pixels)
- **Boundary constraint validation**
- **Clipboard data validation**
- **Property value validation**
- **Error recovery for invalid states**
- **User-friendly error messages**
- **Centralized error logging for debugging**

## Components

### 1. Validation Utilities (`validationUtils.ts`)

Provides validation functions for all module properties and operations.

#### Key Functions

##### Size Validation
```typescript
validateSize(size: Size): ValidationResult
enforceMinimumSize(size: Size): Size
```
- Validates width and height are at least 20 pixels
- Enforces maximum size constraints
- Returns validation errors with specific error codes

##### Position Validation
```typescript
validatePosition(position: Position): ValidationResult
validateBoundaryConstraints(position, size, bounds): ValidationResult
clampToBoundaries(position, size, bounds): Position
```
- Validates position coordinates are valid numbers
- Checks if module is within map boundaries
- Clamps position to valid boundaries when needed

##### Rotation Validation
```typescript
validateRotation(rotation: number): ValidationResult
normalizeRotation(rotation: number): number
```
- Validates rotation is between 0-360 degrees
- Normalizes rotation to valid range

##### Property Validation
```typescript
validatePropertyValue(property, value, moduleType): ValidationResult
validateName(name: string): ValidationResult
validateCapacity(capacity: number): ValidationResult
validatePrice(price: number): ValidationResult
```
- Validates specific property types
- Returns detailed error information
- Supports type-specific validation

##### Module Validation
```typescript
validateModule(module: AnyModule, mapBounds?): ValidationResult
```
- Validates complete module structure
- Checks all properties
- Validates against map boundaries if provided

##### Clipboard Validation
```typescript
validateClipboardData(data: any): ValidationResult
sanitizeClipboardData(data: any[]): AnyModule[]
```
- Validates clipboard data structure
- Removes invalid modules
- Ensures data integrity

##### Error Recovery
```typescript
recoverModuleState(module: AnyModule, mapBounds?): AnyModule
```
- Attempts to recover from invalid module state
- Enforces minimum size
- Normalizes rotation
- Clamps position to boundaries

##### User-Friendly Messages
```typescript
formatValidationErrors(errors: ValidationError[]): string
getUserFriendlyMessage(code: string): string
```
- Converts technical errors to user-friendly messages
- Provides helpful guidance for fixing issues

### 2. Error Logger (`errorLogger.ts`)

Centralized error logging system for debugging and monitoring.

#### Features

- **Severity Levels**: INFO, WARNING, ERROR, CRITICAL
- **Categories**: VALIDATION, TRANSFORM, CLIPBOARD, HISTORY, PROPERTY, NETWORK, RENDER, STATE
- **Console Output**: Formatted logging to browser console
- **Session Tracking**: Unique session IDs for debugging
- **Log Management**: Store up to 1000 log entries
- **Export Capability**: Export logs as JSON for analysis

#### Usage

```typescript
import errorLogger, { ErrorCategory } from '@/utils/errorLogger';

// Log info
errorLogger.info(ErrorCategory.VALIDATION, 'Validation passed', { moduleId: '123' });

// Log warning
errorLogger.warn(ErrorCategory.CLIPBOARD, 'Clipboard data sanitized', { count: 5 });

// Log error
errorLogger.error(ErrorCategory.TRANSFORM, 'Transform failed', { details }, error);

// Log critical error
errorLogger.critical(ErrorCategory.STATE, 'State corruption detected', { state }, error);
```

#### Convenience Functions

```typescript
import { logInfo, logWarning, logError, logCritical } from '@/utils/errorLogger';

logInfo(ErrorCategory.PROPERTY, 'Property updated');
logWarning(ErrorCategory.VALIDATION, 'Invalid value detected');
logError(ErrorCategory.TRANSFORM, 'Transform error', details, error);
logCritical(ErrorCategory.STATE, 'Critical failure', details, error);
```

## Implementation Details

### TransformHandles Component

**Validation Added:**
- Validates size during resize operations
- Enforces minimum size constraints (20x20 pixels)
- Logs warnings when constraints are violated
- Logs errors for transform failures

**Error Handling:**
- Try-catch blocks around mouse move operations
- Automatic enforcement of minimum size
- Detailed error logging with context

### RotationHandle Component

**Validation Added:**
- Validates rotation angle (0-360 degrees)
- Normalizes rotation to valid range
- Logs warnings for invalid angles

**Error Handling:**
- Try-catch blocks around rotation calculations
- Automatic normalization of invalid angles
- Detailed error logging

### ModuleRenderer Component

**Validation Added:**
- Validates position during drag operations
- Validates size during resize operations
- Validates boundary constraints
- Clamps position to map boundaries

**Error Handling:**
- Try-catch blocks around drag and resize operations
- Automatic recovery from invalid states
- Boundary clamping to prevent out-of-bounds modules
- Detailed error logging with module context

**Error Recovery:**
- Uses `recoverModuleState` to fix invalid modules
- Attempts to maintain user intent while enforcing constraints

### EditorStore

**Validation Added:**
- Validates clipboard data before copy/cut/paste
- Sanitizes invalid clipboard data
- Validates modules before duplication

**Error Handling:**
- Try-catch blocks around all clipboard operations
- Automatic sanitization of invalid data
- Detailed error logging for clipboard operations
- Graceful degradation (returns empty array on failure)

**User Feedback:**
- Logs info messages for successful operations
- Logs warnings when data is sanitized
- Logs errors when operations fail

### PropertiesPanel Component

**Validation Added:**
- Validates all property changes before applying
- Validates metadata changes
- Uses user-friendly error messages

**Error Handling:**
- Try-catch blocks around property updates
- Displays validation errors in UI
- Logs all validation failures
- Prevents invalid updates from being applied

**User Experience:**
- Shows inline error messages
- Clears errors when valid values are entered
- Provides helpful guidance for fixing issues

## Validation Constants

All validation constraints are defined in `VALIDATION_CONSTANTS`:

```typescript
{
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
}
```

## Error Codes

Common error codes and their meanings:

- `WIDTH_TOO_SMALL` / `HEIGHT_TOO_SMALL`: Module size below 20 pixels
- `WIDTH_TOO_LARGE` / `HEIGHT_TOO_LARGE`: Module size exceeds maximum
- `X_OUT_OF_BOUNDS_MIN` / `Y_OUT_OF_BOUNDS_MIN`: Module outside left/top boundary
- `X_OUT_OF_BOUNDS_MAX` / `Y_OUT_OF_BOUNDS_MAX`: Module outside right/bottom boundary
- `ROTATION_OUT_OF_RANGE`: Rotation not between 0-360 degrees
- `NAME_EMPTY`: Module name is empty
- `NAME_TOO_LONG`: Module name exceeds 100 characters
- `CAPACITY_NOT_INTEGER`: Capacity is not a whole number
- `CLIPBOARD_EMPTY`: Attempted to paste from empty clipboard
- `INVALID_MODULE_DATA`: Clipboard contains corrupted data

## User-Friendly Messages

The system provides user-friendly error messages for common issues:

- "The module is too small. Minimum width is 20 pixels."
- "The module is outside the map boundaries on the left."
- "Rotation must be between 0 and 360 degrees."
- "Please enter a name for this module."
- "Capacity must be a whole number."
- "Nothing to paste. Please copy a module first."

## Debugging

### Viewing Logs

Access logs in browser console or programmatically:

```typescript
import errorLogger from '@/utils/errorLogger';

// Get all logs
const allLogs = errorLogger.getLogs();

// Get recent logs
const recentLogs = errorLogger.getRecentLogs(10);

// Get logs by severity
const errors = errorLogger.getLogsBySeverity(ErrorSeverity.ERROR);

// Get logs by category
const validationLogs = errorLogger.getLogsByCategory(ErrorCategory.VALIDATION);

// Export logs
const logsJson = errorLogger.exportLogs();
console.log(logsJson);
```

### Log Format

Each log entry contains:
```typescript
{
  timestamp: Date,
  severity: ErrorSeverity,
  category: ErrorCategory,
  message: string,
  details?: any,
  stack?: string,
  sessionId: string
}
```

## Best Practices

### When to Validate

1. **Before State Changes**: Validate data before updating state
2. **During User Input**: Validate as user types/interacts
3. **Before API Calls**: Validate before sending to backend
4. **After Data Loading**: Validate data received from external sources

### When to Log

1. **Validation Failures**: Log warnings for validation issues
2. **Error Conditions**: Log errors for unexpected failures
3. **State Changes**: Log info for successful operations
4. **Critical Issues**: Log critical for system-level problems

### Error Recovery Strategy

1. **Attempt Automatic Recovery**: Try to fix invalid state
2. **Maintain User Intent**: Keep as much of user's action as possible
3. **Provide Feedback**: Show user-friendly messages
4. **Log for Debugging**: Record details for troubleshooting
5. **Graceful Degradation**: Fail safely without breaking UI

## Testing

### Manual Testing

1. Try to resize module below 20x20 pixels
2. Try to drag module outside map boundaries
3. Try to paste invalid clipboard data
4. Try to enter invalid property values
5. Check console for appropriate log messages

### Automated Testing

See `frontend/src/utils/__tests__/validationUtils.test.ts` for validation tests.

## Future Enhancements

1. **Remote Logging**: Send critical errors to monitoring service
2. **User Notifications**: Show toast messages for errors
3. **Undo on Error**: Automatically undo failed operations
4. **Validation Rules Engine**: Configurable validation rules
5. **Performance Monitoring**: Track validation performance
6. **Analytics Integration**: Track common validation failures

## Related Files

- `frontend/src/utils/validationUtils.ts` - Validation functions
- `frontend/src/utils/errorLogger.ts` - Error logging system
- `frontend/src/components/TransformHandles.tsx` - Resize validation
- `frontend/src/components/RotationHandle.tsx` - Rotation validation
- `frontend/src/components/ModuleRenderer.tsx` - Transform validation
- `frontend/src/stores/editorStore.ts` - Clipboard validation
- `frontend/src/components/PropertiesPanel.tsx` - Property validation
