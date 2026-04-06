/**
 * BuildingProperties Component
 * Property editor for building modules with operating hours and services
 */

import React, { useMemo, useCallback } from 'react';
import type { BuildingModule } from '@/types';
import { PropertySection } from './PropertySection';
import { NumberStepper, MultiSelectChips, Select } from '@/components/ui';
import { validateCapacity, validateName, parseTimeString, formatTimeString } from './propertyValidation';
import { usePropertyValidation } from '@/hooks/editor/usePropertyValidation';
import { ValidatedTextInput } from './ValidatedTextInput';
import { Building } from 'lucide-react';

// Building type options
const BUILDING_TYPE_OPTIONS = [
    { value: 'office', label: 'Office' },
    { value: 'reception', label: 'Reception' },
    { value: 'store', label: 'Store' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'activity_center', label: 'Activity Center' },
    { value: 'other', label: 'Other' },
];

// Common services
const SERVICE_OPTIONS = [
    'WiFi',
    'Restrooms',
    'Showers',
    'Laundry',
    'Food',
    'Equipment Rental',
    'Information',
    'First Aid',
    'Phone Charging',
    'Package Storage',
];

export interface BuildingPropertiesProps {
    module: BuildingModule;
    onUpdate: (changes: Partial<BuildingModule['metadata']>) => void;
    disabled?: boolean;
}

export const BuildingProperties: React.FC<BuildingPropertiesProps> = ({
    module,
    onUpdate,
    disabled = false,
}) => {
    const { metadata } = module;

    // Parse operating hours (memoized to prevent dependency changes)
    const openTime = useMemo(() =>
        parseTimeString(metadata.operatingHours.open) || { hours: 9, minutes: 0 },
        [metadata.operatingHours.open]
    );
    const closeTime = useMemo(() =>
        parseTimeString(metadata.operatingHours.close) || { hours: 17, minutes: 0 },
        [metadata.operatingHours.close]
    );

    const { errors, validFields, validate } = usePropertyValidation({
        name: (v) => validateName(v as string),
        capacity: (v) => validateCapacity(v as number, 1, 500),
    });

    const handleTimeChange = useCallback((
        type: 'open' | 'close',
        part: 'hours' | 'minutes',
        value: number
    ) => {
        const current = type === 'open' ? openTime : closeTime;
        const newTime = { ...current, [part]: value };

        onUpdate({
            operatingHours: {
                ...metadata.operatingHours,
                [type]: formatTimeString(newTime.hours, newTime.minutes),
            },
        });
    }, [metadata.operatingHours, onUpdate, openTime, closeTime]);

    return (
        <PropertySection title="Building Details" icon={Building} defaultExpanded>
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

            {/* Building Type */}
            <Select
                label="Building Type"
                value={metadata.buildingType}
                options={BUILDING_TYPE_OPTIONS}
                onChange={(v) => onUpdate({ buildingType: v as BuildingModule['metadata']['buildingType'] })}
                disabled={disabled}
            />

            {/* Capacity */}
            <NumberStepper
                label="Capacity"
                value={metadata.capacity}
                min={1}
                max={500}
                onChange={(v) => {
                    if (validate('capacity', v)) {
                        onUpdate({ capacity: v });
                    }
                }}
                error={errors.capacity}
                showValidIcon={validFields.has('capacity')}
                disabled={disabled}
            />

            {/* Operating Hours: Two number inputs for HH:MM */}
            <div className="properties-panel__field">
                <label>Operating Hours</label>
                <div className="properties-panel__row">
                    <div className="properties-panel__time-group">
                        <span className="properties-panel__time-label">Open</span>
                        <div className="properties-panel__time-inputs">
                            <NumberStepper
                                value={openTime.hours}
                                min={0}
                                max={23}
                                onChange={(v) => handleTimeChange('open', 'hours', v)}
                                disabled={disabled}
                            />
                            <span>:</span>
                            <NumberStepper
                                value={openTime.minutes}
                                min={0}
                                max={59}
                                step={15}
                                onChange={(v) => handleTimeChange('open', 'minutes', v)}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                    <div className="properties-panel__time-group">
                        <span className="properties-panel__time-label">Close</span>
                        <div className="properties-panel__time-inputs">
                            <NumberStepper
                                value={closeTime.hours}
                                min={0}
                                max={23}
                                onChange={(v) => handleTimeChange('close', 'hours', v)}
                                disabled={disabled}
                            />
                            <span>:</span>
                            <NumberStepper
                                value={closeTime.minutes}
                                min={0}
                                max={59}
                                step={15}
                                onChange={(v) => handleTimeChange('close', 'minutes', v)}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Services */}
            <MultiSelectChips
                label="Services"
                value={metadata.services}
                options={SERVICE_OPTIONS}
                onChange={(v) => onUpdate({ services: v })}
                placeholder="No services selected. Click to add..."
                disabled={disabled}
            />
        </PropertySection>
    );
};

export default BuildingProperties;
