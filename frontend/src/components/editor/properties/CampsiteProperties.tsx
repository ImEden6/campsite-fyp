/**
 * CampsiteProperties Component
 * Property editor for campsite modules - the most complex module type
 */

import React, { useCallback } from 'react';
import type { CampsiteModule } from '@/types';
import { PropertySection } from './PropertySection';
import { NumberStepper, MultiSelectChips, FieldWithTooltip, Switch } from '@/components/ui';
import { validateCapacity, validatePrice, validateMultiplier, validateName } from './propertyValidation';
import { usePropertyValidation } from '@/hooks/editor/usePropertyValidation';
import { ValidatedTextInput } from './ValidatedTextInput';
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

    const { errors, validFields, validate } = usePropertyValidation({
        name: (v) => validateName(v as string),
        capacity: (v) => validateCapacity(v as number),
        basePrice: (v) => validatePrice(v as number),
        seasonalMultiplier: (v) => validateMultiplier(v as number),
    });

    const handleChange = useCallback((field: string, value: unknown) => {
        if (validate(field, value)) {
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
    }, [validate, metadata.pricing, onUpdate]);

    return (
        <PropertySection title="Campsite Details" icon={Tent} defaultExpanded>
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
