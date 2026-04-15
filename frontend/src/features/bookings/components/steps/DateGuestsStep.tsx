/**
 * DateGuestsStep Component
 * Step 1: Date selection and guest count for booking forms
 */

import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import DatePicker from '@/components/forms/DatePicker';
import Input from '@/components/ui/Input';
import type { Site } from '@/types';
import type { BookingFormData, BookingFormErrors } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface DateGuestsStepProps {
    formData: BookingFormData;
    errors: BookingFormErrors;
    site: Site;
    today: string;
    onUpdate: <K extends keyof BookingFormData>(field: K, value: BookingFormData[K]) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DateGuestsStep: React.FC<DateGuestsStepProps> = ({
    formData,
    errors,
    site,
    today,
    onUpdate,
}) => {
    const totalGuests = formData.adults + formData.children;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-secondary-900 dark:text-primary-100 flex items-center gap-2">
                <Calendar size={20} className="text-primary-600 dark:text-primary-400" />
                Select Dates & Guests
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Check-in Date */}
                <div>
                    <label
                        htmlFor="checkInDate"
                        className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5"
                    >
                        Check-in Date *
                    </label>
                    <DatePicker
                        value={formData.checkInDate ? new Date(formData.checkInDate) : null}
                        onChange={(date) => onUpdate('checkInDate', (date ? date.toISOString().split('T')[0] : '') as BookingFormData['checkInDate'])}
                        minDate={new Date(today)}
                        error={errors.checkInDate}
                    />
                </div>

                {/* Check-out Date */}
                <div>
                    <label
                        htmlFor="checkOutDate"
                        className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5"
                    >
                        Check-out Date *
                    </label>
                    <DatePicker
                        value={formData.checkOutDate ? new Date(formData.checkOutDate) : null}
                        onChange={(date) => onUpdate('checkOutDate', (date ? date.toISOString().split('T')[0] : '') as BookingFormData['checkOutDate'])}
                        minDate={formData.checkInDate ? new Date(formData.checkInDate) : new Date(today)}
                        error={errors.checkOutDate}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Adults */}
                <div>
                    <label
                        htmlFor="adults"
                        className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5"
                    >
                        Adults (18+) *
                    </label>
                    <Input
                        id="adults"
                        type="number"
                        value={formData.adults}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onUpdate('adults', parseInt(e.target.value) || 0)
                        }
                        min="1"
                        max={site.capacity}
                        className={errors.adults ? 'border-error-500 dark:border-error-400' : ''}
                    />
                    {errors.adults && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.adults}
                        </p>
                    )}
                </div>

                {/* Children */}
                <div>
                    <label
                        htmlFor="children"
                        className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5"
                    >
                        Children (0-17)
                    </label>
                    <Input
                        id="children"
                        type="number"
                        value={formData.children}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onUpdate('children', parseInt(e.target.value) || 0)
                        }
                        min="0"
                        max={site.capacity}
                    />
                </div>

                {/* Pets */}
                <div>
                    <label
                        htmlFor="pets"
                        className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5"
                    >
                        Pets
                    </label>
                    <Input
                        id="pets"
                        type="number"
                        value={formData.pets}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onUpdate('pets', parseInt(e.target.value) || 0)
                        }
                        min="0"
                        max="5"
                        disabled={!site.isPetFriendly}
                    />
                    {!site.isPetFriendly && (
                        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                            Pets not allowed at this site
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 p-4 rounded-xl">
                <p className="text-sm text-primary-900 dark:text-primary-200 font-medium">
                    <strong>Site Capacity:</strong> {site.capacity} guests |{' '}
                    <strong>Total Selected:</strong> {totalGuests} guest
                    {totalGuests !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
};
