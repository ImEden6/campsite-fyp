/**
 * DateGuestsStep Component
 * Step 1: Date selection and guest count for booking forms
 */

import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                Select Dates & Guests
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Check-in Date */}
                <div>
                    <label
                        htmlFor="checkInDate"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Check-in Date *
                    </label>
                    <Input
                        id="checkInDate"
                        type="date"
                        value={formData.checkInDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onUpdate('checkInDate', e.target.value)
                        }
                        min={today}
                        className={errors.checkInDate ? 'border-red-500 dark:border-red-500' : ''}
                    />
                    {errors.checkInDate && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.checkInDate}
                        </p>
                    )}
                </div>

                {/* Check-out Date */}
                <div>
                    <label
                        htmlFor="checkOutDate"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Check-out Date *
                    </label>
                    <Input
                        id="checkOutDate"
                        type="date"
                        value={formData.checkOutDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onUpdate('checkOutDate', e.target.value)
                        }
                        min={formData.checkInDate || today}
                        className={errors.checkOutDate ? 'border-red-500 dark:border-red-500' : ''}
                    />
                    {errors.checkOutDate && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.checkOutDate}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Adults */}
                <div>
                    <label
                        htmlFor="adults"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                        className={errors.adults ? 'border-red-500 dark:border-red-500' : ''}
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
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Pets not allowed at this site
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                    <strong>Site Capacity:</strong> {site.capacity} guests |{' '}
                    <strong>Total Selected:</strong> {totalGuests} guest
                    {totalGuests !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
};
