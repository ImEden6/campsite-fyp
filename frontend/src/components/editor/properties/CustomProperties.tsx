/**
 * CustomProperties Component
 * Property editor for custom modules with dynamic key-value properties
 */

import React from 'react';
import type { CustomModule } from '@/types';
import { PropertySection } from './PropertySection';
import { validateName, validateDescription } from './propertyValidation';
import { usePropertyValidation } from '@/hooks/editor/usePropertyValidation';
import { ValidatedTextInput } from './ValidatedTextInput';
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

    const { errors, validFields, validate } = usePropertyValidation({
        name: (v) => validateName(v as string),
        description: (v) => validateDescription(v as string),
    });

    // Get property entries for display
    const propertyEntries = Object.entries(metadata.properties || {});

    return (
        <PropertySection title="Custom Details" icon={Puzzle} defaultExpanded>
            <ValidatedTextInput
                label="Name"
                value={metadata.name}
                fieldName="name"
                errors={errors}
                validFields={validFields}
                onChange={(v) => onUpdate({ name: v })}
                onBlur={(v) => validate('name', v)}
                disabled={disabled}
            />

            {/* Custom Type */}
            <ValidatedTextInput
                label="Custom Type"
                value={metadata.customType}
                fieldName="customType"
                errors={errors}
                validFields={validFields}
                onChange={(v) => onUpdate({ customType: v })}
                onBlur={() => {}}
                disabled={disabled}
                placeholder="e.g., Landmark, Sign, Boundary"
            />

            {/* Description */}
            <ValidatedTextInput
                label="Description"
                value={metadata.description}
                fieldName="description"
                errors={errors}
                validFields={validFields}
                onChange={(v) => onUpdate({ description: v })}
                onBlur={(v) => validate('description', v)}
                disabled={disabled}
                placeholder="Describe this custom module..."
                as="textarea"
                rows={3}
            />

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
