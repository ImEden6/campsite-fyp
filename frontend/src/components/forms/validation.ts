// Form validation utilities

export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean;
  message: string;
};

export type FieldValidation<T = unknown> = {
  rules: ValidationRule<T>[];
};

export type FormValidation<T extends Record<string, unknown>> = {
  [K in keyof T]?: FieldValidation<T[K]>;
};

export type ValidationErrors<T extends Record<string, unknown>> = {
  [K in keyof T]?: string;
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value: unknown) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule<string> => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || emailRegex.test(value);
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value === undefined || value === null || value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value === undefined || value === null || value <= max,
    message: message || `Must be no more than ${max}`,
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule<string> => ({
    validate: (value: string) => !value || regex.test(value),
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule<string> => ({
    validate: (value: string) => {
      const phoneRegex = /^[\d\s\-+()]+$/;
      return !value || (phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10);
    },
    message,
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule<string> => ({
    validate: (value: string) => {
      try {
        if (!value) return true;
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  date: (message = 'Please enter a valid date'): ValidationRule<Date | string> => ({
    validate: (value: Date | string) => {
      if (!value) return true;
      const date = value instanceof Date ? value : new Date(value);
      return !isNaN(date.getTime());
    },
    message,
  }),

  minDate: (minDate: Date, message?: string): ValidationRule<Date | string> => ({
    validate: (value: Date | string) => {
      if (!value) return true;
      const date = value instanceof Date ? value : new Date(value);
      return date >= minDate;
    },
    message: message || `Date must be on or after ${minDate.toLocaleDateString()}`,
  }),

  maxDate: (maxDate: Date, message?: string): ValidationRule<Date | string> => ({
    validate: (value: Date | string) => {
      if (!value) return true;
      const date = value instanceof Date ? value : new Date(value);
      return date <= maxDate;
    },
    message: message || `Date must be on or before ${maxDate.toLocaleDateString()}`,
  }),

  match: (fieldName: string, getFieldValue: () => unknown, message?: string): ValidationRule => ({
    validate: (value: unknown) => {
      const otherValue = getFieldValue();
      return value === otherValue;
    },
    message: message || `Must match ${fieldName}`,
  }),

  custom: (validator: (value: unknown) => boolean, message: string): ValidationRule => ({
    validate: validator,
    message,
  }),
};

// Validate a single field
export function validateField<T>(value: T, rules: ValidationRule<T>[]): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
}

// Validate entire form
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  validation: FormValidation<T>
): { isValid: boolean; errors: ValidationErrors<T> } {
  const errors: ValidationErrors<T> = {};
  let isValid = true;

  for (const field in validation) {
    const fieldValidation = validation[field];
    if (fieldValidation) {
      const error = validateField(values[field], fieldValidation.rules);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}

// Hook for form validation
export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validation: FormValidation<T>
) {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<ValidationErrors<T>>({});
  const [touched, setTouched] = React.useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validateFieldValue = (field: keyof T, value: unknown): string | null => {
    const fieldValidation = validation[field];
    if (!fieldValidation) return null;
    return validateField(value as T[keyof T], fieldValidation.rules);
  };

  const handleChange = (field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    
    // Validate on change if field has been touched
    if (touched[field]) {
      const error = validateFieldValue(field, value);
      setErrors((prev) => ({ ...prev, [field]: error || undefined }));
    }
  };

  const handleBlur = (field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateFieldValue(field, values[field]);
    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  };

  const handleSubmit = (onSubmit: (values: T) => void) => {
    return (e?: React.FormEvent) => {
      e?.preventDefault();
      
      const { isValid, errors: validationErrors } = validateForm(values, validation);
      setErrors(validationErrors);
      
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      setTouched(allTouched);

      if (isValid) {
        onSubmit(values);
      }
    };
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({} as Record<keyof T, boolean>);
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setErrors,
  };
}

// React import for the hook
import React from 'react';
