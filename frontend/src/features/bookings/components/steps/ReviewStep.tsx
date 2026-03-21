/**
 * ReviewStep Component
 * Step 5: Final review and confirmation for booking forms
 */

import React from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import type { Site, Vehicle } from '@/types';
import type { BookingFormData, BookingFormErrors } from '../../types';
import type { BookingPricing } from '@/services/api/bookings';
import { PricingBreakdown } from '../PricingBreakdown';

// ============================================================================
// TYPES
// ============================================================================

export interface ReviewStepProps {
    formData: BookingFormData;
    errors: BookingFormErrors;
    site: Site;
    pricing: BookingPricing | undefined;
    isPricingLoading: boolean;
    onUpdateSpecialRequests: (value: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ReviewStep: React.FC<ReviewStepProps> = ({
    formData,
    errors,
    site,
    pricing,
    isPricingLoading,
    onUpdateSpecialRequests,
}) => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                Review & Confirm
            </h2>

            {/* Booking Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                {/* Site Information */}
                <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Site Information
                    </h3>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{site.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 capitalize">
                        {site.type.toLowerCase().replace('_', ' ')}
                    </p>
                </div>

                {/* Dates */}
                <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Dates
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-900 dark:text-white">
                            {new Date(formData.checkInDate).toLocaleDateString()}
                        </span>
                        <span className="text-gray-500 dark:text-gray-300">→</span>
                        <span className="text-gray-900 dark:text-white">
                            {new Date(formData.checkOutDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Guests */}
                <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Guests
                    </h3>
                    <p className="text-sm text-gray-900 dark:text-white mb-2">
                        {formData.adults} Adult{formData.adults !== 1 ? 's' : ''}
                        {formData.children > 0 &&
                            `, ${formData.children} Child${formData.children !== 1 ? 'ren' : ''}`}
                        {formData.pets > 0 &&
                            `, ${formData.pets} Pet${formData.pets !== 1 ? 's' : ''}`}
                    </p>
                    {formData.guestDetails.length > 0 && (
                        <div className="space-y-1 mt-2">
                            {formData.guestDetails
                                .filter((g) => !g.isChild)
                                .map((guest, index) => (
                                    <p
                                        key={`adult-${index}`}
                                        className="text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {index === 0 ? '★' : '•'} {guest.firstName} {guest.lastName}{' '}
                                        {index === 0 && (
                                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                                (Primary)
                                            </span>
                                        )}
                                    </p>
                                ))}
                            {formData.guestDetails
                                .filter((g) => g.isChild)
                                .map((guest, index) => (
                                    <p
                                        key={`child-${index}`}
                                        className="text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        • {guest.firstName} {guest.lastName}{' '}
                                        <span className="text-xs text-purple-600 dark:text-purple-400">
                                            (Child{guest.age ? `, ${guest.age}` : ''})
                                        </span>
                                    </p>
                                ))}
                        </div>
                    )}
                </div>

                {/* Vehicles */}
                <div
                    className={
                        formData.equipmentReservations.length > 0 || formData.specialRequests
                            ? 'border-b border-gray-200 dark:border-gray-600 pb-3'
                            : 'pb-3'
                    }
                >
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Vehicles
                    </h3>
                    {formData.vehicles.length > 0 ? (
                        <div className="space-y-1">
                            {formData.vehicles.map((vehicle: Omit<Vehicle, 'id'>, index: number) => (
                                <p key={index} className="text-sm text-gray-900 dark:text-white">
                                    • {vehicle.year} {vehicle.make} {vehicle.model}{' '}
                                    <span className="text-gray-600 dark:text-gray-300">
                                        ({vehicle.type})
                                    </span>
                                </p>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No vehicles added
                        </p>
                    )}
                </div>

                {/* Equipment Rentals */}
                {formData.equipmentReservations.length > 0 && (
                    <div
                        className={
                            formData.specialRequests
                                ? 'border-b border-gray-200 dark:border-gray-600 pb-3'
                                : 'pb-3'
                        }
                    >
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Equipment Rentals
                        </h3>
                        <p className="text-sm text-gray-900 dark:text-white">
                            {formData.equipmentReservations.length} item(s) selected
                        </p>
                    </div>
                )}

                {/* Special Requests */}
                {formData.specialRequests && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Special Requests
                        </h3>
                        <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-600/50 p-3 rounded border border-gray-200 dark:border-gray-500">
                            {formData.specialRequests}
                        </p>
                    </div>
                )}
            </div>

            {/* Pricing Breakdown */}
            {pricing && <PricingBreakdown pricing={pricing} loading={isPricingLoading} />}

            {/* Special Requests Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Special Requests (Optional)
                </label>
                <textarea
                    value={formData.specialRequests}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        onUpdateSpecialRequests(e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                    placeholder="Any special requests or requirements..."
                />
            </div>


            {/* Submit Error */}
            {errors.submit && (
                <div className="flex items-center gap-2 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 p-3 rounded-lg">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{errors.submit}</p>
                </div>
            )}
        </div>
    );
};
