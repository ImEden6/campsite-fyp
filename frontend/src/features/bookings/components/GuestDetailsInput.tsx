/**
 * GuestDetailsInput Component
 * Allows users to input details for all guests (adults and children)
 * Required for security purposes at the campsite
 */

import { useEffect, useRef, useCallback } from 'react';
import { User, Baby, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export interface GuestDetail {
    firstName: string;
    lastName: string;
    isChild: boolean;
    age?: number | undefined; // Optional, mainly for children
}

interface GuestDetailsInputProps {
    adults: number;
    children: number;
    guestDetails: GuestDetail[];
    onChange: (guests: GuestDetail[]) => void;
    primaryGuestInfo?: {
        firstName: string;
        lastName: string;
    } | undefined;
    errors?: Record<string, string | undefined>;
}

export const GuestDetailsInput: React.FC<GuestDetailsInputProps> = ({
    adults,
    children,
    guestDetails,
    onChange,
    primaryGuestInfo,
    errors,
}) => {
    const totalGuests = adults + children;

    // Track previous total to detect changes
    const prevTotalRef = useRef<number | null>(null);

    // Memoize the guest initialization to avoid stale closures
    const initializeGuests = useCallback(() => {
        const newGuests: GuestDetail[] = [];

        // Add adults
        for (let i = 0; i < adults; i++) {
            // First adult uses primary guest info if available
            if (i === 0 && primaryGuestInfo) {
                newGuests.push({
                    firstName: primaryGuestInfo.firstName,
                    lastName: primaryGuestInfo.lastName,
                    isChild: false,
                });
            } else {
                // Keep existing data if available
                const existingAdult = guestDetails.filter(g => !g.isChild)[i];
                newGuests.push(existingAdult || {
                    firstName: '',
                    lastName: '',
                    isChild: false,
                });
            }
        }

        // Add children
        for (let i = 0; i < children; i++) {
            const existingChild = guestDetails.filter(g => g.isChild)[i];
            newGuests.push(existingChild || {
                firstName: '',
                lastName: '',
                isChild: true,
            });
        }

        return newGuests;
    }, [adults, children, guestDetails, primaryGuestInfo]);

    // Initialize guest details when adult/children counts change
    useEffect(() => {
        // Only reinitialize when the total guest count changes
        if (prevTotalRef.current !== totalGuests) {
            prevTotalRef.current = totalGuests;

            if (guestDetails.length !== totalGuests) {
                onChange(initializeGuests());
            }
        }
    }, [totalGuests, guestDetails.length, onChange, initializeGuests]);

    const handleUpdate = (index: number, field: keyof GuestDetail, value: string | number | boolean | undefined) => {
        const newGuests = [...guestDetails];
        if (newGuests[index]) {
            newGuests[index] = { ...newGuests[index], [field]: value };
            onChange(newGuests);
        }
    };

    const adultGuests = guestDetails.filter(g => !g.isChild);
    const childGuests = guestDetails.filter(g => g.isChild);

    return (
        <div className="space-y-6">
            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Security Requirement:</strong> Please provide names for all guests visiting the campsite.
                    This information is required for check-in and safety purposes.
                </p>
            </div>

            {/* Adults Section */}
            {adults > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-primary-100 flex items-center gap-2">
                        <User size={20} className="text-blue-600 dark:text-blue-400" />
                        Adults ({adults})
                    </h3>

                    {adultGuests.map((guest, index) => {
                        const globalIndex = index;
                        const isPrimary = index === 0 && primaryGuestInfo;

                        return (
                            <Card key={`adult-${index}`} className="p-4 dark:bg-night-surface dark:border-secondary-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-secondary-300">
                                        {isPrimary ? 'Primary Guest (You)' : `Adult ${index + 1}`}
                                    </span>
                                    {isPrimary && (
                                        <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                            Primary
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor={`guest_${globalIndex}_firstName`} className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                                            First Name *
                                        </label>
                                        <Input
                                            id={`guest_${globalIndex}_firstName`}
                                            type="text"
                                            value={guest.firstName}
                                            onChange={(e) => handleUpdate(globalIndex, 'firstName', e.target.value)}
                                            placeholder="First name"
                                            disabled={!!isPrimary}
                                            className={isPrimary ? 'bg-gray-100 dark:bg-night-surface-alt' : ''}
                                            icon={<User className="text-secondary-400 w-4 h-4" />}
                                        />
                                        {errors?.[`guest_${globalIndex}_firstName`] && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                <AlertCircle size={14} />
                                                {errors[`guest_${globalIndex}_firstName`]}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor={`guest_${globalIndex}_lastName`} className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                                            Last Name *
                                        </label>
                                        <Input
                                            id={`guest_${globalIndex}_lastName`}
                                            type="text"
                                            value={guest.lastName}
                                            onChange={(e) => handleUpdate(globalIndex, 'lastName', e.target.value)}
                                            placeholder="Last name"
                                            disabled={!!isPrimary}
                                            className={isPrimary ? 'bg-gray-100 dark:bg-night-surface-alt' : ''}
                                            icon={<User className="text-secondary-400 w-4 h-4" />}
                                        />
                                        {errors?.[`guest_${globalIndex}_lastName`] && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                <AlertCircle size={14} />
                                                {errors[`guest_${globalIndex}_lastName`]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Children Section */}
            {children > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-primary-100 flex items-center gap-2">
                        <Baby size={20} className="text-purple-600 dark:text-purple-400" />
                        Children ({children})
                    </h3>

                    {childGuests.map((guest, index) => {
                        const globalIndex = adults + index;

                        return (
                            <Card key={`child-${index}`} className="p-4 dark:bg-night-surface dark:border-secondary-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-secondary-300">
                                        Child {index + 1}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor={`guest_${globalIndex}_firstName`} className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                                            First Name *
                                        </label>
                                        <Input
                                            id={`guest_${globalIndex}_firstName`}
                                            type="text"
                                            value={guest.firstName}
                                            onChange={(e) => handleUpdate(globalIndex, 'firstName', e.target.value)}
                                            placeholder="First name"
                                            icon={<User className="text-secondary-400 w-4 h-4" />}
                                        />
                                        {errors?.[`guest_${globalIndex}_firstName`] && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                <AlertCircle size={14} />
                                                {errors[`guest_${globalIndex}_firstName`]}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor={`guest_${globalIndex}_lastName`} className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                                            Last Name *
                                        </label>
                                        <Input
                                            id={`guest_${globalIndex}_lastName`}
                                            type="text"
                                            value={guest.lastName}
                                            onChange={(e) => handleUpdate(globalIndex, 'lastName', e.target.value)}
                                            placeholder="Last name"
                                            icon={<User className="text-secondary-400 w-4 h-4" />}
                                        />
                                        {errors?.[`guest_${globalIndex}_lastName`] && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                <AlertCircle size={14} />
                                                {errors[`guest_${globalIndex}_lastName`]}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor={`guest_${globalIndex}_age`} className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                                            Age (Optional)
                                        </label>
                                        <Input
                                            id={`guest_${globalIndex}_age`}
                                            type="number"
                                            value={guest.age || ''}
                                            onChange={(e) => handleUpdate(globalIndex, 'age', e.target.value ? parseInt(e.target.value) : undefined)}
                                            placeholder="Age"
                                            min="0"
                                            max="17"
                                        />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-night-surface-alt/50 border border-gray-200 dark:border-secondary-600 p-4 rounded-lg">
                <p className="text-sm text-gray-900 dark:text-primary-100 font-medium">
                    <strong>Total Guests:</strong> {totalGuests} ({adults} adult{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''})
                </p>
            </div>
        </div>
    );
};
