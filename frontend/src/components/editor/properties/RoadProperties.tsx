/**
 * RoadProperties Component
 * Property editor for road modules - simpler, validates basic flow
 */

import React from 'react';
import type { RoadModule } from '@/types';
import { PropertySection } from './PropertySection';
import { NumberStepper, Select } from '@/components/ui';
import { validateName, validateWidth, validateSpeedLimit } from './propertyValidation';
import { usePropertyValidation } from '@/hooks/editor/usePropertyValidation';
import { ValidatedTextInput } from './ValidatedTextInput';
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

    const { errors, validFields, validate } = usePropertyValidation({
        name: (v) => validateName(v as string),
        width: (v) => validateWidth(v as number),
        speedLimit: (v) => validateSpeedLimit(v as number),
    });

    return (
        <PropertySection title="Road Details" icon={Route} defaultExpanded>
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
                        if (validate('width', v)) {
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
                        if (validate('speedLimit', v)) {
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
