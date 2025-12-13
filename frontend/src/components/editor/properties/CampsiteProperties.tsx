/**
 * CampsiteProperties Component
 * Property editor for campsite modules - the most complex module type
 */

import React, { useState, useCallback } from 'react';
import type { CampsiteModule } from '@/types';
import { PropertySection } from './PropertySection';
import { NumberStepper, MultiSelectChips, FieldWithTooltip, Switch } from '@/components/ui';
import { validateCapacity, validatePrice, validateMultiplier, validateName } from './propertyValidation';
import { Tent } from 'lucide-react';

// Predefined amenities options
const AMENITY_OPTIONS = [
    'Fire Pit',
    'Picnic Table',
    'Shade Trees',
    'Lake View',
    'Mountain View',
    'River Access',
    'Privacy',
    'Flat Ground',
    'Gravel Pad',
    'Grass',
];

export interface CampsitePropertiesProps {
    module: CampsiteModule;
    onUpdate: (changes: Partial<CampsiteModule['metadata']>) => void;
    disabled?: boolean;
}

export const CampsiteProperties: React.FC<CampsitePropertiesProps> = ({
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
            case 'capacity':
                result = validateCapacity(value as number);
                break;
            case 'basePrice':
                result = validatePrice(value as number);
                break;
            case 'seasonalMultiplier':
                result = validateMultiplier(value as number);
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

    const handleChange = useCallback((field: string, value: unknown) => {
        if (handleValidation(field, value)) {
            if (field === 'basePrice' || field === 'seasonalMultiplier') {
                onUpdate({
                    pricing: {
                        ...metadata.pricing,
                        [field]: value,
                    },
                });
            } else {
                onUpdate({ [field]: value });
            }
        }
    }, [handleValidation, metadata.pricing, onUpdate]);

    return (
        <PropertySection title="Campsite Details" icon={Tent} defaultExpanded>
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

            {/* Capacity */}
            <NumberStepper
                label="Capacity"
                value={metadata.capacity}
                min={1}
                max={20}
                onChange={(v) => handleChange('capacity', v)}
                error={errors.capacity}
                showValidIcon={validFields.has('capacity')}
                disabled={disabled}
            />

            {/* Amenities */}
            <MultiSelectChips
                label="Amenities"
                value={metadata.amenities}
                options={AMENITY_OPTIONS}
                onChange={(v) => onUpdate({ amenities: v })}
                placeholder="No amenities selected. Click to add..."
                disabled={disabled}
            />

            {/* Pricing Section */}
            <div className="properties-panel__row">
                <FieldWithTooltip
                    label="Base Price"
                    tooltip="Nightly rate before seasonal adjustments"
                >
                    <NumberStepper
                        value={metadata.pricing.basePrice}
                        min={0}
                        max={1000}
                        step={5}
                        onChange={(v) => handleChange('basePrice', v)}
                        error={errors.basePrice}
                        disabled={disabled}
                    />
                </FieldWithTooltip>

                <FieldWithTooltip
                    label="Seasonal Multiplier"
                    tooltip="Price adjustment for peak seasons (1.0 = no change)"
                >
                    <NumberStepper
                        value={metadata.pricing.seasonalMultiplier}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onChange={(v) => handleChange('seasonalMultiplier', v)}
                        error={errors.seasonalMultiplier}
                        disabled={disabled}
                    />
                </FieldWithTooltip>
            </div>

            {/* Hookups */}
            <div className="properties-panel__toggles">
                <Switch
                    label="Electric Hookup"
                    checked={metadata.electricHookup}
                    onChange={(v) => onUpdate({ electricHookup: v })}
                    disabled={disabled}
                />
                <Switch
                    label="Water Hookup"
                    checked={metadata.waterHookup}
                    onChange={(v) => onUpdate({ waterHookup: v })}
                    disabled={disabled}
                />
                <Switch
                    label="Sewer Hookup"
                    checked={metadata.sewerHookup}
                    onChange={(v) => onUpdate({ sewerHookup: v })}
                    disabled={disabled}
                />
                <Switch
                    label="Accessible"
                    checked={metadata.accessibility}
                    onChange={(v) => onUpdate({ accessibility: v })}
                    disabled={disabled}
                />
            </div>
        </PropertySection>
    );
};

export default CampsiteProperties;
