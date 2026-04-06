import { useState, useCallback, useMemo } from 'react';

type Validator = (value: unknown) => { valid: boolean; error?: string };

export function usePropertyValidation(validators: Record<string, Validator>) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [validFields, setValidFields] = useState<Set<string>>(new Set());

    const validate = useCallback((field: string, value: unknown) => {
        const validator = validators[field];
        const result = validator ? validator(value) : { valid: true };

        if (result.valid) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
            setValidFields(prev => new Set(prev).add(field));
        } else {
            setErrors(prev => ({ ...prev, [field]: result.error || 'Invalid value' }));
            setValidFields(prev => {
                const next = new Set(prev);
                next.delete(field);
                return next;
            });
        }

        return result.valid;
    }, [validators]);

    const hasError = useCallback((field: string) => !!errors[field], [errors]);
    const isValid = useCallback((field: string) => validFields.has(field), [validFields]);
    const getError = useCallback((field: string) => errors[field], [errors]);

    return useMemo(() => ({
        errors,
        validFields,
        validate,
        hasError,
        isValid,
        getError,
    }), [errors, validFields, validate, hasError, isValid, getError]);
}
