/**
 * CustomProperties Component
 * Property editor for custom modules with dynamic key-value properties
 */

import React, { useState, useCallback } from 'react';
import type { CustomModule } from '@/types';
import { PropertySection } from './PropertySection';
import { validateName, validateDescription } from './propertyValidation';
import { Puzzle } from 'lucide-react';

export interface CustomPropertiesProps {
    module: CustomModule;
    onUpdate: (changes: Partial<CustomModule['metadata']>) => void;
    disabled?: boolean;
}

export const CustomProperties: React.FC<CustomPropertiesProps> = ({
    module,
    onUpdate,
    disabled = false,
}) => {
    const { metadata } = module;

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [validFields, setValidFields] = useState<Set<string>>(new Set());

    const handleValidation = useCallback((field: string, value: unknown) => {
        let result: { valid: boolean; error?: string } = { valid: true };

        switch (field) {
            case 'name':
                result = validateName(value as string);
                break;
            case 'description':
                result = validateDescription(value as string);
                break;
        }

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
    }, []);

    // Get property entries for display
    const propertyEntries = Object.entries(metadata.properties || {});

    return (
        <PropertySection title="Custom Details" icon={Puzzle} defaultExpanded>
            {/* Name */}
            <div className={`properties-panel__field ${errors.name ? 'properties-panel__field--error' : validFields.has('name') ? 'properties-panel__field--valid' : ''}`}>
                <label>Name</label>
                <input
                    type="text"
                    value={metadata.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    onBlur={(e) => handleValidation('name', e.target.value)}
                    disabled={disabled}
                    readOnly={false}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.focus();
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.select();
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                    }}
                    onFocus={(e) => {
                        e.stopPropagation();
                    }}
                />
                {errors.name && <p className="properties-panel__field-error">{errors.name}</p>}
            </div>

            {/* Custom Type */}
            <div className="properties-panel__field">
                <label>Custom Type</label>
                <input
                    type="text"
                    value={metadata.customType}
                    onChange={(e) => onUpdate({ customType: e.target.value })}
                    placeholder="e.g., Landmark, Sign, Boundary"
                    disabled={disabled}
                    readOnly={false}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.focus();
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.select();
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                    }}
                    onFocus={(e) => {
                        e.stopPropagation();
                    }}
                />
            </div>

            {/* Description */}
            <div className={`properties-panel__field ${errors.description ? 'properties-panel__field--error' : validFields.has('description') ? 'properties-panel__field--valid' : ''}`}>
                <label>Description</label>
                <textarea
                    className="properties-panel__textarea"
                    value={metadata.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    onBlur={(e) => handleValidation('description', e.target.value)}
                    placeholder="Describe this custom module..."
                    rows={3}
                    disabled={disabled}
                    readOnly={false}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.focus();
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.select();
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                    }}
                    onFocus={(e) => {
                        e.stopPropagation();
                    }}
                />
                {errors.description && <p className="properties-panel__field-error">{errors.description}</p>}
            </div>

            {/* Dynamic Properties (read-only for now, simplified) */}
            {propertyEntries.length > 0 && (
                <div className="properties-panel__field">
                    <label>Custom Properties</label>
                    <div className="properties-panel__key-value-list">
                        {propertyEntries.map(([key, value]) => (
                            <div key={key} className="properties-panel__key-value">
                                <span className="properties-panel__key">{key}:</span>
                                <span className="properties-panel__value">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </PropertySection>
    );
};

export default CustomProperties;
