/**
 * BuildingProperties Component
 * Property editor for building modules with operating hours and services
 */

import React, { useState, useCallback } from 'react';
import type { BuildingModule } from '@/types';
import { PropertySection } from './PropertySection';
import { NumberStepper, MultiSelectChips, Select } from '@/components/ui';
import { validateCapacity, validateName, parseTimeString, formatTimeString } from './propertyValidation';
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

    // Parse operating hours
    const openTime = parseTimeString(metadata.operatingHours.open) || { hours: 9, minutes: 0 };
    const closeTime = parseTimeString(metadata.operatingHours.close) || { hours: 17, minutes: 0 };

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [validFields, setValidFields] = useState<Set<string>>(new Set());

    const handleValidation = useCallback((field: string, value: unknown) => {
        let result: { valid: boolean; error?: string } = { valid: true };

        switch (field) {
            case 'name':
                result = validateName(value as string);
                break;
            case 'capacity':
                result = validateCapacity(value as number, 1, 500);
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
                    if (handleValidation('capacity', v)) {
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
