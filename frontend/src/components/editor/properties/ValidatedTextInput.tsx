import React, { useCallback } from 'react';

export interface ValidatedTextInputProps {
    label: string;
    value: string;
    fieldName: string;
    errors: Record<string, string>;
    validFields: Set<string>;
    onChange: (value: string) => void;
    onBlur: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    as?: 'input' | 'textarea';
    rows?: number;
}

const stopPropagationHandlers = {
    onClick: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.stopPropagation();
        e.currentTarget.focus();
    },
    onDoubleClick: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.stopPropagation();
        e.currentTarget.select();
    },
    onMouseDown: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.stopPropagation();
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.stopPropagation();
    },
};

export const ValidatedTextInput: React.FC<ValidatedTextInputProps> = ({
    label,
    value,
    fieldName,
    errors,
    validFields,
    onChange,
    onBlur,
    disabled = false,
    placeholder,
    as = 'input',
    rows,
}) => {
    const hasError = !!errors[fieldName];
    const isValid = validFields.has(fieldName);
    const error = errors[fieldName];

    const fieldClassName = `properties-panel__field ${hasError ? 'properties-panel__field--error' : isValid ? 'properties-panel__field--valid' : ''}`;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value);
    }, [onChange]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onBlur(e.target.value);
    }, [onBlur]);

    const baseProps = {
        value,
        onChange: handleChange,
        onBlur: handleBlur,
        disabled,
        placeholder,
        ...stopPropagationHandlers,
    };

    return (
        <div className={fieldClassName}>
            <label>{label}</label>
            {as === 'textarea' ? (
                <textarea
                    className="properties-panel__textarea"
                    rows={rows ?? 3}
                    readOnly={false}
                    {...baseProps}
                />
            ) : (
                <input
                    type="text"
                    readOnly={false}
                    {...baseProps}
                />
            )}
            {hasError && <p className="properties-panel__field-error">{error}</p>}
        </div>
    );
};
