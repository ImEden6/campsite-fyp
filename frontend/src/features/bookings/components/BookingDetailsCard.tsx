/**
 * BookingDetailsCard
 * Shared booking details card showing check-in, check-out, guests, and duration.
 * Used by both customer and guest booking detail pages.
 */

import React from 'react';
import { Calendar, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';

export interface BookingDetailsCardProps {
    checkInDate: Date | string;
    checkOutDate: Date | string;
    guests: { adults: number; children: number };
    nights: number;
    title?: string;
    durationLabel?: string;
    icon?: React.ComponentType<{ className?: string }>;
    children?: React.ReactNode;
}

export const BookingDetailsCard: React.FC<BookingDetailsCardProps> = ({
    checkInDate,
    checkOutDate,
    guests,
    nights,
    title = 'Booking Details',
    durationLabel = 'Duration',
    icon: Icon = CheckCircle,
    children,
}) => (
    <GlassCard className="p-6 md:p-8">
        <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <Icon className="w-5 h-5 text-green-500" />
            {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <div className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Check-in</div>
                    <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                        <div className="p-2 bg-primary-50 dark:bg-gray-800 rounded-lg">
                            <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="text-lg font-medium">{format(new Date(checkInDate), 'EEE, MMM dd, yyyy')}</span>
                    </div>
                </div>
                <div>
                    <div className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Check-out</div>
                    <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                        <div className="p-2 bg-primary-50 dark:bg-gray-800 rounded-lg">
                            <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="text-lg font-medium">{format(new Date(checkOutDate), 'EEE, MMM dd, yyyy')}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Guests</div>
                    <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                        <div className="p-2 bg-primary-50 dark:bg-gray-800 rounded-lg">
                            <Users className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="text-lg font-medium">
                            {guests.adults} Adults
                            {guests.children > 0 && `, ${guests.children} Children`}
                        </span>
                    </div>
                </div>
                <div>
                    <div className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">{durationLabel}</div>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100 pl-2">
                        {nights} Nights
                    </div>
                </div>
            </div>
        </div>

        {children}
    </GlassCard>
);
