/**
 * RoadProperties Component
 * Property editor for road modules - simpler, validates basic flow
 */

import React, { useState, useCallback } from 'react';
import type { RoadModule } from '@/types';
import { PropertySection } from './PropertySection';
import { NumberStepper, Select } from '@/components/ui';
import { validateName, validateWidth, validateSpeedLimit } from './propertyValidation';
import { Route } from 'lucide-react';

// Road type options
const ROAD_TYPE_OPTIONS = [
    { value: 'main', label: 'Main Road' },
    { value: 'secondary', label: 'Secondary Road' },
    { value: 'path', label: 'Path' },
    { value: 'emergency', label: 'Emergency Access' },
];

// Surface type options
const SURFACE_TYPE_OPTIONS = [
    { value: 'paved', label: 'Paved' },
    { value: 'gravel', label: 'Gravel' },
    { value: 'dirt', label: 'Dirt' },
    { value: 'boardwalk', label: 'Boardwalk' },
];

// Access level options
const ACCESS_LEVEL_OPTIONS = [
    { value: 'public', label: 'Public' },
    { value: 'staff', label: 'Staff Only' },
    { value: 'emergency', label: 'Emergency Only' },
];

export interface RoadPropertiesProps {
    module: RoadModule;
    onUpdate: (changes: Partial<RoadModule['metadata']>) => void;
    disabled?: boolean;
}

export const RoadProperties: React.FC<RoadPropertiesProps> = ({
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
            case 'width':
                result = validateWidth(value as number);
                break;
            case 'speedLimit':
                result = validateSpeedLimit(value as number);
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

    return (
        <PropertySection title="Road Details" icon={Route} defaultExpanded>
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

            {/* Road Type */}
            <Select
                label="Road Type"
                value={metadata.roadType}
                options={ROAD_TYPE_OPTIONS}
                onChange={(v) => onUpdate({ roadType: v as RoadModule['metadata']['roadType'] })}
                disabled={disabled}
            />

            {/* Surface Type */}
            <Select
                label="Surface Type"
                value={metadata.surfaceType}
                options={SURFACE_TYPE_OPTIONS}
                onChange={(v) => onUpdate({ surfaceType: v as RoadModule['metadata']['surfaceType'] })}
                disabled={disabled}
            />

            {/* Width and Speed Limit */}
            <div className="properties-panel__row">
                <NumberStepper
                    label="Width (m)"
                    value={metadata.width}
                    min={1}
                    max={20}
                    step={0.5}
                    onChange={(v) => {
                        if (handleValidation('width', v)) {
                            onUpdate({ width: v });
                        }
                    }}
                    error={errors.width}
                    showValidIcon={validFields.has('width')}
                    disabled={disabled}
                />
                <NumberStepper
                    label="Speed Limit (km/h)"
                    value={metadata.speedLimit}
                    min={5}
                    max={50}
                    step={5}
                    onChange={(v) => {
                        if (handleValidation('speedLimit', v)) {
                            onUpdate({ speedLimit: v });
                        }
                    }}
                    error={errors.speedLimit}
                    showValidIcon={validFields.has('speedLimit')}
                    disabled={disabled}
                />
            </div>

            {/* Access Level */}
            <Select
                label="Access Level"
                value={metadata.accessLevel}
                options={ACCESS_LEVEL_OPTIONS}
                onChange={(v) => onUpdate({ accessLevel: v as RoadModule['metadata']['accessLevel'] })}
                disabled={disabled}
            />
        </PropertySection>
    );
};

export default RoadProperties;
