/**
 * BookingSearchPanel
 * Shared search panel for check-in/check-out pages.
 * Renders a search form with loading, empty, and results states.
 * Uses render props for page-specific booking card content.
 */

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui';
import type { Booking } from '@/types';

export interface BookingSearchPanelProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    bookings: Booking[];
    isLoading: boolean;
    selectedBooking: Booking | null;
    onSelectBooking: (booking: Booking) => void;
    emptyMessage: string;
    emptySubMessage?: string;
    badgeVariant: 'info' | 'success';
    renderSecondaryInfo: (booking: Booking) => React.ReactNode;
    renderRightPanel: (booking: Booking) => React.ReactNode;
    searchLabel?: string;
    searchPlaceholder?: string;
}

export const BookingSearchPanel: React.FC<BookingSearchPanelProps> = ({
    searchTerm,
    onSearchChange,
    bookings,
    isLoading,
    selectedBooking,
    onSelectBooking,
    emptyMessage,
    emptySubMessage = 'Try searching by guest name, booking number, or site',
    badgeVariant,
    renderSecondaryInfo,
    renderRightPanel,
    searchLabel = 'Search Booking',
    searchPlaceholder = 'Search by guest name, booking number, or site...',
}) => {
    const renderSearchResults = () => {
        if (searchTerm.length < 3) {
            return (
                <div className="text-center py-12 text-secondary-500">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Enter at least 3 characters to search</p>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            );
        }

        if (bookings.length === 0) {
            return (
                <div className="text-center py-12 text-secondary-500">
                    <p>{emptyMessage}</p>
                    <p className="text-sm mt-1">{emptySubMessage}</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {bookings.map((booking) => (
                    <div
                        key={booking.id}
                        className="cursor-pointer"
                        onClick={() => onSelectBooking(booking)}
                    >
                        <GlassCard
                            className={`p-4 transition-all hover:bg-primary-50/50 dark:hover:bg-primary-900/10 ${selectedBooking?.id === booking.id ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
                            intensity="light"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100">
                                            {booking.user?.firstName} {booking.user?.lastName}
                                        </h4>
                                        <Badge variant={badgeVariant} className={
                                            badgeVariant === 'info'
                                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                                                : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                        }>{booking.bookingNumber}</Badge>
                                    </div>
                                    <div className="text-sm text-secondary-600 dark:text-secondary-400 space-y-1">
                                        {renderSecondaryInfo(booking)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {renderRightPanel(booking)}
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <GlassCard className="p-6 mb-8" intensity="medium">
            <form className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    {searchLabel}
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="pl-11 py-3"
                    />
                </div>
            </form>

            {renderSearchResults()}
        </GlassCard>
    );
};
